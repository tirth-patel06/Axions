import { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getRepoComparison } from '../services/analyticsService';

export default function RepoComparisonPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('prs');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getRepoComparison();
        setRepos(result || []);
      } catch (error) {
        console.error('Failed to fetch repo comparison:', error);
        setError('Failed to load repository data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, []);

  const sortedRepos = [...repos].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.repoName || a.name || '').localeCompare(b.repoName || b.name || '');
      case 'prs':
        return (b.totalPRs || 0) - (a.totalPRs || 0);
      case 'reviewTime':
        return (a.avgReviewTime || 0) - (b.avgReviewTime || 0);
      case 'successRate':
        return (b.successRate || 0) - (a.successRate || 0);
      default:
        return 0;
    }
  });

  const maxPRs = Math.max(...repos.map(r => r.totalPRs || 0), 1);
  const maxReviewTime = Math.max(...repos.map(r => r.avgReviewTime || 0), 1);

  const getTotalPRs = () => repos.reduce((sum, r) => sum + (r.totalPRs || 0), 0);
  const getAvgReviewTime = () => repos.length > 0 
    ? (repos.reduce((sum, r) => sum + (r.avgReviewTime || 0), 0) / repos.length).toFixed(1)
    : 0;
  const getAvgSuccessRate = () => repos.length > 0
    ? (repos.reduce((sum, r) => sum + (r.successRate || 0), 0) / repos.length).toFixed(0)
    : 0;
  const getTotalComments = () => repos.reduce((sum, r) => sum + Math.round((r.avgComments || 0) * (r.totalPRs || 0)), 0);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
      <Sidebar />

      <div className="ml-64 relative">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-white mb-2">Repository Performance</h1>
            <p className="text-gray-400">Compare metrics across all connected repositories</p>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm hover:bg-white/20 transition-all"
              >
                <option value="prs">Total PRs</option>
                <option value="reviewTime">Review Time (fastest first)</option>
                <option value="successRate">Success Rate</option>
                <option value="name">Repository Name</option>
              </select>
            </div>
            <p className="text-gray-400 text-sm">{repos.length} repositories</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading repositories...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/30">
              <p className="text-red-400">{error}</p>
            </div>
          ) : repos.length > 0 ? (
            <div className="space-y-4">
              {sortedRepos.map((repo, idx) => {
                const prPercentage = ((repo.totalPRs || 0) / maxPRs) * 100;
                const repoName = repo.repoName || repo.name || 'Unknown';

                return (
                  <div
                    key={repoName}
                    className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] transition-all duration-300 animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="md:col-span-1">
                        <h3 className="text-white font-semibold text-lg truncate">{repoName}</h3>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-gray-400 text-xs mb-2">Total PRs</p>
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-bold text-white">{repo.totalPRs || 0}</p>
                          <div className="w-12 h-8 bg-white/10 rounded-lg flex items-end overflow-hidden">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-b"
                              style={{ height: `${prPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-gray-400 text-xs mb-2">Avg Review Time</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-white">{(repo.avgReviewTime || 0).toFixed(1)}h</p>
                          {(repo.avgReviewTime || 0) < 4 ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-gray-400 text-xs mb-2">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-white">{(repo.successRate || 0).toFixed(0)}%</p>
                          <div className="w-12 h-6 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-400"
                              style={{ width: `${repo.successRate || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-gray-400 text-xs mb-2">Avg Comments</p>
                        <p className="text-2xl font-bold text-white">{(repo.avgComments || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No repositories found</p>
            </div>
          )}

          {repos.length > 0 && (
            <div className="mt-8 grid md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 animate-fadeInUp">
                <p className="text-gray-400 text-sm mb-2">Total PRs</p>
                <p className="text-3xl font-bold text-white">{getTotalPRs()}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 animate-fadeInUp">
                <p className="text-gray-400 text-sm mb-2">Avg Review Time</p>
                <p className="text-3xl font-bold text-white">{getAvgReviewTime()}h</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 animate-fadeInUp">
                <p className="text-gray-400 text-sm mb-2">Avg Success Rate</p>
                <p className="text-3xl font-bold text-white">{getAvgSuccessRate()}%</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 animate-fadeInUp">
                <p className="text-gray-400 text-sm mb-2">Total Comments</p>
                <p className="text-3xl font-bold text-white">{getTotalComments()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
