import { useState } from 'react';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import { useReviewTimeSeries } from '../hooks/useAnalyticsData';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useReviewTimeSeries(days);

  const totalPRs = data.reduce((sum, d) => sum + (d.reviewCount || 0), 0);
  const totalComments = data.reduce((sum, d) => sum + (d.commentCount || 0), 0);
  const avgComments = totalPRs > 0 ? (totalComments / totalPRs).toFixed(1) : 0;

  const SimpleChart = ({ chartData }) => {
    if (!chartData || chartData.length === 0) return null;
    
    // Group data by week
    const getWeeklyData = () => {
      const weeks = new Map();
      
      chartData.forEach(day => {
        const date = new Date(day.date);
        // Get the Monday of the week
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        const weekKey = monday.toISOString().split('T')[0];
        
        if (!weeks.has(weekKey)) {
          weeks.set(weekKey, {
            weekStart: weekKey,
            reviewCount: 0,
            commentCount: 0
          });
        }
        
        const week = weeks.get(weekKey);
        week.reviewCount += day.reviewCount || 0;
        week.commentCount += day.commentCount || 0;
      });
      
      return Array.from(weeks.values()).sort((a, b) => 
        new Date(a.weekStart) - new Date(b.weekStart)
      );
    };
    
    const weeklyData = getWeeklyData();
    const maxCount = Math.max(...weeklyData.map(w => w.reviewCount), 1);

    return (
      <div className="flex items-end gap-3 h-64 px-4">
        {weeklyData.map((week, idx) => {
          const heightPx = (week.reviewCount / maxCount) * 200; // Use pixel height for reliable rendering
          const date = new Date(week.weekStart);
          const weekLabel = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
          
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group cursor-pointer"
            >
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-400 hover:to-blue-300 transition-all duration-300 relative"
                style={{ height: `${heightPx}px` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {week.reviewCount} PRs
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-2 text-center">
                {weekLabel}
              </span>
            </div>
          );
        })}
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
            <MetricCard 
              icon={TrendingUp} 
              label={`Total PRs (${days} days)`}
              value={totalPRs}
            />
            <MetricCard 
              icon={AlertCircle} 
              label="Avg Comments per PR"
              value={avgComments}
            />
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
                  <p className="text-2xl font-bold text-white">{point.reviewCount}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {point.commentCount} comments
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
