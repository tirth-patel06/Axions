const express = require("express");
const { githubWebhookHandler } = require("../controllers/webhookController");

const router = express.Router();

//raw body needed for signature verification
router.post(
  "/github",
  express.raw({ type: "application/json" }),
  githubWebhookHandler
);

module.exports = router;
