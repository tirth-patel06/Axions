import { useState } from 'react';
import { BarChart3, AlertCircle, Tag, MessageSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import { useRepoComparison } from '../hooks/useAnalyticsData';

export default function RepoComparisonPage() {
  const [sortBy, setSortBy] = useState('name');
  const { data: repos, loading, error } = useRepoComparison();

  const sortedRepos = [...repos].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.repo || '').localeCompare(b.repo || '');
      case 'prs':
        return (b.totalPRsReviewed || 0) - (a.totalPRsReviewed || 0);
      case 'issues':
        return (b.totalIssuesTriaged || 0) - (a.totalIssuesTriaged || 0);
      default:
        return 0;
    }
  });

  const maxPRs = Math.max(...repos.map(r => r.totalPRsReviewed || 0), 1);

  const getTotalPRs = () => repos.reduce((sum, r) => sum + (r.totalPRsReviewed || 0), 0);
  const getTotalComments = () => repos.reduce((sum, r) => sum + (r.totalInlineComments || 0), 0);
  const getAvgCommentsPerPR = () => repos.length > 0 
    ? (getTotalComments() / getTotalPRs() || 0).toFixed(1)
    : 0;
  const getTotalIssues = () => repos.reduce((sum, r) => sum + (r.totalIssuesTriaged || 0), 0);
  const getTotalLabels = () => repos.reduce((sum, r) => sum + (r.totalLabelsApplied || 0), 0);

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
                className="bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white text-sm hover:bg-black/80 transition-all cursor-pointer"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="name" className="bg-black text-white">Repository Name</option>
                <option value="prs" className="bg-black text-white">Total PRs</option>
                <option value="issues" className="bg-black text-white">Total Issues</option>
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
                const prPercentage = ((repo.totalPRsReviewed || 0) / maxPRs) * 100;

                return (
                  <div
                    key={repo.repoId || repo.repo}
                    className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] transition-all duration-300 animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">{repo.repo}</h3>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1 flex items-center justify-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Total PRs
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-blue-400">{repo.totalPRsReviewed || 0}</p>
                            <div className="w-12 h-8 bg-white/10 rounded-lg flex items-end overflow-hidden">
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-b"
                                style={{ height: `${prPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Issues Triaged
                          </p>
                          <p className="text-2xl font-bold text-purple-400">{repo.totalIssuesTriaged || 0}</p>
                        </div>
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
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard 
                icon={BarChart3}
                label="Total PRs"
                value={getTotalPRs()}
              />
              <MetricCard 
                icon={MessageSquare}
                label="Comments"
                value={getTotalComments()}
              />
              <MetricCard 
                icon={BarChart3}
                label="Avg/PR"
                value={getAvgCommentsPerPR()}
              />
              <MetricCard 
                icon={AlertCircle}
                label="Issues"
                value={getTotalIssues()}
              />
              <MetricCard 
                icon={Tag}
                label="Labels"
                value={getTotalLabels()}
              />
              <MetricCard 
                icon={Tag}
                label="Avg/Issue"
                value={getTotalIssues() > 0 ? (getTotalLabels() / getTotalIssues()).toFixed(1) : 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
