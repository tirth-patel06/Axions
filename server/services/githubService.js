const { Octokit } = require("@octokit/rest");
const parseDiff = require('parse-diff');

/**
 * GitHub Service - GitHub API interactions only
 * 
 * Responsibilities:
 * - Fetch PR diff
 * - Post review comments
 * - No business logic, pure API wrapper
 */

/**
 * Fetches the PR diff from GitHub
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pull_number - PR number
 * @param {string} userToken - User's GitHub OAuth token
 * @returns {Promise<Object>} Parsed diff object from parse-diff
 * 
 * @example
 * const diff = await fetchDiff('user', 'repo', 123, token);
 * // Returns: [{ to: 'file.js', chunks: [...] }, ...]
 */
async function fetchDiff(owner, repo, pull_number, userToken) {
  try {
    const octokit = new Octokit({ auth: userToken });
    
    const response = await octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" }
    });
    
    const diff = response.data;
    const parsedFiles = parseDiff(diff);
    
    console.log(`✅ Fetched PR #${pull_number} diff: ${parsedFiles.length} files`);
    return parsedFiles;
  } catch (error) {
    console.error("❌ Failed to fetch PR diff:", error.message);
    throw new Error(`Fetch diff failed: ${error.message}`);
  }
}

/**
 * Posts a review to a pull request
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pull_number - PR number
 * @param {string} params.commit_id - Commit SHA to review
 * @param {string} params.userToken - User's GitHub OAuth token
 * @param {Object} params.review - Review object
 * @param {string} params.review.body - Review body text
 * @param {string} params.review.event - "COMMENT" or "REQUEST_CHANGES"
 * @param {Array} params.review.comments - Array of inline comments
 * @returns {Promise<Object>} GitHub API response
 * 
 * @example
 * await postReview({
 *   owner: 'user',
 *   repo: 'repo',
 *   pull_number: 123,
 *   commit_id: 'abc123',
 *   userToken: token,
 *   review: {
 *     body: 'Review complete',
 *     event: 'REQUEST_CHANGES',
 *     comments: [{ path: 'file.js', position: 10, body: 'Issue here' }]
 *   }
 * });
 */
async function postReview({ owner, repo, pull_number, commit_id, userToken, review }) {
  try {
    const octokit = new Octokit({ auth: userToken });
    
    const response = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      commit_id,
      body: review.body,
      event: review.event,
      comments: review.comments
    });
    
    console.log(`✅ Posted review to PR #${pull_number}`);
    return response;
  } catch (error) {
    console.error("❌ Failed to post review:", error.message);
    throw new Error(`Post review failed: ${error.message}`);
  }
}

/**
 * Posts an error comment on a PR
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pull_number - PR number
 * @param {string} params.userToken - User's GitHub OAuth token
 * @param {string} params.message - Error message to post
 * @returns {Promise<Object>} GitHub API response
 */
async function postErrorComment({ owner, repo, pull_number, userToken, message }) {
  try {
    const octokit = new Octokit({ auth: userToken });
    
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: `🤖 AI Review Error: ${message}`
    });
    
    console.log(`✅ Posted error comment to PR #${pull_number}`);
    return response;
  } catch (error) {
    console.error("❌ Failed to post error comment:", error.message);
    // Don't throw - this is secondary to the main review
  }
}

module.exports = {
  fetchDiff,
  postReview,
  postErrorComment
};

