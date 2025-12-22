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

    // Update repo counters atomically
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
    const repo = await ConnectedRepo.findById(repoId);
    if (!repo) return null;

    const reviews = await PullRequestReview.find({ githubRepoId: repo.githubRepoId })
      .sort({ createdAt: 1 })
      .lean();

    if (!reviews.length) {
      return {
        totalReviews: 0,
        totalComments: 0,
        averageCommentsPerReview: 0,
        lastReview: null
      };
    }

    const totalComments = reviews.reduce((sum, r) => sum + (r.commentsPosted || 0), 0);

    return {
      totalReviews: reviews.length,
      totalComments,
      averageCommentsPerReview: totalComments / reviews.length,
      lastReview: reviews[reviews.length - 1]?.createdAt
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
async function recordError({ owner, repo, githubRepoId, pull_number, error, user }) {
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

    console.log(`✅ Recorded error for PR ${owner}/${repo}#${pull_number}`);
  } catch (err) {
    console.error("❌ Failed to record error:", err.message);
  }
}

module.exports = {
  recordReview,
  incrementReviewCount,
  getRepoStats,
  recordError
};
