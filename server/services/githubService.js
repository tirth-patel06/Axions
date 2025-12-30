const { Octokit } = require("@octokit/rest");
const parseDiff = require('parse-diff');

/**
 * Maps label names to GitHub label colors
 * Colors are in hex format without the # symbol
 */
const labelColorMap = {
  // Bug & Issues - Red shades
  'bug': 'd73a4a',
  'critical': 'b60205',
  'high': 'ff5733',
  'blocker': 'e0301e',
  
  // Features - Blue shades
  'feature': '0366d6',
  'enhancement': 'a2eeef',
  'new-feature': '0366d6',
  'improvement': '0366d6',
  
  // Priority - Yellow/Orange
  'medium': 'fbca04',
  'low': 'd4c5f9',
  'priority': 'fbca04',
  
  // Type - Various
  'security': 'd73a4a',
  'performance': 'f7b300',
  'refactor': 'd1b6a8',
  'documentation': '0075ca',
  'help-wanted': '008672',
  'good-first-issue': '7057ff',
  
  // Area - Teal/Blue shades
  'frontend': '1d76db',
  'backend': '5319e7',
  'api': '0366d6',
  'database': '1d76db',
  'devops': '5319e7',
  'testing': '0366d6',
  'deployment': '1d76db',
  
  // Status - Gray shades
  'blocked': 'cccccc',
  'wontfix': 'ffffff',
  'duplicate': 'cfd3d7',
  'invalid': 'e4e669',
  
  // Default
  'default': '0366d6'
};

/**
 * Gets the color for a label
 * @param {string} label - The label name
 * @returns {string} Hex color code (without #)
 */
function getLabelColor(label) {
  const normalized = label.toLowerCase().trim();
  return labelColorMap[normalized] || labelColorMap['default'];
}

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

/**
 * Applies labels to a GitHub issue
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} params.userToken - User's GitHub OAuth token
 * @param {Array<string>} params.labels - Array of label names to apply
 * @returns {Promise<Object>} GitHub API response
 * 
 * @example
 * await applyLabelsToIssue({
 *   owner: 'user',
 *   repo: 'repo',
 *   issue_number: 42,
 *   userToken: token,
 *   labels: ['bug', 'critical']
 * });
 */
async function applyLabelsToIssue({ owner, repo, issue_number, userToken, labels }) {
  try {
    const octokit = new Octokit({ auth: userToken });
    
    if (!labels || labels.length === 0) {
      console.log(`⚠️  No labels to apply to issue #${issue_number}`);
      return null;
    }

    const response = await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels
    });
    
    console.log(`✅ Applied ${labels.length} label(s) to issue #${issue_number}: ${labels.join(', ')}`);
    return response;
  } catch (error) {
    console.error("❌ Failed to apply labels to issue:", error.message);
    throw new Error(`Apply labels failed: ${error.message}`);
  }
}

/**
 * Creates a label with color if it doesn't exist
 * @param {Object} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} label - Label name
 * @returns {Promise<void>}
 */
async function ensureLabelExists(octokit, owner, repo, label) {
  try {
    const color = getLabelColor(label);
    
    // Check if label already exists
    const existingLabel = await octokit.issues.getLabel({
      owner,
      repo,
      name: label
    }).catch(() => null);

    if (existingLabel) {
      // Label exists, update its color if different
      await octokit.issues.updateLabel({
        owner,
        repo,
        current_name: label,
        color: color,
        description: `Auto-generated label (${label})`
      }).catch(err => console.warn(`Could not update label color: ${err.message}`));
    } else {
      // Create the label with color
      await octokit.issues.createLabel({
        owner,
        repo,
        name: label,
        color: color,
        description: `Auto-generated label (${label})`
      }).catch(err => console.warn(`Could not create label: ${err.message}`));
    }
  } catch (error) {
    console.warn(`Error ensuring label exists: ${error.message}`);
  }
}

/**
 * Applies colored labels to an issue
 * @param {Object} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issue_number - Issue number
 * @param {Array<string>} labels - Array of label names
 * @returns {Promise<void>}
 */
async function applyColoredLabels(octokit, owner, repo, issue_number, labels) {
  try {
    if (!labels || labels.length === 0) {
      console.log(`⚠️  No labels to apply to issue #${issue_number}`);
      return;
    }

    // Ensure all labels exist with proper colors
    for (const label of labels) {
      await ensureLabelExists(octokit, owner, repo, label);
    }

    // Apply the labels to the issue
    const response = await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels
    });

    console.log(`✅ Applied ${labels.length} colored label(s) to issue #${issue_number}: ${labels.join(', ')}`);
    return response;
  } catch (error) {
    console.error(`❌ Error applying colored labels: ${error.message}`);
  }
}

/**
 * Posts a summary comment to a GitHub issue
 * @param {Object} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issue_number - Issue number
 * @param {string} summary - Summary text to post
 * @returns {Promise<Object>} GitHub API response
 */
async function postIssueSummaryComment(octokit, owner, repo, issue_number, summary) {
  try {
    const commentBody = `## 📊 AI Issue Analysis\n\n${summary}\n\n---\n*Generated automatically by AI Issue Assistant* 🤖`;

    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body: commentBody
    });

    console.log(`✅ Posted summary comment to issue #${issue_number}`);
    return response;
  } catch (error) {
    console.error(`❌ Error posting summary comment: ${error.message}`);
    throw error;
  }
}

module.exports = {
  fetchDiff,
  postReview,
  postErrorComment,
  applyLabelsToIssue,
  getLabelColor,
  labelColorMap,
  ensureLabelExists,
  applyColoredLabels,
  postIssueSummaryComment
};

