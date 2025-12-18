import { Link } from 'react-router-dom';
import { Sparkles, GitPullRequest, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navbar transparent />

      <div className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
              AI-Powered Developer Workflow Automation
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
              Upgrade your GitHub workflow with intelligent issue triage and automated PR review.
            </p>

            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              Get Started
            </Link>
          </div>

          <div className="relative">
            <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">AI Dashboard</div>
                    <div className="text-gray-500 text-xs font-mono">Preview Mode</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-mono">feature/auth-flow</span>
                      </div>
                      <span className="text-xs text-gray-400 bg-neutral-800 px-2 py-1 rounded">Reviewed</span>
                    </div>
                    <p className="text-gray-400 text-sm">Security improvements detected</p>
                  </div>

                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-mono">Issue #247</span>
                      </div>
                      <span className="text-xs text-gray-400 bg-neutral-800 px-2 py-1 rounded">Triaged</span>
                    </div>
                    <p className="text-gray-400 text-sm">Automated priority assignment</p>
                  </div>

                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-sm">AI Analysis Running...</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-white w-2/3 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
