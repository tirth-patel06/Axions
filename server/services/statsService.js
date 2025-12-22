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

module.exports = {
  recordReview,
  incrementReviewCount,
  getRepoStats,
  recordError,
  recordIssueTriage
};
