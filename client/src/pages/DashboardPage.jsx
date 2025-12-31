import { useEffect, useState } from 'react';
import { GitBranch, AlertCircle, Code2, Sparkles, ArrowRight, Globe, Lock, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentPRs, setRecentPRs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [userRes, statsRes, reposRes] = await Promise.all([
        api.get('/api/test/me'),
        api.get('/api/analytics/summary'),
        api.get('/api/repos/connected')
      ]);

      setUser(userRes.data?.user);
      setStats(statsRes.data);
      
      const connectedRepos = reposRes.data?.repos || [];
      setRepositories(connectedRepos.slice(0, 3)); // Show only 3 repos
      
      // Mock recent PRs for now (can be extended with real PR data)
      setRecentPRs([
        {
          id: 1,
          title: 'Recent code review',
          repo: connectedRepos[0]?.name || 'Repository',
          status: 'reviewed',
        },
        {
          id: 2,
          title: 'Active pull request',
          repo: connectedRepos[0]?.name || 'Repository',
          status: 'open',
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 group animate-fadeInUp">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  const PRItem = ({ pr }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer animate-fadeInUp">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pr.status === 'open' ? 'bg-blue-500' : 'bg-green-500'}`} />
            <p className="text-white font-medium truncate group-hover:text-gray-200 transition-colors">{pr.title}</p>
          </div>
          <p className="text-gray-400 text-sm font-mono">{pr.repo}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
          pr.status === 'open'
            ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
            : 'bg-green-500/20 text-green-200 border border-green-500/30'
        }`}>
          {pr.status === 'open' ? 'Open' : 'Reviewed'}
        </span>
      </div>
    </div>
  );

  const RepoCard = ({ repo }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer animate-fadeInUp">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
          <p className="text-white font-semibold group-hover:text-gray-200 transition-colors">{repo.name}</p>
        </div>
        {repo.isPrivate ? (
          <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </div>
      <a 
        href={`https://github.com/${repo.fullName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group/btn"
      >
        <span>Open Repository</span>
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

      <Sidebar />

      <div className="ml-64 relative">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-12 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.username || 'User'}</h1>
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="h-px w-8 bg-gradient-to-r from-white/20 to-transparent" />
                  <p>Here's what's happening with your repositories</p>
                </div>
              </div>
              {user?.avatar && (
                <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-lg border border-white/20" />
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={AlertCircle}
              label="Open Issues"
              value={stats?.totalIssuesTriaged || 0}
              color="bg-blue-500/20"
            />
            <StatCard
              icon={GitBranch}
              label="Total Pull Requests"
              value={stats?.totalPRsReviewed || 0}
              color="bg-purple-500/20"
            />
            <StatCard
              icon={Code2}
              label="Connected Repositories"
              value={stats?.connectedRepos || 0}
              color="bg-green-500/20"
            />
            <StatCard
              icon={Sparkles}
              label="AI Reviews Generated"
              value={stats?.totalPRsReviewed || 0}
              color="bg-yellow-500/20"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all duration-300 animate-fadeInUp animation-delay-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-white" />
                    Recent Activity
                  </h2>
                  <a href="/repositories" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="space-y-3">
                  {recentPRs.length > 0 ? (
                    recentPRs.map((pr, idx) => (
                      <div key={pr.id} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <PRItem pr={pr} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No recent activity yet</p>
                      <p className="text-sm mt-2">Connect a repository to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all duration-300 animate-fadeInUp animation-delay-400">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-white" />
                    Your Repositories
                  </h2>
                  <a href="/repositories" className="text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="space-y-3">
                  {repositories.length > 0 ? (
                    repositories.map((repo, idx) => (
                      <div key={repo._id} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <RepoCard repo={repo} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No repositories connected</p>
                      <a href="/repositories" className="text-sm text-white hover:underline mt-2 inline-block">
                        Connect your first repo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:border-white/30 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all duration-300 animate-fadeInUp animation-delay-600">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Quick Tip</div>
                      <div className="text-gray-500 text-xs font-mono">AI-Powered Insight</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {stats?.avgReviewTime 
                      ? `Average review time: ${stats.avgReviewTime.toFixed(1)} hours. Keep up the great work!`
                      : 'Connect repositories and start reviewing PRs to get AI-powered insights!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
