const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, (req, res) => {
  res.json({
    message: "Authenticated",
    user: {
      id: req.user._id,
      username: req.user.username,
    },
  });
});

module.exports = router;
