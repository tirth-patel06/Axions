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
    // Persist review document
    const saved = await PullRequestReview.create({
      owner,
      repo,
      githubRepoId,
      pull_number,
      commit_id,
      userId: user._id,
      repoId,
      filesAnalyzed: analysis?.filesAnalyzed?.length || 0,
      commentsPosted: analysis?.inlineComments?.length || 0,
      confidence: analysis?.confidence || "unknown",
      analysis,
      analyzedAt: new Date()
    });

    // Update ConnectedRepo counters atomically (compat)
    await ConnectedRepo.findByIdAndUpdate(
      repoId,
      {
        $inc: {
          reviewCount: 1,
          totalCommentsPosted: analysis?.inlineComments?.length || 0
        },
        $set: {
          lastReviewedAt: new Date()
        }
      },
      { new: true }
    );

    // Upsert aggregated RepoStats (fast reads)
    const inlineCount = analysis?.inlineComments?.length || 0;
    await RepoStats.findOneAndUpdate(
      { repoId },
      {
        $setOnInsert: { repoId, githubRepoId, userId: user._id },
        $inc: {
          totalPRsReviewed: 1,
          totalInlineComments: inlineCount,
        },
        $set: {
          lastPRReviewedAt: new Date(),
          lastActivityAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Recorded review stats: ${owner}/${repo}#${pull_number}`);
    return saved;
  } catch (error) {
    console.error("❌ Failed to record review:", error.message);
    // Don't throw - stats recording is secondary
    return null;
  }
}

/**
 * Increments review count for a repository
 * 
 * @param {string} repoId - MongoDB ObjectId of ConnectedRepo
 * @returns {Promise<void>}
 */
// incrementReviewCount no longer needed (handled in recordReview)
async function incrementReviewCount() {
  return;
}

/**
 * Gets review statistics for a repository
 * 
 * @param {string} repoId - MongoDB ObjectId of ConnectedRepo
 * @returns {Promise<Object>} Statistics summary
 * 
 * @example
 * const stats = await getRepoStats(repoId);
 * // Returns: {
 * //   totalReviews: 10,
 * //   totalComments: 45,
 * //   averageCommentsPerReview: 4.5,
 * //   byCategory: {...},
 * //   lastReview: Date
 * // }
 */
async function getRepoStats(repoId) {
  try {
    const stats = await RepoStats.findOne({ repoId }).lean();
    if (!stats) {
      return {
        totalPRsReviewed: 0,
        totalInlineComments: 0,
        totalIssuesTriaged: 0,
        totalLabelsApplied: 0,
        totalErrors: 0,
        lastActivityAt: null,
      };
    }
    return {
      totalPRsReviewed: stats.totalPRsReviewed || 0,
      totalInlineComments: stats.totalInlineComments || 0,
      totalIssuesTriaged: stats.totalIssuesTriaged || 0,
      totalLabelsApplied: stats.totalLabelsApplied || 0,
      totalErrors: stats.totalErrors || 0,
      lastActivityAt: stats.lastActivityAt || null,
    };
  } catch (error) {
    console.error("❌ Failed to get repo stats:", error.message);
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
    await IssueTriage.create({
      owner,
      repo,
      githubRepoId,
      issue_number,
      userId: user._id,
      repoId,
      labelsApplied,
      summary,
    });

    await RepoStats.findOneAndUpdate(
      { repoId },
      {
        $setOnInsert: { repoId, githubRepoId, userId: user._id },
        $inc: {
          totalIssuesTriaged: 1,
          totalLabelsApplied: Array.isArray(labelsApplied) ? labelsApplied.length : 0,
        },
        $set: {
          lastIssueTriagedAt: new Date(),
          lastActivityAt: new Date(),
        },
      },
      { upsert: true }
    );

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
    console.error("❌ Failed to get review time series:", error.message);
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
    console.error("❌ Failed to get recent activity:", error.message);
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
    console.error("❌ Failed to get user summary:", error.message);
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
 * @returns {Promise<Object>} Error metrics
 */
async function getErrorRateTrends({ userId, days = 30 }) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [errors, reviews] = await Promise.all([
      ErrorLog.countDocuments({ userId, createdAt: { $gte: startDate } }),
      PullRequestReview.countDocuments({ userId, createdAt: { $gte: startDate } })
    ]);

    const totalEvents = errors + reviews;
    const errorRate = totalEvents > 0 ? ((errors / totalEvents) * 100).toFixed(2) : 0;

    // Get recent errors for debugging
    const recentErrors = await ErrorLog.find({ userId })
      .select('owner repo pull_number error createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      totalErrors: errors,
      totalReviews: reviews,
      errorRate: `${errorRate}%`,
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
          totalInlineComments: 0,
          totalIssuesTriaged: 0,
          totalLabelsApplied: 0
        });
      }
      const stat = statsMap.get(r.repoId.toString());
      stat.totalPRsReviewed++;
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
      stat.totalLabelsApplied += Array.isArray(t.labelsApplied) ? t.labelsApplied.length : 0;
    });

    // Bulk update all RepoStats
    for (const [repoIdStr, stat] of statsMap) {
      await RepoStats.findOneAndUpdate(
        { repoId: stat.repoId },
        {
          $set: {
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
 * Get PR review heatmap data (for activity visualization)
 * @param {string} userId - User MongoDB ObjectId
 * @param {number} days - Number of days to look back (default 90)
 * @returns {Promise<Array>} Daily activity: [{ date, count }] for calendar heatmap
 */
async function getActivityHeatmap({ userId, days = 90 }) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await PullRequestReview.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return reviews.map(r => ({ date: r._id, count: r.count }));
  } catch (error) {
    console.error("❌ Failed to get activity heatmap:", error.message);
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
 * Get issue triage time series (for graphs)
 * @param {string} userId - User MongoDB ObjectId
 * @param {string} repoId - Optional repo filter
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Array>} Daily triage data: [{ date, triageCount, labelsCount }]
 */
async function getIssueTriageTimeSeries({ userId, repoId = null, days = 30 }) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = { userId, createdAt: { $gte: startDate } };
    if (repoId) query.repoId = repoId;

    const triages = await IssueTriage.find(query)
      .select('createdAt labelsApplied')
      .sort({ createdAt: 1 })
      .lean();

    // Group by date
    const dailyMap = new Map();
    triages.forEach(t => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, triageCount: 0, labelsCount: 0 });
      }
      const day = dailyMap.get(dateKey);
      day.triageCount++;
      day.labelsCount += Array.isArray(t.labelsApplied) ? t.labelsApplied.length : 0;
    });

    return Array.from(dailyMap.values());
  } catch (error) {
    console.error("❌ Failed to get issue triage time series:", error.message);
    return [];
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

/**
 * Get label distribution across triaged issues
 * @param {string} repoId - Repository MongoDB ObjectId
 * @returns {Promise<Object>} Label usage breakdown
 */
async function getLabelDistribution({ repoId }) {
  try {
    const triages = await IssueTriage.find({ repoId })
      .select('labelsApplied')
      .lean();

    const labelCounts = {};
    triages.forEach(t => {
      if (Array.isArray(t.labelsApplied)) {
        t.labelsApplied.forEach(label => {
          labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
      }
    });

    // Sort by count descending
    const sorted = Object.entries(labelCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLabels: Object.keys(labelCounts).length,
      distribution: sorted
    };
  } catch (error) {
    console.error("❌ Failed to get label distribution:", error.message);
    return null;
  }
}

module.exports = {
  recordReview,
  incrementReviewCount,
  getRepoStats,
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
  getActivityHeatmap,
  getConfidenceDistribution,
  // Issue triage analytics
  getIssueTriageTimeSeries,
  getIssueTriageAnalysis,
  getLabelDistribution
};
