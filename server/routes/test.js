const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, (req, res) => {
  res.json({
    githubId: req.user.githubId,
    githubUsername: req.user.githubUsername,
    githubAvatarUrl: req.user.avatar, // match schema
    email: req.user.email,
    accessToken: req.user.accessToken ? "***" : null, // masked for security
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  });
});

module.exports = router;
