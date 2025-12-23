import { api } from '../lib/api';

/**
 * Get recent activity feed
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} Array of activity items
 */
export const getRecentActivity = async (limit = 25) => {
  try {
    const response = await api.get(`/api/analytics/activity/recent?limit=${limit}`);
    return response.data.activity || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

/**
 * Get user summary (KPIs)
 * @returns {Promise<Object>} Summary data
 */
export const getUserSummary = async () => {
  try {
    const response = await api.get('/api/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching user summary:', error);
    throw error;
  }
};

/**
 * Get review time series data
 * @param {Object} params - Query parameters (repoId, days)
 * @returns {Promise<Array>} Time series data
 */
export const getReviewTimeSeries = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/analytics/timeseries?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching time series:', error);
    throw error;
  }
};

/**
 * Get repository comparison data
 * @returns {Promise<Array>} Repo comparison data
 */
export const getRepoComparison = async () => {
  try {
    const response = await api.get('/api/analytics/repos/comparison');
    return response.data;
  } catch (error) {
    console.error('Error fetching repo comparison:', error);
    throw error;
  }
};

/**
 * Get activity heatmap
 * @returns {Promise<Object>} Heatmap data
 */
export const getActivityHeatmap = async () => {
  try {
    const response = await api.get('/api/analytics/heatmap');
    return response.data;
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    throw error;
  }
};

/**
 * Get error trends
 * @returns {Promise<Array>} Error trends data
 */
export const getErrorTrends = async () => {
  try {
    const response = await api.get('/api/analytics/errors/trends');
    return response.data;
  } catch (error) {
    console.error('Error fetching error trends:', error);
    throw error;
  }
};

/**
 * Get comment density for a repository
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} Comment density data
 */
export const getCommentDensity = async (repoName) => {
  try {
    const response = await api.get(`/api/analytics/repo/${encodeURIComponent(repoName)}/density`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comment density:', error);
    throw error;
  }
};

/**
 * Get confidence distribution for a repository
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} Confidence distribution data
 */
export const getConfidenceDistribution = async (repoName) => {
  try {
    const response = await api.get(`/api/analytics/repo/${encodeURIComponent(repoName)}/confidence`);
    return response.data;
  } catch (error) {
    console.error('Error fetching confidence distribution:', error);
    throw error;
  }
};
