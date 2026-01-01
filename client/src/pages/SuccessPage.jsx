import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(2);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const durationMs = 2000;
    const redirectTimer = setTimeout(() => navigate('/dashboard'), durationMs);

    // Smooth progress: transition from 0 to 100% over durationMs
    const rafId = requestAnimationFrame(() => setProgress(100));

    // Countdown ticks every second
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownTimer);
      cancelAnimationFrame(rafId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-8">
          <div className="flex flex-col items-center space-y-6">
            <Logo />

            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                GitHub Connected Successfully
              </h2>
              <p className="text-gray-400">
                We're preparing your repositories...
              </p>
            </div>

            <div className="text-sm text-gray-500">
              Redirecting in {countdown} seconds...
            </div>

            <div className="w-full max-w-xs">
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{ width: `${progress}%`, transition: 'width 2000ms ease-out' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
