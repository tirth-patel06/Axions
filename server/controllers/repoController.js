const ConnectedRepo = require("../models/ConnectedRepo");
const { Octokit } = require("@octokit/rest");
const crypto = require("crypto");

/*POST /api/repos/connect*/
async function connectRepo(req, res) {
  const session = await ConnectedRepo.startSession();
  session.startTransaction();

  try {
    const user = req.user;

    const {
      githubRepoId,
      owner,
      name,
      fullName,
      isPrivate,
    } = req.body;

    if (
      !githubRepoId ||
      !owner ||
      !name ||
      !fullName ||
      typeof isPrivate !== "boolean"
    ) {
      return res.status(400).json({ error: "Invalid repository data" });
    }

    // check existing connection
    let connectedRepo = await ConnectedRepo.findOne({
      userId: user._id,
      githubRepoId,
    }).session(session);

    if (connectedRepo && connectedRepo.isConnected) {
      return res.status(409).json({ error: "Repository already connected" });
    }

    // create webhook on GitHub
    const octokit = new Octokit({ auth: user.accessToken });
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const webhook = await octokit.rest.repos.createWebhook({
      owner,
      repo: name,
      config: {
        url: process.env.GITHUB_WEBHOOK_URL,
        content_type: "json",
        secret: webhookSecret,
      },
      events: [
        "pull_request",
        "issues",
        "issue_comment",
        "pull_request_review_comment",
      ],
      active: true,
    });

    // if disconnected repo exists, update it; otherwise create new
    if (connectedRepo) {
      connectedRepo.isConnected = true;
      connectedRepo.connectedAt = new Date();
      connectedRepo.webhookId = webhook.data.id;
      connectedRepo.webhookSecret = webhookSecret;
      connectedRepo.owner = owner;
      connectedRepo.name = name;
      connectedRepo.fullName = fullName;
      connectedRepo.isPrivate = isPrivate;
      await connectedRepo.save({ session });
    } else {
      connectedRepo = await ConnectedRepo.create(
        [
          {
            userId: user._id,
            githubRepoId,
            owner,
            name,
            fullName,
            isPrivate,
            webhookId: webhook.data.id,
            webhookSecret,
          },
        ],
        { session }
      );
      connectedRepo = connectedRepo[0];
    }

    await session.commitTransaction();

    return res.status(201).json({
      message: "Repository connected with webhook",
      repo: connectedRepo,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Connect repo with webhook error:", err);

    return res.status(500).json({
      error: "Failed to connect repository",
    });
  } finally {
    session.endSession();
  }
}

/*GET /api/repos/connected*/
async function getConnectedRepos(req, res) {
  try {
    const userId = req.user._id;

    const connectedRepos = await ConnectedRepo.find({
      userId,
      isConnected: true,
    }).select('githubRepoId owner name fullName isPrivate connectedAt');

    // Fetch aggregated stats for all repos
    const repoIds = connectedRepos.map(r => r._id);
    const RepoStats = require('../models/RepoStats');
    const statsDocs = await RepoStats.find({ repoId: { $in: repoIds } }).lean();
    const statsMap = new Map(statsDocs.map(s => [String(s.repoId), s]));

    // Attach stats slice per repo (as requested)
    const reposWithStats = connectedRepos.map(r => {
      const s = statsMap.get(String(r._id));
      return {
        id: r._id,
        githubRepoId: r.githubRepoId,
        owner: r.owner,
        name: r.name,
        fullName: r.fullName,
        private: r.isPrivate,
        connectedAt: r.connectedAt,
        stats: {
          totalPRsReviewed: s?.totalPRsReviewed || 0,
          totalIssuesTriaged: s?.totalIssuesTriaged || 0,
          totalInlineComments: s?.totalInlineComments || 0,
          lastActivityAt: s?.lastActivityAt || null,
        },
      };
    });

    return res.json({
      repos: reposWithStats,
    });
  } catch (err) {
    console.error('Get connected repos error:', err);
    return res.status(500).json({
      error: 'Failed to fetch connected repositories',
    });
  }
}

/*DELETE /api/repos/:repoId/disconnect*/
async function disconnectRepo(req, res) {
  try {
    const user = req.user;
    const { repoId } = req.params;

    console.log('Disconnect request for repoId:', repoId);

    // Find repo (must belong to current user)
    const connectedRepo = await ConnectedRepo.findOne({
      _id: repoId,
      userId: user._id,
      isConnected: true,
    });

    if (!connectedRepo) {
      return res.status(404).json({
        error: 'Repository not found or already disconnected',
      });
    }

    console.log('Found connected repo:', connectedRepo.fullName);

    // Delete webhook from GitHub
    const octokit = new Octokit({ auth: user.accessToken });
    try {
      if (connectedRepo.webhookId) {
        await octokit.rest.repos.deleteWebhook({
          owner: connectedRepo.owner,
          repo: connectedRepo.name,
          hook_id: connectedRepo.webhookId,
        });
        console.log(`✅ Webhook deleted for ${connectedRepo.fullName}`);
      }
    } catch (webhookErr) {
      // Log but don't fail - webhook might already be deleted
      console.warn(
        `⚠️  Failed to delete webhook for ${connectedRepo.fullName}:`,
        webhookErr.message
      );
    }

    // Mark as disconnected in DB
    connectedRepo.isConnected = false;
    connectedRepo.webhookSecret = null;
    connectedRepo.webhookId = null;
    await connectedRepo.save();

    console.log('✅ Repository disconnected successfully');

    return res.json({
      message: 'Repository disconnected successfully',
      repo: {
        fullName: connectedRepo.fullName,
        isConnected: false,
      },
    });
  } catch (err) {
    console.error('Disconnect repo error:', err);

    return res.status(500).json({
      error: 'Failed to disconnect repository',
      details: err.message,
    });
  }
}

module.exports = {
  connectRepo,
  getConnectedRepos,
  disconnectRepo,
};
