import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';

export default function NotFoundPage() {
  const [referenceId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

      <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] px-6 pt-12">
        <div className="max-w-3xl w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 animate-fadeInUp">
              <div className="space-y-3">
                <div className="inline-block">
                  <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white/40 to-white/20">
                    404
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Well… this is awkward 😅
                </h1>

                <p className="text-lg text-gray-400">
                  You've reached a route that doesn't exist.
                  The app is fine — this page just isn't.
                </p>
              </div>

              <p className="text-gray-500 leading-relaxed max-w-lg">
                Maybe the link is outdated. Maybe the route was refactored.
                Maybe the universe wanted you to take a short break.
                Either way, you didn't break anything.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md text-black rounded-lg font-semibold border border-white/50 hover:bg-white hover:border-white hover:shadow-[0_8_32px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                >
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Take me to the Dashboard
                </Link>

                <Link
                  to="/"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                >
                  <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Go back Home
                </Link>
              </div>

              <p className="text-xs text-gray-500 pt-2">
                Pro tip: the dashboard knows where everything lives 😉
              </p>
            </div>

            <div className="relative animate-fadeInUp animation-delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 via-white/5 to-white/5 rounded-3xl blur-2xl opacity-30 animate-pulse" />

              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all">
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse" />

                      <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-white/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v2m0 4v2m0 4v2M7.5 3h9A2.25 2.25 0 0120.25 5.25v13.5A2.25 2.25 0 0118 21h-9a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 017.5 3z"
                          />
                        </svg>
                      </div>

                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500/30 rounded-full blur-lg animate-bounce" />
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-500/20 rounded-full blur-md" />
                    </div>
                  </div>

                  <div className="space-y-4 text-center">
                    <h3 className="text-xl font-bold text-white">
                      What probably happened 🤔
                    </h3>

                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-red-400 font-mono text-xs bg-red-500/10 px-2 py-1 rounded">
                          DETAIL
                        </span>
                        <span>This route doesn't exist (classic 404)</span>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-yellow-400 font-mono text-xs bg-yellow-500/10 px-2 py-1 rounded">
                          POSSIBLE CAUSE
                        </span>
                        <span>
                          URL typo, refactor aftermath, or a link from the past
                        </span>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded">
                          NEXT STEP
                        </span>
                        <span>
                          Jump back to the dashboard and keep shipping 🚀
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center mb-3">
                      You're doing great. This page just isn't.
                    </p>
                    <p className="text-xs text-gray-600 text-center font-mono">
                      Reference ID (optional): {referenceId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
