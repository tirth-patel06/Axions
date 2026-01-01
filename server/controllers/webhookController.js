const crypto = require("crypto");
const ConnectedRepo = require("../models/ConnectedRepo");
const { orchestrateReview } = require("../services/reviewService");
const { generateIssueLabels, generateIssueSummary } = require("../services/llmService");
const { applyColoredLabels, postIssueSummaryComment } = require("../services/githubService");
const IssueTriage = require("../models/IssueTriage");
const statsService = require("../services/statsService");

let Octokit;

async function getOctokit() {
  if (!Octokit) {
    const mod = await import("@octokit/rest");
    Octokit = mod.Octokit;
  }
  return Octokit;
}

/**
 * Orchestrates the issue labeling and summarization process
 * 1. Generates labels based on issue title and description using LLM
 * 2. Applies the generated labels to the GitHub issue with colors
 * 3. Generates a concise summary using LLM
 * 4. Posts the summary as a comment on the issue
 * 5. Saves the triage information to the database
 */
async function orchestrateIssueLabeling(payload, connectedRepo) {
  try {
    const {
      issue: { title, body: description, number: issue_number },
      repository: { owner: { login: owner }, name: repo },
    } = payload;

    const OctokitClient = await getOctokit();
    // Create Octokit instance with the user's GitHub access token
    const octokit = new OctokitClient({ auth: connectedRepo.userId.accessToken });

    // Step 1: Generate labels using LLM (if feature is enabled)
    if (process.env.FEATURE_ISSUE_LABELING === "true" || process.env.ENABLE_AUTO_LABELS === "true") {
      const labels = await generateIssueLabels(title, description);

      if (labels.length > 0) {
        // Apply colored labels to the GitHub issue
        await applyColoredLabels(octokit, owner, repo, issue_number, labels);
      }
    }

    // Step 2: Generate summary using LLM (if feature is enabled)
    if (process.env.FEATURE_ISSUE_SUMMARIZATION === "true" || process.env.ENABLE_AUTO_SUMMARY === "true") {
      const summary = await generateIssueSummary(title, description);

      // Step 3: Post summary as comment
      await postIssueSummaryComment(octokit, owner, repo, issue_number, summary);
    }

    // Step 4: Save triage information to database
    const issueTriage = await IssueTriage.findOneAndUpdate(
      {
        githubRepoId: connectedRepo.githubRepoId,
        issue_number
      },
      {
        owner,
        repo,
        githubRepoId: connectedRepo.githubRepoId,
        issue_number,
        userId: connectedRepo.userId._id,
        repoId: connectedRepo._id,
        labelsApplied: process.env.FEATURE_ISSUE_LABELING === "true" ? await generateIssueLabels(title, description) : [],
        summary: process.env.FEATURE_ISSUE_SUMMARIZATION === "true" ? await generateIssueSummary(title, description) : ""
      },
      { upsert: true, new: true }
    );

    return issueTriage;
  } catch (error) {
    console.error("❌ Error in issue labeling orchestration:", error);
    
    // Record error to database for tracking
    const {
      issue: { number: issue_number },
      repository: { owner: { login: owner }, name: repo },
    } = payload;
    
    await statsService.recordError({
      owner,
      repo,
      githubRepoId: connectedRepo.githubRepoId,
      pull_number: issue_number, // Using pull_number field for issue number
      error,
      user: connectedRepo.userId,
      repoId: connectedRepo._id
    });
    
    throw error;
  }
}

async function githubWebhookHandler(req, res) {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];

    if (!signature || !event) {
      return res.status(400).send("Missing required headers");
    }

    // Handle ping event early
    if (event === "ping") {
      return res.status(200).send("PONG");
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).send("Invalid JSON payload");
    }

    const githubRepoId = payload.repository?.id;
    if (!githubRepoId) {
      return res.status(400).send("Repository not found in payload");
    }

    const connectedRepo = await ConnectedRepo.findOne({
      githubRepoId,
      isConnected: true,
    }).populate("userId");

    if (!connectedRepo || !connectedRepo.webhookSecret) {
      return res.status(404).send("Repo not connected");
    }

    // Verify signature
    const hmac = crypto.createHmac(
      "sha256",
      connectedRepo.webhookSecret
    );

    const digest =
      "sha256=" + hmac.update(req.body).digest("hex");

    const sigBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (
      sigBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, digestBuffer)
    ) {
      return res.status(401).send("Invalid signature");
    }

    // Route events
    if (event === "pull_request") {
      // Handle both opened and synchronize (new commits) events
      if (payload.action === "opened" || payload.action === "synchronize") {
        await orchestrateReview(payload, connectedRepo);
      }
    } else if (event === "issues") {
      // Handle issue opened event for labeling and summarization
      if (payload.action === "opened") {
        await orchestrateIssueLabeling(payload, connectedRepo);
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Webhook handler failed");
  }
}

module.exports = { githubWebhookHandler, orchestrateIssueLabeling };
