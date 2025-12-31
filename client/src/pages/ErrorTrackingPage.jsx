import { useState } from 'react';
import { AlertTriangle, Calendar, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import { useErrorTrends } from '../hooks/useAnalyticsData';

export default function ErrorTrackingPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useErrorTrends(days);

  const totalErrors = data?.totalErrors || 0;
  const errorRateNum = parseFloat(data?.errorRate) || 0;

  const SimpleChart = ({ recentErrors }) => {
    if (!recentErrors || recentErrors.length === 0) return null;
    
    // Create a simple visualization of error count
    return (
      <div className="space-y-3">
        {recentErrors.map((errorItem, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-32">
              <p className="text-gray-400 text-sm font-mono truncate">
                {errorItem.repo ? errorItem.repo.split('/')[1] || errorItem.repo : 'Unknown'}
              </p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm">PR #{errorItem.prNumber}</p>
                <p className="text-red-400 text-sm font-bold">{errorItem.error}</p>
              </div>
              <p className="text-gray-500 text-xs">{new Date(errorItem.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
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
            <h1 className="text-4xl font-bold text-white mb-2">Error Tracking</h1>
            <p className="text-gray-400">Monitor code errors and reliability metrics</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <MetricCard 
              icon={AlertTriangle}
              label={`Total Errors (${days} days)`}
              value={totalErrors}
            />
            <MetricCard 
              icon={AlertTriangle}
              label="Avg Error Rate"
              value={`${errorRateNum.toFixed(2)}%`}
            />
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <h3 className="text-white font-semibold mb-4">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${errorRateNum < 5 ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                <p className="text-white font-semibold">{errorRateNum < 5 ? 'Healthy' : 'Needs Attention'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Error Trend
              </h2>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white text-sm hover:bg-black/80 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value={7} className="bg-black text-white">Last 7 days</option>
                <option value={30} className="bg-black text-white">Last 30 days</option>
                <option value={90} className="bg-black text-white">Last 90 days</option>
              </select>
            </div>

            {error && (
              <div className="h-48 flex items-center justify-center bg-red-500/10 rounded-lg border border-red-500/30">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400">Loading error data...</p>
              </div>
            ) : data?.recentErrors && data.recentErrors.length > 0 ? (
              <>
                <SimpleChart recentErrors={data.recentErrors} />
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  No errors found - Great job! 🎉
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-red-500/10 backdrop-blur-md rounded-xl border border-red-500/20 p-6 animate-fadeInUp">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-red-200 font-semibold mb-2">Error Reduction Tips</h3>
                <ul className="text-red-100/80 text-sm space-y-1">
                  <li>- Review PRs with highest error rates in recent activity</li>
                  <li>- Check files with most errors for patterns and fixes</li>
                  <li>- Ensure proper test coverage before merging</li>
                  <li>- Monitor error trends weekly to catch spikes early</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
