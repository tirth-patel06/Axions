const jwt = require("jsonwebtoken");
const User = require("../models/User");
const connectDB = require("../lib/mongoose");

async function authMiddleware(req, res, next) {
  try {
    await connectDB();

    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // 🔑 available to all protected routes
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
