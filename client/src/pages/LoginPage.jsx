import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { api, API_BASE_URL } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    let redirectTimer;
    const checkSession = async () => {
      try {
        setStatus('Authenticating...');
        const { data } = await api.get('/api/test/me');
        if (data?.username) {
          setStatus('Session valid. Redirecting...');
          redirectTimer = setTimeout(() => navigate('/dashboard'), 500);
          return;
        }
      } catch {
        // No valid session; proceed to OAuth
      }

      setStatus('Redirecting to GitHub...');
      redirectTimer = setTimeout(() => {
        window.location.href = `${API_BASE_URL}/api/auth/github`;
      }, 800);
    };

    checkSession();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-8">
          <div className="flex flex-col items-center space-y-6">
            <Logo />

            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
              {status.includes('Session') ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Github className="w-8 h-8 text-white" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {status}
              </h2>
              <p className="text-gray-400">
                Securely connecting your GitHub account
              </p>
            </div>

            <div className="w-full max-w-xs">
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-white animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
