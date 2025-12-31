/**
 * StatCard - Reusable component for dashboard stat cards
 * Used for KPI display across all pages
 */
export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 group animate-fadeInUp">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
