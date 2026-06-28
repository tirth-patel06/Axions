const express = require("express");
const { githubWebhookHandler } = require("../controllers/webhookController");
const connectDB = require("../lib/mongoose");

const router = express.Router();

// Ensure DB connection for webhook processing
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

//raw body needed for signature verification
router.post(
  "/github",
  express.raw({ type: "application/json" }),
  githubWebhookHandler
);

module.exports = router;
