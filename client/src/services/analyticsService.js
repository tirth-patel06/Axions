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
    return [];
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
    return {};
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
    return response.data?.timeSeries || response.data || [];
  } catch (error) {
    console.error('Error fetching time series:', error);
    return [];
  }
};

/**
 * Get repository comparison data
 * @returns {Promise<Array>} Repo comparison data
 */
export const getRepoComparison = async () => {
  try {
    const response = await api.get('/api/analytics/repos/comparison');
    return response.data?.repos || response.data || [];
  } catch (error) {
    console.error('Error fetching repo comparison:', error);
    return [];
  }
};

/**
 * Get activity heatmap
 * @returns {Promise<Object>} Heatmap data
 */
export const getActivityHeatmap = async () => {
  try {
    const response = await api.get('/api/analytics/heatmap');
    return response.data || {};
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    return {};
  }
};

/**
 * Get error trends
 * @param {Object} params - Query parameters (days)
 * @returns {Promise<Array>} Error trends data
 */
export const getErrorTrends = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/analytics/errors/trends?${queryString}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching error trends:', error);
    return [];
  }
};

/**
 * Get comment density for a repository
 * @param {string} repoId - Repository ID
 * @returns {Promise<Object>} Comment density data
 */
export const getCommentDensity = async (repoId) => {
  try {
    const response = await api.get(`/api/analytics/repo/${encodeURIComponent(repoId)}/density`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching comment density:', error);
    return {};
  }
};

/**
 * Get confidence distribution for a repository
 * @param {string} repoId - Repository ID
 * @returns {Promise<Object>} Confidence distribution data
 */
export const getConfidenceDistribution = async (repoId) => {
  try {
    const response = await api.get(`/api/analytics/repo/${encodeURIComponent(repoId)}/confidence`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching confidence distribution:', error);
    return {};
  }
};
