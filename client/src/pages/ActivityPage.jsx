import { Activity, Clock, GitPullRequest } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useRecentActivity } from '../hooks/useAnalyticsData';

export default function ActivityPage() {
  const { data: activities, loading, error } = useRecentActivity(25);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'reviewed':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
      default:
        return 'bg-white/10 text-gray-200 border-white/20';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
      <Sidebar />

      <div className="ml-64 relative">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-white mb-2">Activity Feed</h1>
            <p className="text-gray-400">Real-time pull request activity across your repositories</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading activity...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/30">
              <p className="text-red-400">{error}</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div
                  key={activity._id || activity.prNumber || idx}
                  className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] transition-all duration-300 group cursor-pointer animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <GitPullRequest className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate group-hover:text-gray-200 transition-colors">
                            PR #{activity.prNumber}
                          </p>
                          <p className="text-gray-500 text-sm">{activity.repo}</p>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm ml-8 mb-3">
                        {activity.filesAnalyzed} files analyzed • {activity.commentsPosted} comments posted
                      </p>

                      <div className="flex items-center gap-3 ml-8">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-blue-500/20 text-blue-200 border-blue-500/30">
                          Reviewed
                        </span>
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
