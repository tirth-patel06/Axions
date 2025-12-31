/**
 * MetricCard - Reusable component for displaying metrics
 * Eliminates duplication across analytics pages
 */
export default function MetricCard({ icon: Icon, label, value, subtext, color = 'text-blue-400' }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all animate-fadeInUp">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h3 className="text-gray-400 text-xs font-medium truncate">
          {label}
        </h3>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
