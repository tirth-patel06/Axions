const express = require("express");
const auth = require("../middleware/auth");
const { connectRepo, getConnectedRepos } = require("../controllers/repoController");

const router = express.Router();

router.get("/connected", auth, getConnectedRepos);
router.post("/connect", auth, connectRepo);

module.exports = router;
