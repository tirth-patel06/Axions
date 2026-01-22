const express = require("express");
const auth = require("../middleware/auth");
const {
  getUserSummary,
  getRecentActivity,
  getReviewTimeSeries,
  getRepoComparison,
  getCommentDensity,
  getConfidenceDistribution,
  getErrorTrends,
  getActivityHeatmap,
  getIssueTriageTimeSeries,
  getIssueTriageAnalysis,
  getLabelDistribution
} = require("../controllers/analyticsController");

const router = express.Router();

// Dashboard KPI cards
router.get("/summary", auth, getUserSummary);

// Activity feed
router.get("/activity/recent", auth, getRecentActivity);

// Time-series for graphs
router.get("/timeseries", auth, getReviewTimeSeries);

// Repo comparison
router.get("/repos/comparison", auth, getRepoComparison);

// Deep analysis per repo
router.get("/repo/:repoId/density", auth, getCommentDensity);
router.get("/repo/:repoId/confidence", auth, getConfidenceDistribution);

// Error monitoring
router.get("/errors/trends", auth, getErrorTrends);

// Activity heatmap
// Currently not using in Frontend
router.get("/heatmap", auth, getActivityHeatmap);

// Issue triage analytics
router.get("/issues/timeseries", auth, getIssueTriageTimeSeries);
router.get("/repo/:repoId/issues", auth, getIssueTriageAnalysis);
router.get("/repo/:repoId/labels", auth, getLabelDistribution);

module.exports = router;
