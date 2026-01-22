const jwt = require("jsonwebtoken");

function githubCallback(req, res) {
  try {
    const user = req.user;

    if (!user || !user._id) {
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/error?reason=missing_user`;
      return res.redirect(redirectUrl);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    const jwtExpiry = process.env.JWT_EXPIRY || "7d";
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: jwtExpiry });
    
    // Convert to milliseconds if needed (simple conversion: assume default is 7 days)
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: maxAgeMs,
    });

    const successUrl = `${process.env.FRONTEND_URL}/auth/success`;
    return res.redirect(successUrl);
  } catch (err) {
    console.error("GitHub callback error:", err);
    const errorUrl = `${process.env.FRONTEND_URL}/auth/error?reason=server_error`;
    return res.redirect(errorUrl);
  }
}

module.exports = { githubCallback };
