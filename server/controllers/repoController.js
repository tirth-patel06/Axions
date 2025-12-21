const ConnectedRepo = require("../models/ConnectedRepo");

/*POST /api/repos/connect*/
async function connectRepo(req, res) {
  try {
    const userId = req.user._id;

    const {
      githubRepoId,
      owner,
      name,
      fullName,
      isPrivate,
    } = req.body;

    // basic validation
    if (
      !githubRepoId ||
      !owner ||
      !name ||
      !fullName ||
      typeof isPrivate !== "boolean"
    ) {
      return res.status(400).json({
        error: "Missing or invalid repository data",
      });
    }

    // check if already connected
    const existing = await ConnectedRepo.findOne({
      userId,
      githubRepoId,
    });

    if (existing) {
      if (!existing.isConnected) {
        existing.isConnected = true;
        existing.connectedAt = new Date();
        await existing.save();

        return res.json({
          message: "Repository reconnected",
          repo: existing,
        });
      }

      return res.status(409).json({
        error: "Repository already connected",
      });
    }

    // create new connection
    const connectedRepo = await ConnectedRepo.create({
      userId,
      githubRepoId,
      owner,
      name,
      fullName,
      isPrivate,
    });

    return res.status(201).json({
      message: "Repository connected successfully",
      repo: connectedRepo,
    });
  } catch (err) {
    console.error("Connect repo error:", err);

    // handle unique index race condition
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Repository already connected",
      });
    }

    return res.status(500).json({
      error: "Failed to connect repository",
    });
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
