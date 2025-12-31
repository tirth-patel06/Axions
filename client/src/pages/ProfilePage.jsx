import { useState, useEffect } from 'react';
import { User, Mail, Github, Calendar, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/test/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
      <Sidebar />

      <div className="ml-64 relative">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account information</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 animate-fadeInUp animation-delay-200">
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="relative">
                <img
                  src={user?.githubAvatarUrl || 'https://github.com/identicons/default.png'}
                  alt={user?.username || 'GitHub Avatar'}
                  className="w-24 h-24 rounded-full border-2 border-white/20"
                />
                <div className="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
                  <Github className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{user?.username || <span className="text-gray-500">No GitHub username</span>}</h2>
                <p className="text-gray-400 mb-4">{user?.email || <span className="text-gray-500">No GitHub email</span>}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-4 h-4" />
                    GitHub Username
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {user?.username || <span className="text-gray-500">No GitHub username</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    GitHub Email
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {user?.email || <span className="text-gray-500">No GitHub email</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Github className="w-4 h-4" />
                    GitHub ID
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm">
                    {user?.githubId || <span className="text-gray-500">N/A</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Account Created
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : <span className="text-gray-500">N/A</span>}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
