import { useState } from 'react';
import { Zap, AlertCircle, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useRepoComparison, useCommentDensity, useConfidenceDistribution } from '../hooks/useAnalyticsData';

const ConfidenceChart = ({ data }) => {
  if (!data) return null;
  
  const total = (data.high || 0) + (data.medium || 0) + (data.low || 0);
  if (total === 0) return null;
  
  const highPct = ((data.high || 0) / total) * 100;
  const mediumPct = ((data.medium || 0) / total) * 100;
  const lowPct = ((data.low || 0) / total) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">High Confidence</span>
          <span className="text-green-400 font-semibold">{data.high || 0}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: `${highPct}%` }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Medium Confidence</span>
          <span className="text-yellow-400 font-semibold">{data.medium || 0}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500" style={{ width: `${mediumPct}%` }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Low Confidence</span>
          <span className="text-red-400 font-semibold">{data.low || 0}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-red-500" style={{ width: `${lowPct}%` }} />
        </div>
      </div>
    </div>
  );
};

export default function DeepAnalysisPage() {
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const { data: repos, loading } = useRepoComparison();
  const { data: density, loading: densityLoading } = useCommentDensity(selectedRepoId);
  const { data: confidence, loading: confidenceLoading } = useConfidenceDistribution(selectedRepoId);

  // Set initial selectedRepoId when repos load
  if (repos && repos.length > 0 && !selectedRepoId) {
    setSelectedRepoId(repos[0].repoId);
  }

  const error = null;
  const isAnalysisLoading = densityLoading || confidenceLoading;

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
                      return (
                        <button
                          key={repo.repoId}
                          onClick={() => setSelectedRepoId(repo.repoId)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 border ${
                            selectedRepoId === repo.repoId
                              ? 'bg-white/15 text-white border-white/30 shadow-[0_4_16px_rgba(255,255,255,0.1)]'
                              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {repo.repo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {isAnalysisLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading analysis data...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/30">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : selectedRepoId && density && confidence ? (
                  <>
                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all animate-fadeInUp">
                      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Comment Density Analysis
                      </h2>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Total Reviews</p>
                          <p className="text-4xl font-bold text-white">{density.totalReviews || 0}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm mb-2">Avg Comments per PR</p>
                          <p className="text-4xl font-bold text-white">
                            {density.avgCommentsPerPR || '0'}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm mb-2">Total Comments</p>
                          <p className="text-2xl font-bold text-white">{density.totalComments || 0}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm mb-2">Avg per File</p>
                          <p className="text-2xl font-bold text-white">{density.avgCommentsPerFile || 0}</p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-sm mb-3">Most Active PR</p>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-white font-mono text-sm break-words">
                              {density.mostActivePR?.pull_number ? `PR #${density.mostActivePR.pull_number}` : 'N/A'}
                            </p>
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
                        This repository has {density.totalReviews || 0} reviewed PRs with {density.totalComments || 0} total comments. Average of {density.avgCommentsPerPR || 0} comments per PR. Focus on code clarity to reduce comment density.
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
