const express = require("express");
const auth = require("../middleware/auth");
const { connectRepo } = require("../controllers/repoController");

const router = express.Router();

router.post("/connect", auth, connectRepo);

module.exports = router;
