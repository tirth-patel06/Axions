/**
 * useAnalyticsData - Hook for fetching and managing analytics data
 * Ensures consistent data across all pages
 */
import { useState, useEffect } from 'react';
import {
  getUserSummary,
  getReviewTimeSeries,
  getRecentActivity,
  getRepoComparison,
  getCommentDensity,
  getConfidenceDistribution,
  getErrorTrends,
  getActivityHeatmap
} from '../services/analyticsService';

export function useUserSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUserSummary();
        setData(result || null);
      } catch (err) {
        console.error('Failed to fetch user summary:', err);
        setError('Failed to load summary');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, loading, error };
}

export function useReviewTimeSeries(days = 30) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getReviewTimeSeries({ days });
        setData(result || []);
      } catch (err) {
        console.error('Failed to fetch timeseries:', err);
        setError('Failed to load timeseries');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [days]);

  return { data, loading, error };
}

export function useRecentActivity(limit = 20) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getRecentActivity(limit);
        setData(result || []);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setError('Failed to load activity');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [limit]);

  return { data, loading, error };
}

export function useRepoComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getRepoComparison();
        setData(result || []);
      } catch (err) {
        console.error('Failed to fetch repo comparison:', err);
        setError('Failed to load repos');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, loading, error };
}

export function useCommentDensity(repoId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!repoId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCommentDensity(repoId);
        setData(result || null);
      } catch (err) {
        console.error('Failed to fetch density:', err);
        setError('Failed to load density');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [repoId]);

  return { data, loading, error };
}

export function useConfidenceDistribution(repoId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!repoId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getConfidenceDistribution(repoId);
        setData(result || null);
      } catch (err) {
        console.error('Failed to fetch confidence:', err);
        setError('Failed to load confidence');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [repoId]);

  return { data, loading, error };
}

export function useErrorTrends(days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getErrorTrends({ days });
        setData(result || null);
      } catch (err) {
        console.error('Failed to fetch errors:', err);
        setError('Failed to load errors');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [days]);

  return { data, loading, error };
}

export function useActivityHeatmap(days = 90) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getActivityHeatmap({ days });
        setData(result || []);
      } catch (err) {
        console.error('Failed to fetch heatmap:', err);
        setError('Failed to load heatmap');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [days]);

  return { data, loading, error };
}
