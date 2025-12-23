import { useState, useEffect } from 'react';
import { Zap, AlertCircle, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getRepoComparison, getCommentDensity, getConfidenceDistribution } from '../services/analyticsService';

export default function DeepAnalysisPage() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [density, setDensity] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getRepoComparison();
        setRepos(result || []);
        if (result && result.length > 0) {
          setSelectedRepo(result[0].repoName || result[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch repos:', error);
        setError('Failed to load repositories.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;

    const fetchAnalysis = async () => {
      try {
        setAnalysisLoading(true);
        setError(null);
        const densityResult = await getCommentDensity(selectedRepo);
        const confidenceResult = await getConfidenceDistribution(selectedRepo);
        setDensity(densityResult);
        setConfidence(confidenceResult);
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        setError('Failed to load analysis data.');
      } finally {
        setAnalysisLoading(false);
      }
    };

    fetchAnalysis();
  }, [selectedRepo]);

  const getActivityLevel = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      default:
        return 'bg-white/10 text-gray-200 border-white/20';
    }
  };

  const ConfidenceChart = ({ data }) => {
    if (!data) return null;
    
    const total = data.high + data.medium + data.low;
    if (total === 0) return null;
    
    const highPct = (data.high / total) * 100;
    const mediumPct = (data.medium / total) * 100;
    const lowPct = (data.low / total) * 100;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">High Confidence</span>
            <span className="text-green-400 font-semibold">{data.high}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${highPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Medium Confidence</span>
            <span className="text-yellow-400 font-semibold">{data.medium}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${mediumPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Low Confidence</span>
            <span className="text-red-400 font-semibold">{data.low}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${lowPct}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
      <Sidebar />

      <div className="ml-64 relative">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-white mb-2">Deep Analysis</h1>
            <p className="text-gray-400">In-depth metrics and AI confidence analysis per repository</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading analysis...</p>
            </div>
          ) : error && repos.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">{error}</p>
            </div>
          ) : repos.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 sticky top-8">
                  <h3 className="text-white font-semibold mb-4">Select Repository</h3>
                  <div className="space-y-2">
                    {repos.map((repo) => {
                      const repoName = repo.repoName || repo.name;
                      return (
                        <button
                          key={repoName}
                          onClick={() => setSelectedRepo(repoName)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 border ${
                            selectedRepo === repoName
                              ? 'bg-white/15 text-white border-white/30 shadow-[0_4_16px_rgba(255,255,255,0.1)]'
                              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {repoName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {analysisLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading analysis data...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/30">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : selectedRepo && density && confidence ? (
                  <>
                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all animate-fadeInUp">
                      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Comment Density Analysis
                      </h2>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Total Comments</p>
                          <p className="text-4xl font-bold text-white">{density.totalComments || 0}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm mb-2">Comments per File</p>
                          <p className="text-4xl font-bold text-white">
                            {density.commentsPerFile ? density.commentsPerFile.toFixed(1) : '0'}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-sm mb-3">Activity Level</p>
                          <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-lg border ${getActivityLevel(density.activityLevel)}`}>
                            {density.activityLevel && density.activityLevel.charAt(0).toUpperCase() + density.activityLevel.slice(1)} Activity
                          </span>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-sm mb-3">Most Active PR</p>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-white font-mono text-sm break-words">{density.mostActivePR || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all animate-fadeInUp">
                      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        AI Review Confidence Distribution
                      </h2>

                      <ConfidenceChart data={confidence} />

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-400 text-sm mb-4">Confidence Breakdown</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <p className="text-green-400 text-xs mb-2 font-semibold">HIGH</p>
                            <p className="text-2xl font-bold text-green-300">{confidence.high || 0}</p>
                          </div>
                          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                            <p className="text-yellow-400 text-xs mb-2 font-semibold">MEDIUM</p>
                            <p className="text-2xl font-bold text-yellow-300">{confidence.medium || 0}</p>
                          </div>
                          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                            <p className="text-red-400 text-xs mb-2 font-semibold">LOW</p>
                            <p className="text-2xl font-bold text-red-300">{confidence.low || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-white/5 backdrop-blur-md rounded-xl border border-blue-500/20 p-6 animate-fadeInUp">
                      <p className="text-blue-200 text-sm leading-relaxed">
                        This repository shows {density.activityLevel} comment density with {confidence.high} high-confidence AI reviews. Focus on reducing comments per file to improve code clarity.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No repositories found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
