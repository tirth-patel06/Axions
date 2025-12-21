const crypto = require("crypto");
const ConnectedRepo = require("../models/ConnectedRepo");
const { handlePullRequest } = require("../services/githubService");

async function githubWebhookHandler(req, res) {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];

    if (!signature || !event) {
      return res.status(400).send("Missing headers");
    }

    const payload = JSON.parse(req.body.toString());

    // repo
    const githubRepoId = payload.repository?.id;
    if (!githubRepoId) {
      return res.status(400).send("Invalid payload");
    }

    const connectedRepo = await ConnectedRepo.findOne({
      githubRepoId,
      isConnected: true,
    }).populate("userId");

    if (!connectedRepo) {
      return res.status(404).send("Repo not connected");
    }

    // verify signature
    const hmac = crypto.createHmac(
      "sha256",
      connectedRepo.webhookSecret
    );
    const digest =
      "sha256=" + hmac.update(req.body).digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      )
    ) {
      return res.status(401).send("Invalid signature");
    }

    // 3️⃣ route events
    if (event === "pull_request") {
      await handlePullRequest(payload, connectedRepo);
    }

    // issues / comments can be added later
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Webhook handler failed");
  }
}

module.exports = { githubWebhookHandler };
