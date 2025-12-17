const express = require("express");
const passport = require("passport");
const { githubCallback } = require("../controllers/authController");

const router = express.Router();

// Step 1: Redirect to GitHub
router.get(
  "/github",
  passport.authenticate("github", { session: false })
);

// Step 2: GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  githubCallback
);

module.exports = router;
