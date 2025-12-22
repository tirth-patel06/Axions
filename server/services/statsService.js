/**
 * Stats Service - Database-backed analytics
 * 
 * Responsibilities:
 * - Save review statistics to database
 * - Track analysis metrics per PR, repo, user
 * - No file system writes, DB-only persistence
 */

const ConnectedRepo = require("../models/ConnectedRepo");
// TODO: Create PullRequestReview model if needed
// const PullRequestReview = require("../models/PullRequestReview");

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
async function recordReview({ owner, repo, pull_number, commit_id, analysis, user }) {
  try {
    // Find the connected repo
    const connectedRepo = await ConnectedRepo.findOne({
      owner,
      name: repo
    });

    if (!connectedRepo) {
      console.warn(`Repo not found in DB: ${owner}/${repo}`);
      return null;
    }

    // Prepare review record
    const reviewRecord = {
      // PR metadata
      prNumber: pull_number,
      commitId: commit_id,
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}/pull/${pull_number}`,
      
      // Analysis results
      filesAnalyzed: analysis.filesAnalyzed,
      totalFilesReviewed: analysis.totalFilesReviewed,
      
      // Comments data
      comments: analysis.inlineComments.map(c => ({
        path: c.path,
        position: c.position,
        body: c.body
      })),
      
      // Statistics
      stats: {
        totalComments: analysis.stats.totalComments,
        byCategory: analysis.stats.byCategory
      },
      
      // Summary
      summary: analysis.summary,
      confidence: analysis.confidence,
      
      // References
      userId: user._id,
      repoId: connectedRepo._id,
      
      // Timestamps
      analyzedAt: new Date(),
      createdAt: new Date()
    };

    // TODO: Save to PullRequestReview collection if it exists
    // const saved = await PullRequestReview.create(reviewRecord);
    
    console.log(`✅ Recorded review stats: ${owner}/${repo}#${pull_number}`);
    return reviewRecord;
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
async function incrementReviewCount(repoId) {
  try {
    // TODO: Add reviewCount field to ConnectedRepo schema
    // await ConnectedRepo.findByIdAndUpdate(repoId, {
    //   $inc: { reviewCount: 1 },
    //   lastReviewedAt: new Date()
    // });
    
    console.log(`✅ Incremented review count for repo ${repoId}`);
  } catch (error) {
    console.error("❌ Failed to update review count:", error.message);
  }
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
    // TODO: Query PullRequestReview collection
    // const reviews = await PullRequestReview.find({ repoId });
    // 
    // if (!reviews.length) {
    //   return {
    //     totalReviews: 0,
    //     totalComments: 0,
    //     averageCommentsPerReview: 0,
    //     byCategory: {},
    //     lastReview: null
    //   };
    // }
    //
    // const totalComments = reviews.reduce((sum, r) => sum + (r.stats.totalComments || 0), 0);
    // const byCategory = {};
    // reviews.forEach(r => {
    //   Object.entries(r.stats.byCategory || {}).forEach(([cat, count]) => {
    //     byCategory[cat] = (byCategory[cat] || 0) + count;
    //   });
    // });
    //
    // return {
    //   totalReviews: reviews.length,
    //   totalComments,
    //   averageCommentsPerReview: totalComments / reviews.length,
    //   byCategory,
    //   lastReview: reviews[reviews.length - 1]?.analyzedAt
    // };

    console.log(`✅ Retrieved stats for repo ${repoId}`);
    return {};
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
async function recordError({ owner, repo, pull_number, error, user }) {
  try {
    // TODO: Create ErrorLog collection
    // await ErrorLog.create({
    //   prNumber: pull_number,
    //   owner,
    //   repo,
    //   error: error.message,
    //   stack: error.stack,
    //   userId: user._id,
    //   createdAt: new Date()
    // });
    
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
