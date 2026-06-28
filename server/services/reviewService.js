/**
 * Review Service - PR Review Orchestration
 * 
 * Responsibilities:
 * - Orchestrate the review workflow
 * - Coordinate between services
 * - NO GitHub API calls, NO file writes, NO database operations
 * - Pure business logic coordination
 */

const githubService = require('./githubService');
const llmService = require('./llmService');
const statsService = require('./statsService');


/**
 * Orchestrates a complete PR review
 * 
 * Flow:
 * 1. Fetch PR diff via GitHub service
 * 2. Analyze with LLM service
 * 3. Post review via GitHub service
 * 4. Record stats via Stats service
 * 
 * @param {Object} payload - GitHub webhook payload
 * @param {Object} connectedRepo - ConnectedRepo from database (with userId populated)
 * @returns {Promise<Object>} Review result
 * 
 * @example
 * const result = await orchestrateReview(webhookPayload, connectedRepo);
 * // Returns: {
 * //   success: true,
 * //   pull_number: 123,
 * //   filesAnalyzed: 2,
 * //   commentsPosted: 5,
 * //   error: null
 * // }
 */
async function orchestrateReview(payload, connectedRepo) {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pull_number = payload.pull_request.number;
  const commit_id = payload.pull_request.head.sha;
  const userToken = connectedRepo.userId.accessToken;

  console.log(`🤖 Starting PR Review: ${owner}/${repo}#${pull_number}`);

  try {
    // Step 1: Fetch PR diff
    console.log("📥 Fetching PR diff...");
    const parsedFiles = await githubService.fetchDiff(owner, repo, pull_number, userToken);

    if (!parsedFiles || parsedFiles.length === 0) {
      console.log("⏭️  No files to review");
      return {
        success: true,
        pull_number,
        filesAnalyzed: 0,
        commentsPosted: 0,
        error: null
      };
    }

    // Step 2: Analyze with LLM
    console.log("🧠 Running AI analysis...");
    const analysis = await llmService.analyzeDiff(parsedFiles);

    // Step 3: Generate detailed text summary for review body
    console.log("📝 Generating detailed PR summary...");
    const commentsByFile = {};
    analysis.inlineComments.forEach(c => {
      commentsByFile[c.path] = (commentsByFile[c.path] || 0) + 1;
    });
    
    const reviewBody = await llmService.generatePRTextSummary({
      owner,
      repo,
      pull_number,
      totalFilesChanged: parsedFiles.length,
      filesForSummary: parsedFiles,
      commentsByFile,
      totalComments: analysis.inlineComments.length
    });

    // Step 4: Prepare review for GitHub

    const reviewEvent = analysis.inlineComments.length > 0 ? "COMMENT" : "COMMENT";

    const review = {
      body: reviewBody,
      event: reviewEvent,
      comments: analysis.inlineComments
    };

    // Step 5: Post review to GitHub
    console.log("📤 Posting review to GitHub...");
    await githubService.postReview({
      owner,
      repo,
      pull_number,
      commit_id,
      userToken,
      review
    });

    // Step 6: Record statistics
    console.log("📊 Recording statistics...");
    await statsService.recordReview({
      owner,
      repo,
      githubRepoId: connectedRepo.githubRepoId,
      pull_number,
      commit_id,
      analysis,
      user: connectedRepo.userId,
      repoId: connectedRepo._id
    });

    console.log("✅ Review complete");
    return {
      success: true,
      pull_number,
      filesAnalyzed: analysis.filesAnalyzed.length,
      commentsPosted: analysis.inlineComments.length,
      error: null
    };
  } catch (error) {
    console.error("❌ Review failed:", error.message);

    // Try to post error comment (best effort)
    try {
      await githubService.postErrorComment({
        owner,
        repo,
        pull_number,
        userToken,
        message: `I encountered an error while reviewing: ${error.message}`
      });
    } catch (commentErr) {
      console.error("⚠️  Could not post error comment:", commentErr.message);
    }

    // Record error
    await statsService.recordError({
      owner,
      repo,
      githubRepoId: connectedRepo.githubRepoId,
      pull_number,
      error,
      user: connectedRepo.userId
    });

    return {
      success: false,
      pull_number,
      filesAnalyzed: 0,
      commentsPosted: 0,
      error: error.message
    };
  }
}

module.exports = { orchestrateReview };


