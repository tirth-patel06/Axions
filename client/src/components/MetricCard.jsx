/**
 * MetricCard - Reusable component for displaying metrics
 * Eliminates duplication across analytics pages
 */
export default function MetricCard({ icon: Icon, label, value, subtext, color = 'text-blue-400' }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {label}
        </h3>
      </div>
      <p className="text-4xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </div>
  );
}
