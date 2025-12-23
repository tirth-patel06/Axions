import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getReviewTimeSeries } from '../services/analyticsService';

export default function AnalyticsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getReviewTimeSeries({ days });
        setData(result || []);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  const totalPRs = data.reduce((sum, d) => sum + (d.count || 0), 0);
  const avgComments = data.length > 0 
    ? (data.reduce((sum, d) => sum + (d.avgComments || 0), 0) / data.length).toFixed(1) 
    : 0;

  const SimpleChart = ({ chartData }) => {
    if (!chartData || chartData.length === 0) return null;
    
    const maxCount = Math.max(...chartData.map(d => d.count || 0), 1);

    return (
      <div className="flex items-end gap-1 h-48 justify-center">
        {chartData.slice(-30).map((point, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center group cursor-pointer"
          >
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-400 hover:to-blue-300 transition-all duration-300"
              style={{ height: `${(point.count / maxCount) * 100}%` }}
              title={`${point.date}: ${point.count} PRs`}
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
            <h1 className="text-4xl font-bold text-white mb-2">PR Analytics</h1>
            <p className="text-gray-400">Track pull request activity and trends</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Total PRs ({days} days)
                </h3>
              </div>
              <p className="text-4xl font-bold text-white">{totalPRs}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
              <h3 className="text-white font-semibold mb-4">Avg Comments per PR</h3>
              <p className="text-4xl font-bold text-white">{avgComments}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Activity
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
            ) : data.length > 0 ? (
              <SimpleChart chartData={data} />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  No data available
                </p>
              </div>
            )}

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {data.slice(-3).reverse().map((point, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">{point.date}</p>
                  <p className="text-2xl font-bold text-white">{point.count}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Avg: {point.avgComments?.toFixed(1) || '0'} comments
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
