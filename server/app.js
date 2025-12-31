require("dotenv").config();
const express = require("express");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

require("./config/passport");

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const githubRoutes = require("./routes/github");
const repoRoutes = require("./routes/repos");
const webhookRoutes = require("./routes/webhooks");
const analyticsRoutes = require("./routes/analytics");
const issuesRoutes = require("./routes/issues");

const app = express();

// ============================================
// Environment Variables with Defaults
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS === "true";
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================
// Middleware Configuration
// ============================================
app.use(morgan("dev"));
app.use(cors({ 
  origin: FRONTEND_URL, 
  credentials: CORS_CREDENTIALS 
}));
app.use(cookieParser());
app.use(passport.initialize());

// Webhooks need raw body for signature verification; register before express.json
app.use("/webhooks", webhookRoutes);

// JSON parsing for the rest of the API
app.use(express.json());

// ============================================
// Routes
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/issues", issuesRoutes);

// ============================================
// Health Check Endpoint
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Error Handling Middleware
// ============================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  if (process.env.SHOW_DETAILED_ERRORS === "true") {
    console.error("Error Details:", err);
  }
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.SHOW_DETAILED_ERRORS === "true" && { details: err.stack }),
  });
});

module.exports = app;
