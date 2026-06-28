/**
 * Stats Service - Database-backed analytics
 * 
 * Responsibilities:
 * - Save review statistics to database
 * - Track analysis metrics per PR, repo, user
 * - No file system writes, DB-only persistence
 */

const ConnectedRepo = require("../models/ConnectedRepo");
const PullRequestReview = require("../models/PullRequestReview");
const ErrorLog = require("../models/ErrorLog");
const RepoStats = require("../models/RepoStats");
const IssueTriage = require("../models/IssueTriage");

/**
 * Records review statistics for a PR
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pull_number - PR number
 * @param {string} params.commit_id - Commit SHA
 * @param {Object} params.analysis - Analysis result from llmService.analyzeDiff()
 * @param {Object} params.user - User object with _id
 * @returns {Promise<Object>} Created stats record
 * 
 * @example
 * const stats = await recordReview({
 *   owner: 'user',
 *   repo: 'repo',
 *   pull_number: 123,
 *   commit_id: 'abc123',
 *   analysis: {...},
 *   user: userDoc
 * });
 */
async function recordReview({ owner, repo, githubRepoId, pull_number, commit_id, analysis, user, repoId }) {
  try {
    const inlineCount = analysis?.inlineComments?.length || 0;
    // Total comments = 1 (review body) + inline comments
    const totalComments = 1 + inlineCount;
    
    // Use upsert to prevent duplicate reviews for same PR+commit
    // CRITICAL: commentsPosted is ONLY set on insert (locked forever after first write)
    const result = await PullRequestReview.findOneAndUpdate(
      { githubRepoId, pull_number, commit_id },
      {
        $setOnInsert: {
          owner,
          repo,
          githubRepoId,
          pull_number,
          commit_id,
          userId: user._id,
          repoId,
          analyzedAt: new Date(),
          // Lock commentsPosted on first insert - never update again
          // Includes: 1 review body comment + N inline comments
          commentsPosted: totalComments,
          filesAnalyzed: analysis?.filesAnalyzed?.length || 0,
          confidence: analysis?.confidence || "unknown"
        },
        $set: {
          // Only update analysis data, NOT counts
          analysis
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Check if this was a new record (upserted) or existing (updated)
    const isNewRecord = !result.updatedAt || result.createdAt.getTime() === result.updatedAt.getTime();
    
    if (isNewRecord) {
      // Update ConnectedRepo counters (for backward compat)
      await ConnectedRepo.findByIdAndUpdate(
        repoId,
        {
          $inc: { reviewCount: 1 },
          $set: { lastReviewedAt: new Date() }
        },
        { new: true }
      );
    }
    
    // NO RepoStats mutation here - rebuildRepoStats() is the single source of truth
    // This prevents $inc corruption from webhooks, retries, and LLM hallucinations
    
    const saved = result;

    console.log(`✅ Recorded review stats: ${owner}/${repo}#${pull_number}`);
    return saved;
  } catch (error) {
    console.error("❌ Failed to record review:", error.message);
    // Don't throw - stats recording is secondary
    return null;
  }
}

/**
 * Records an analysis error
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pull_number - PR number
 * @param {string} params.error - Error message
 * @param {Object} params.user - User object
 * @returns {Promise<void>}
 */
async function recordError({ owner, repo, githubRepoId, pull_number, error, user, repoId }) {
  try {
    await ErrorLog.create({
      owner,
      repo,
      githubRepoId,
      pull_number,
      userId: user?._id,
      error: error?.message || String(error),
      errorStack: error?.stack,
      createdAt: new Date()
    });

    // Update aggregated errors
    if (repoId) {
      await RepoStats.findOneAndUpdate(
        { repoId },
        {
          $setOnInsert: { repoId, githubRepoId, userId: user?._id },
          $inc: { totalErrors: 1 },
          $set: { lastErrorAt: new Date(), lastActivityAt: new Date() },
        },
        { upsert: true }
      );
    }

    console.log(`✅ Recorded error for PR ${owner}/${repo}#${pull_number}`);
  } catch (err) {
    console.error("❌ Failed to record error:", err.message);
  }
}

/**
 * Records issue triage and updates aggregated stats
 */
async function recordIssueTriage({ owner, repo, githubRepoId, issue_number, user, labelsApplied = [], summary = "", repoId }) {
  try {
    // Use upsert to prevent duplicate issue triage records
    // CRITICAL: labelsApplied is ONLY set on insert (locked forever after first triage)
    const result = await IssueTriage.findOneAndUpdate(
      { githubRepoId, issue_number },
      {
        $setOnInsert: {
          owner,
          repo,
          githubRepoId,
          issue_number,
          userId: user._id,
          repoId,
          // Lock labels on first insert - never update again
          labelsApplied,
          summary
        }
        // NO $set - if issue already triaged, we don't re-triage
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Check if this was a new record (upserted) or existing (updated)
    const isNewRecord = !result.updatedAt || result.createdAt.getTime() === result.updatedAt.getTime();
    
    if (!isNewRecord) {
      // Issue already triaged - do not update labels or stats
      console.log(`⏭️  Issue #${issue_number} already triaged, skipping`);
      return result;
    }
    
    // NO RepoStats mutation here - rebuildRepoStats() is the single source of truth
    // This prevents $inc corruption from webhooks, retries, and label hallucinations

    console.log(`✅ Recorded issue triage: ${owner}/${repo}#${issue_number}`);
  } catch (error) {
    console.error("❌ Failed to record issue triage:", error.message);
  }
}

// ============================================
// ANALYTICS & DEEP ANALYSIS FUNCTIONS
// ============================================

/**
 * Get PR review activity over time (for time-series graphs)
 * @param {string} userId - User MongoDB ObjectId
 * @param {string} repoId - Optional repo filter
 * @param {number} days - Number of days to look back (default 30)
 * @param {number} page - Page number for recent errors (default 1)
 * @param {number} perPage - Errors per page (default 10)
 * @returns {Promise<Array>} Daily activity data: [{ date, reviewCount, commentCount }]
 */
async function getReviewTimeSeries({ userId, repoId = null, days = 30 }) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = { userId, createdAt: { $gte: startDate } };
    if (repoId) query.repoId = repoId;

    const reviews = await PullRequestReview.find(query)
      .select('createdAt commentsPosted')
      .sort({ createdAt: 1 })
      .lean();

    // Group by date
    const dailyMap = new Map();
    reviews.forEach(r => {
      const dateKey = r.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, reviewCount: 0, commentCount: 0 });
      }
      const day = dailyMap.get(dateKey);
      day.reviewCount++;
      day.commentCount += r.commentsPosted || 0;
    });

    return Array.from(dailyMap.values());
  } catch (error) {
    console.error("Failed to get review time series:", error.message);
    return [];
  }
}

