import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getErrorTrends } from '../services/analyticsService';

export default function ErrorTrackingPage() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getErrorTrends({ days });
        setErrors(result || []);
      } catch (error) {
        console.error('Failed to fetch error trends:', error);
        setError('Failed to load error data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, [days]);

  const totalErrors = errors.reduce((sum, e) => sum + (e.errorCount || 0), 0);
  const avgErrorRate = errors.length > 0 
    ? (errors.reduce((sum, e) => sum + (e.errorRate || 0), 0) / errors.length).toFixed(1) 
    : 0;
  const maxErrors = Math.max(...errors.map(e => e.errorCount || 0), 1);

  const SimpleChart = ({ chartData }) => {
    if (!chartData || chartData.length === 0) return null;
    
    return (
      <div className="flex items-end gap-1 h-48 justify-center">
        {chartData.slice(-30).map((point, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center group cursor-pointer"
          >
            <div
              className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t hover:from-red-400 hover:to-red-300 transition-all duration-300"
              style={{ height: `${(point.errorCount / maxErrors) * 100}%` }}
              title={`${point.date}: ${point.errorCount} errors (${point.errorRate?.toFixed(1) || '0'}%)`}
            />
            {idx % 5 === 0 && (
              <span className="text-xs text-gray-500 mt-2 w-full text-center">
                {point.date?.slice(-5) || ''}
              </span>
            )}
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
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Total Errors
                </h3>
              </div>
              <p className="text-4xl font-bold text-white">{totalErrors}</p>
              <p className="text-xs text-gray-500 mt-2">in {days} days</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <h3 className="text-white font-semibold mb-4">Avg Error Rate</h3>
              <p className="text-4xl font-bold text-white">{avgErrorRate}%</p>
              <p className="text-xs text-gray-500 mt-2">per day</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <h3 className="text-white font-semibold mb-4">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${avgErrorRate < 2 ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                <p className="text-white font-semibold">{avgErrorRate < 2 ? 'Healthy' : 'Needs Attention'}</p>
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
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm hover:bg-white/20 transition-all"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {error && (
              <div className="h-48 flex items-center justify-center bg-red-500/10 rounded-lg border border-red-500/30">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400">Loading chart...</p>
              </div>
            ) : errors.length > 0 ? (
              <>
                <SimpleChart chartData={errors} />
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {errors.slice(-3).reverse().map((errorData, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
                      <p className="text-gray-400 text-sm mb-2">{errorData.date}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Errors</p>
                          <p className="text-2xl font-bold text-red-400">{errorData.errorCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Rate</p>
                          <p className="text-lg font-bold text-white">
                            {errorData.errorRate?.toFixed(1) || '0'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  No error data available
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
