// routes/github.js
const express = require("express");
const auth = require("../middleware/auth");

let Octokit;

// Lazy-load Octokit to keep CommonJS and remain serverless-friendly
async function getOctokit() {
  if (!Octokit) {
    const mod = await import("@octokit/rest");
    Octokit = mod.Octokit;
  }
  return Octokit;
}

const router = express.Router();

// GET /api/github/repos
router.get("/repos", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.accessToken) {
      return res.status(401).json({ error: "GitHub token missing" });
    }

    const OctokitClient = await getOctokit();

    const octokit = new OctokitClient({
      auth: user.accessToken,
    });

    const repos = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });

    // Only include repositories owned by the authenticated user and not forks
    const owned = repos.data.filter((repo) => {
      const isOwner = repo?.owner?.login === user.username;
      return isOwner;
    });

    // return only what frontend needs
    const formatted = owned.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      owner: repo.owner.login,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
    }));

    res.json({ repos: formatted });
  } catch (err) {
    console.error("Repo fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

module.exports = router;