/**
 * Get recent activity feed (for dashboard "Recent Activity" section)
 * Includes both PR reviews and issue triages in unified list
 * @param {string} userId - User MongoDB ObjectId
 * @param {number} limit - Max items to return (default 20)
 * @returns {Promise<Array>} Recent activity: [{ type, repo, prNumber?, issueNumber?, ..., createdAt }]
 */
async function getRecentActivity({ userId, limit = 20 }) {
  try {
    // Get both PR reviews and issue triages
    const [reviews, triages] = await Promise.all([
      PullRequestReview.find({ userId })
        .select('owner repo pull_number filesAnalyzed commentsPosted createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      IssueTriage.find({ userId })
        .select('owner repo issue_number labelsApplied summary createdAt')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Map PR reviews with type indicator
    const reviewActivities = reviews.map(r => ({
      type: 'pr_review',
      repo: `${r.owner}/${r.repo}`,
      prNumber: r.pull_number,
      filesAnalyzed: r.filesAnalyzed || 0,
      commentsPosted: r.commentsPosted || 0,
      createdAt: r.createdAt
    }));

    // Map issue triages with type indicator
    const triageActivities = triages.map(t => ({
      type: 'issue_triage',
      repo: `${t.owner}/${t.repo}`,
      issueNumber: t.issue_number,
      labelsApplied: t.labelsApplied || [],
      summary: t.summary || '',
      createdAt: t.createdAt
    }));

    // Combine and sort by date, then limit
    const combined = [...reviewActivities, ...triageActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return combined;
  } catch (error) {
    console.error("Failed to get recent activity:", error.message);
    return [];
  }
}

/**
 * Get aggregated user-level stats (for top dashboard KPI cards)
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Object>} User-wide stats
 */
async function getUserSummary({ userId }) {
  try {
    // Rebuild stats to ensure they're fresh
    await rebuildRepoStats({ userId });

    const [repoStats, connectedRepos] = await Promise.all([
      RepoStats.find({ userId }).lean(),
      ConnectedRepo.countDocuments({ userId, isConnected: true })
    ]);

    const totalPRsReviewed = repoStats.reduce((sum, s) => sum + (s.totalPRsReviewed || 0), 0);
    const totalInlineComments = repoStats.reduce((sum, s) => sum + (s.totalInlineComments || 0), 0);
    const totalIssuesTriaged = repoStats.reduce((sum, s) => sum + (s.totalIssuesTriaged || 0), 0);
    const totalLabelsApplied = repoStats.reduce((sum, s) => sum + (s.totalLabelsApplied || 0), 0);
    const totalErrors = repoStats.reduce((sum, s) => sum + (s.totalErrors || 0), 0);

    return {
      connectedReposCount: connectedRepos,
      totalPRsReviewed,
      totalInlineComments,
      totalIssuesTriaged,
      totalLabelsApplied,
      totalErrors,
      avgCommentsPerPR: totalPRsReviewed > 0 ? (totalInlineComments / totalPRsReviewed).toFixed(1) : 0
    };
  } catch (error) {
    console.error("Failed to get user summary:", error.message);
    return null;
  }
}

/**
 * Get comment density analysis per repo (for insights page)
 * @param {string} repoId - Repository MongoDB ObjectId
 * @returns {Promise<Object>} Comment density metrics
 */
async function getCommentDensityAnalysis({ repoId }) {
  try {
    const reviews = await PullRequestReview.find({ repoId })
      .select('filesAnalyzed commentsPosted pull_number')
      .lean();

    if (!reviews.length) {
      return { avgCommentsPerPR: 0, avgCommentsPerFile: 0, totalReviews: 0 };
    }

    const totalComments = reviews.reduce((sum, r) => sum + (r.commentsPosted || 0), 0);
    const totalFiles = reviews.reduce((sum, r) => sum + (r.filesAnalyzed || 0), 0);

    return {
      totalReviews: reviews.length,
      totalComments,
      totalFiles,
      avgCommentsPerPR: (totalComments / reviews.length).toFixed(2),
      avgCommentsPerFile: totalFiles > 0 ? (totalComments / totalFiles).toFixed(2) : 0,
      mostActivePR: reviews.sort((a, b) => (b.commentsPosted || 0) - (a.commentsPosted || 0))[0]
    };
  } catch (error) {
    console.error("❌ Failed to get comment density analysis:", error.message);
    return null;
  }
}

/**
 * Get error rate trends (for reliability monitoring)
 * @param {string} userId - User MongoDB ObjectId
 * @param {number} days - Number of days to look back (default 30)
 * @param {number} page - Number of page (default 1)
 * @param {number} perPage - Number of log per page (default 10)
 * @returns {Promise<Object>} Error metrics
 */
async function getErrorRateTrends({ userId, days = 30, page = 1, perPage = 10 }) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const safePage = Number.isFinite(page) ? Math.max(page, 1) : 1;
    const safePerPage = Number.isFinite(perPage) ? Math.max(perPage, 1) : 10;
    const skip = (safePage - 1) * safePerPage;

    const [errors, reviews, triages] = await Promise.all([
      ErrorLog.countDocuments({ userId, createdAt: { $gte: startDate } }),
      PullRequestReview.countDocuments({ userId, createdAt: { $gte: startDate } }),
      IssueTriage.countDocuments({ userId, createdAt: { $gte: startDate } })
    ]);

    const totalEvents = errors + reviews + triages;
    const errorRate = totalEvents > 0 ? ((errors / totalEvents) * 100).toFixed(2) : 0;

    // Get recent errors for debugging - filtered by time period
    const recentErrors = await ErrorLog.find({ userId, createdAt: { $gte: startDate } })
      .select('owner repo pull_number error createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safePerPage)
      .lean();

    return {
      totalErrors: errors,
      totalReviews: reviews,
      totalTriages: triages,
      errorRate: `${errorRate}%`,
      page: safePage,
      perPage: safePerPage,
      totalPages: Math.max(Math.ceil(errors / safePerPage), 1),
      recentErrors: recentErrors.map(e => ({
        repo: `${e.owner}/${e.repo}`,
        prNumber: e.pull_number,
        error: e.error,
        createdAt: e.createdAt
      }))
    };
  } catch (error) {
    console.error("❌ Failed to get error rate trends:", error.message);
    return null;
  }
}

/**
 * Rebuild repo stats from actual pull request reviews and issue triages (data sync)
 * Call this when stats are out of sync
 * @param {string} userId - User MongoDB ObjectId
 */
async function rebuildRepoStats({ userId }) {
  try {
    // Get all reviews grouped by repoId
    const reviews = await PullRequestReview.find({ userId })
      .select('repoId commentsPosted')
      .lean();

    // Get all issue triages grouped by repoId
    const triages = await IssueTriage.find({ userId })
      .select('repoId labelsApplied')
      .lean();
          
    const statsMap = new Map();
    
    // Process PR reviews
    reviews.forEach(r => {
      if (!statsMap.has(r.repoId.toString())) {
        statsMap.set(r.repoId.toString(), {
          repoId: r.repoId,
          totalPRsReviewed: 0,
          totalInlineComments: 0,  // This now stores TOTAL comments (body + inline)
          totalIssuesTriaged: 0,
          totalLabelsApplied: 0
        });
      }
      const stat = statsMap.get(r.repoId.toString());
      stat.totalPRsReviewed++;
      // commentsPosted already includes review body + inline comments
      stat.totalInlineComments += r.commentsPosted || 0;
    });

    // Process issue triages
    triages.forEach(t => {
      const repoIdStr = t.repoId.toString();
      if (!statsMap.has(repoIdStr)) {
        statsMap.set(repoIdStr, {
          repoId: t.repoId,
          totalPRsReviewed: 0,
          totalInlineComments: 0,
          totalIssuesTriaged: 0,
          totalLabelsApplied: 0
        });
      }
      const stat = statsMap.get(repoIdStr);
      stat.totalIssuesTriaged++;
      const uniqueLabels = new Set(t.labelsApplied);
      stat.totalLabelsApplied += uniqueLabels.size;
    });

    // Bulk update all RepoStats
    for (const [repoIdStr, stat] of statsMap) {
      await RepoStats.findOneAndUpdate(
        { repoId: stat.repoId, userId },
        {
          $set: {
            userId,
            totalPRsReviewed: stat.totalPRsReviewed,
            totalInlineComments: stat.totalInlineComments,
            totalIssuesTriaged: stat.totalIssuesTriaged,
            totalLabelsApplied: stat.totalLabelsApplied,
            lastActivityAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    console.log(`✅ Rebuilt stats for ${statsMap.size} repos (PRs + Issue Triages)`);
    return statsMap.size;
  } catch (error) {
    console.error("❌ Failed to rebuild repo stats:", error.message);
    return 0;
  }
}

/**
 * Get repo performance comparison (for multi-repo dashboard)
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Array>} Repos sorted by activity: [{ repo, totalPRs, totalComments, lastActivity }]
 */
async function getRepoComparison({ userId }) {
  try {
    // Rebuild stats to ensure they're fresh
    await rebuildRepoStats({ userId });

    const stats = await RepoStats.find({ userId })
      .populate('repoId', 'owner name fullName')
      .lean();

    return stats
      .filter(s => s.totalPRsReviewed > 0 || s.totalIssuesTriaged > 0) // Include repos with PR or issue activity
      .map(s => ({
        repoId: s.repoId?._id,
        repo: s.repoId?.fullName || 'Unknown',
        totalPRsReviewed: s.totalPRsReviewed || 0,
        totalInlineComments: s.totalInlineComments || 0,
        totalIssuesTriaged: s.totalIssuesTriaged || 0,
        totalLabelsApplied: s.totalLabelsApplied || 0,
        lastActivityAt: s.lastActivityAt,
        avgCommentsPerPR: s.totalPRsReviewed > 0 
          ? (s.totalInlineComments / s.totalPRsReviewed).toFixed(1) 
          : 0,
        avgLabelsPerIssue: s.totalIssuesTriaged > 0
          ? (s.totalLabelsApplied / s.totalIssuesTriaged).toFixed(1)
          : 0
      }))
      .sort((a, b) => (b.totalPRsReviewed || 0) - (a.totalPRsReviewed || 0));
  } catch (error) {
    console.error("❌ Failed to get repo comparison:", error.message);
    return [];
  }
}

/**
 * Get confidence score distribution (for AI quality insights)
 * @param {string} repoId - Repository MongoDB ObjectId
 * @returns {Promise<Object>} Confidence breakdown
 */
async function getConfidenceDistribution({ repoId }) {
  try {
    const reviews = await PullRequestReview.find({ repoId })
      .select('confidence')
      .lean();

    const distribution = {};
    reviews.forEach(r => {
      const conf = r.confidence || 'unknown';
      distribution[conf] = (distribution[conf] || 0) + 1;
    });

    return {
      total: reviews.length,
      breakdown: distribution
    };
  } catch (error) {
    console.error("❌ Failed to get confidence distribution:", error.message);
    return null;
  }
}

/**
 * Get issue triage analysis for a repo
 * @param {string} repoId - Repository MongoDB ObjectId
 * @returns {Promise<Object>} Triage metrics
 */
async function getIssueTriageAnalysis({ repoId }) {
  try {
    const triages = await IssueTriage.find({ repoId })
      .select('issue_number labelsApplied summary createdAt')
      .lean();

    if (!triages.length) {
      return {
        totalIssuesTriaged: 0,
        totalLabelsApplied: 0,
        avgLabelsPerIssue: 0,
        recentTriages: []
      };
    }

    const totalLabels = triages.reduce((sum, t) => sum + (Array.isArray(t.labelsApplied) ? t.labelsApplied.length : 0), 0);
    const recentTriages = triages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(t => ({
        issueNumber: t.issue_number,
        labelsApplied: t.labelsApplied,
        summary: t.summary,
        createdAt: t.createdAt
      }));

    return {
      totalIssuesTriaged: triages.length,
      totalLabelsApplied: totalLabels,
      avgLabelsPerIssue: (totalLabels / triages.length).toFixed(2),
      recentTriages
    };
  } catch (error) {
    console.error("❌ Failed to get issue triage analysis:", error.message);
    return null;
  }
}

module.exports = {
  recordReview,
  recordError,
  recordIssueTriage,
  rebuildRepoStats,
  // Analytics functions
  getReviewTimeSeries,
  getRecentActivity,
  getUserSummary,
  getCommentDensityAnalysis,
  getErrorRateTrends,
  getRepoComparison,
  getConfidenceDistribution,
  // Issue triage analytics
  getIssueTriageAnalysis
};
