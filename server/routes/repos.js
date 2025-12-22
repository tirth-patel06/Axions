const express = require("express");
const auth = require("../middleware/auth");
const { connectRepo, getConnectedRepos, disconnectRepo } = require("../controllers/repoController");

const router = express.Router();

router.get("/connected", auth, getConnectedRepos);
router.post("/connect", auth, connectRepo);
router.delete("/:repoId/disconnect", auth, disconnectRepo);

module.exports = router;
