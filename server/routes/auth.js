const express = require("express");
const passport = require("passport");
const { githubCallback } = require("../controllers/authController");
const connectDB = require("../lib/mongoose");

const router = express.Router();

// Step 1: Redirect to GitHub
router.get(
  "/github",
  passport.authenticate("github", { session: false })
);

// Step 2: GitHub callback
router.get(
  "/github/callback",
  async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  },
  passport.authenticate("github", { session: false }),
  githubCallback
);

module.exports = router;
