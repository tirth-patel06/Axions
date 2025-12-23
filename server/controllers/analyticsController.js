/**
 * Analytics Controller - Exposes stats for dashboards and graphs
 */

const statsService = require('../services/statsService');

/**
 * GET /api/analytics/summary
 * Returns top-level KPI cards for dashboard
 */
async function getUserSummary(req, res) {
  try {
    const userId = req.user._id;
    const summary = await statsService.getUserSummary({ userId });

    if (!summary) {
      return res.status(500).json({ error: 'Failed to retrieve summary' });
    }

    return res.json(summary);
  } catch (error) {
    console.error('Get user summary error:', error);
    return res.status(500).json({ error: 'Failed to get user summary' });
  }
}

/**
 * GET /api/analytics/activity/recent
 * Returns recent PR reviews for activity feed
 */
async function getRecentActivity(req, res) {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const activity = await statsService.getRecentActivity({ userId, limit });
    return res.json({ activity });
  } catch (error) {
    console.error('Get recent activity error:', error);
    return res.status(500).json({ error: 'Failed to get recent activity' });
  }
}

/**
 * GET /api/analytics/timeseries
 * Returns PR review activity over time for graphs
 * Query params: repoId (optional), days (default 30)
 */
async function getReviewTimeSeries(req, res) {
  try {
    const userId = req.user._id;
    const repoId = req.query.repoId || null;
    const days = parseInt(req.query.days) || 30;

    const timeSeries = await statsService.getReviewTimeSeries({ userId, repoId, days });
    return res.json({ timeSeries });
  } catch (error) {
    console.error('Get review time series error:', error);
    return res.status(500).json({ error: 'Failed to get time series data' });
  }
}

/**
 * GET /api/analytics/repos/comparison
 * Returns performance comparison across all connected repos
 */
async function getRepoComparison(req, res) {
  try {
    const userId = req.user._id;
    const comparison = await statsService.getRepoComparison({ userId });
    return res.json({ repos: comparison });
  } catch (error) {
    console.error('Get repo comparison error:', error);
    return res.status(500).json({ error: 'Failed to get repo comparison' });
  }
}

/**
 * GET /api/analytics/repo/:repoId/density
 * Returns comment density analysis for a specific repo
 */
async function getCommentDensity(req, res) {
  try {
    const { repoId } = req.params;
    const analysis = await statsService.getCommentDensityAnalysis({ repoId });

    if (!analysis) {
      return res.status(404).json({ error: 'No data found for this repo' });
    }

    return res.json(analysis);
  } catch (error) {
    console.error('Get comment density error:', error);
    return res.status(500).json({ error: 'Failed to get comment density' });
  }
}

/**
 * GET /api/analytics/repo/:repoId/confidence
 * Returns AI confidence score distribution for a repo
 */
async function getConfidenceDistribution(req, res) {
  try {
    const { repoId } = req.params;
    const distribution = await statsService.getConfidenceDistribution({ repoId });

    if (!distribution) {
      return res.status(404).json({ error: 'No data found for this repo' });
    }

    return res.json(distribution);
  } catch (error) {
    console.error('Get confidence distribution error:', error);
    return res.status(500).json({ error: 'Failed to get confidence distribution' });
  }
}

/**
 * GET /api/analytics/errors/trends
 * Returns error rate trends for reliability monitoring
 * Query params: days (default 30)
 */
async function getErrorTrends(req, res) {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;

    const trends = await statsService.getErrorRateTrends({ userId, days });

    if (!trends) {
      return res.status(500).json({ error: 'Failed to retrieve error trends' });
    }

    return res.json(trends);
  } catch (error) {
    console.error('Get error trends error:', error);
    return res.status(500).json({ error: 'Failed to get error trends' });
  }
}

/**
 * GET /api/analytics/heatmap
 * Returns activity heatmap data for calendar visualization
 * Query params: days (default 90)
 */
async function getActivityHeatmap(req, res) {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 90;

    const heatmap = await statsService.getActivityHeatmap({ userId, days });
    return res.json({ heatmap });
  } catch (error) {
    console.error('Get activity heatmap error:', error);
    return res.status(500).json({ error: 'Failed to get activity heatmap' });
  }
}

module.exports = {
  getUserSummary,
  getRecentActivity,
  getReviewTimeSeries,
  getRepoComparison,
  getCommentDensity,
  getConfidenceDistribution,
  getErrorTrends,
  getActivityHeatmap
};
