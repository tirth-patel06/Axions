const crypto = require("crypto");
const ConnectedRepo = require("../models/ConnectedRepo");
const { runReview } = require("../services/reviewService");

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
        await runReview(payload, connectedRepo);
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Webhook handler failed");
  }
}

module.exports = { githubWebhookHandler };
