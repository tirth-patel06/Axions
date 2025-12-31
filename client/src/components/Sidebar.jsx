import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, AlertCircle, Settings, LogOut, TrendingUp, Activity, BarChart3, Zap } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: TrendingUp, label: 'PR Analytics', path: '/analytics' },
    { icon: Activity, label: 'Activity Feed', path: '/activity' },
    { icon: BarChart3, label: 'Repo Performance', path: '/repo-comparison' },
    { icon: Zap, label: 'Deep Analysis', path: '/analysis' },
    { icon: AlertCircle, label: 'Error Tracking', path: '/errors' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col animate-slideInLeft">
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
          <Logo />
          <span className="text-white font-bold text-lg">Axion</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                active
                  ? 'bg-white/15 text-white shadow-[0_4_16px_rgba(255,255,255,0.1)] border border-white/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Settings</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
