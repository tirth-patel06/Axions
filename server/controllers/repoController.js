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

    return res.json({
      repos: connectedRepos,
    });
  } catch (err) {
    console.error('Get connected repos error:', err);
    return res.status(500).json({
      error: 'Failed to fetch connected repositories',
    });
  }
}

module.exports = {
  connectRepo,
  getConnectedRepos,
};
