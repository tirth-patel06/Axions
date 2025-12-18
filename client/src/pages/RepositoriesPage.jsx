import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, GitFork, Calendar, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { api } from '../lib/api';

export default function RepositoriesPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const { data } = await api.get('/api/github/repos');
      setRepos(data?.repos || []);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repoId) => {
    setConnecting(repoId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setRepos((prev) =>
      prev.map((repo) =>
        repo.id === repoId ? { ...repo, connected: true } : repo
      )
    );
    setConnecting(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black/95 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Your GitHub Repositories
          </h1>
          <p className="text-gray-400 text-lg">
            Select repositories to enable AI automation
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-800 rounded w-1/2" />
                  <div className="h-10 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 mb-6">
              <GitFork className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No repositories found
            </h3>
            <p className="text-gray-400">
              Make sure your GitHub account has repositories
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="group bg-neutral-950 rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all duration-300"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold font-mono text-lg mb-1 truncate">
                        {repo.name}
                      </h3>
                      <p className="text-gray-500 text-sm font-mono truncate">
                        {repo.owner || 'Unknown owner'}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      repo.private
                        ? 'bg-neutral-800 text-gray-300 border border-neutral-700'
                        : 'bg-neutral-800 text-gray-300 border border-neutral-700'
                    }`}>
                      {repo.private ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      {repo.private ? 'Private' : 'Public'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {formatDate(repo.updatedAt)}</span>
                  </div>

                  <div className="mt-auto">
                    {repo.connected ? (
                      <div className="w-full py-3 px-4 rounded-lg bg-neutral-800 text-gray-300 border border-neutral-700 text-center font-medium text-sm">
                        Connected
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(repo.id)}
                        disabled={connecting === repo.id}
                        className="w-full py-3 px-4 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      >
                        {connecting === repo.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
