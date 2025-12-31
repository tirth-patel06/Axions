import { Link } from 'react-router-dom';
import { Sparkles, GitPullRequest, MessageSquare, Zap, Shield, TrendingUp, CheckCircle, Github, Code2 } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
      <Navbar transparent />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-24 pt-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8 animate-fadeInUp">
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                  GitHub Meets Intelligence
                </h1>
                <p className="text-xl text-gray-400">
                  Turn your development workflow into an intelligent, self-organizing platform. Axion brings AI-powered automation to every issue, pull request, and code review.
                </p>
              </div>

              <p className="text-gray-500 leading-relaxed max-w-lg">
                From solo developers to engineering teams, Axion helps you ship better code faster without sacrificing quality. Your always-on AI teammate for GitHub.
              </p>

              <Link
                to="/login"
                className="group inline-block px-8 py-4 bg-white/80 backdrop-blur-md text-black rounded-lg font-semibold border border-white/50 hover:bg-white hover:border-white hover:shadow-[0_8_32px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 hover:-translate-y-1"
              >
                Get Started with GitHub
              </Link>
            </div>

            <div className="relative animate-fadeInUp animation-delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:scale-[1.02] transition-all duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Live Dashboard</div>
                      <div className="text-gray-500 text-xs font-mono">Real-time insights</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="w-4 h-4 text-white group-hover:text-gray-200 group-hover:scale-110 transition-all" />
                          <span className="text-white text-sm font-mono">feature/auth-flow</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">Reviewed</span>
                      </div>
                      <p className="text-gray-400 text-sm">Security improvements detected</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-white group-hover:text-gray-200 group-hover:scale-110 transition-all" />
                          <span className="text-white text-sm font-mono">Issue #247</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">Triaged</span>
                      </div>
                      <p className="text-gray-400 text-sm">Auto-prioritized as high impact</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-sm">AI Analysis Running...</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-white w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-black via-black to-black py-12 md:py-16 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16 space-y-3 animate-fadeInUp">
              <h2 className="text-3xl md:text-4xl font-bold text-white">What Problems Does Axion Solve?</h2>
              <p className="text-gray-400 md:text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Modern GitHub workflows are noisy. Issues pile up, reviews take forever, and maintainers burn out. Axion changes that.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-16 md:mb-20">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fadeInUp">
                <div className="flex gap-4">
                  <MessageSquare className="w-6 h-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Issue Overload</h3>
                    <p className="text-gray-400 text-sm">
                      Hundreds of issues with unclear priority make it impossible to know what truly matters first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fadeInUp animation-delay-200">
                <div className="flex gap-4">
                  <Code2 className="w-6 h-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Slow Reviews</h3>
                    <p className="text-gray-400 text-sm">
                      Manual PR reviews are slow, inconsistent, and create bottlenecks in development.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fadeInUp animation-delay-400">
                <div className="flex gap-4">
                  <TrendingUp className="w-6 h-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Quality Inconsistency</h3>
                    <p className="text-gray-400 text-sm">
                      Maintaining consistent code quality across teams and repositories is challenging without standards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fadeInUp animation-delay-600">
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Maintainer Burnout</h3>
                    <p className="text-gray-400 text-sm">
                      Reviewing the same patterns repeatedly and managing routine feedback is exhausting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-12 md:mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Core Features That Transform Your Workflow</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16 md:mb-20">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <MessageSquare className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Issue Triage</h3>
                <p className="text-gray-400 mb-4">
                  Axion analyzes every new issue, classifies it, assigns priority, and generates a summary — instantly.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Auto-categorization
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Priority assignment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    AI summaries
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <GitPullRequest className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Intelligent PR Review</h3>
                <p className="text-gray-400 mb-4">
                  AI analyzes code diffs, identifies bugs, suggests improvements, and posts structured feedback automatically.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Code analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Issue detection
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Best practice tips
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Unified Dashboard</h3>
                <p className="text-gray-400 mb-4">
                  Centralized view of all repositories, issues, PRs, and insights in one clean, organized interface.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Real-time tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Actionable insights
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                    Single source of truth
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mb-12 md:mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Built for Every Developer</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 md:mb-20">
              {[
                { title: 'Open Source Maintainers', desc: 'Reduce issue overload and reviewer fatigue' },
                { title: 'Startup Teams', desc: 'Move fast without sacrificing code quality' },
                { title: 'Solo Developers', desc: 'Get AI assistance without hiring reviewers' },
                { title: 'Learning Teams', desc: 'Understand better practices through feedback' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_4_16px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <h4 className="text-white font-semibold mb-2 group-hover:scale-105 transition-transform inline-block">{item.title}</h4>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 md:p-12 mb-16 md:mb-20 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all duration-500">
              <div className="text-center space-y-6 md:space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">How Axion Works</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { num: '1', label: 'Connect', desc: 'Secure GitHub OAuth login' },
                    { num: '2', label: 'Select', desc: 'Choose repositories' },
                    { num: '3', label: 'Analyze', desc: 'AI processes issues & PRs' },
                    { num: '4', label: 'Automate', desc: 'Real-time insights posted' },
                  ].map((step, idx) => (
                    <div key={idx} className="relative group">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-white text-black font-bold flex items-center justify-center mb-4 shadow-[0_4_16px_rgba(255,255,255,0.15)] group-hover:scale-110 group-hover:shadow-[0_8_32px_rgba(255,255,255,0.25)] transition-all duration-300">
                          {step.num}
                        </div>
                        <h4 className="text-white font-semibold mb-1 group-hover:scale-105 transition-transform">{step.label}</h4>
                        <p className="text-gray-400 text-sm text-center">{step.desc}</p>
                      </div>
                      {idx < 3 && (
                        <div className="hidden md:block absolute top-6 left-[60%] w-[40%] h-0.5 bg-gradient-to-r from-white/20 to-white/0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 md:p-12 mb-16 md:mb-20 hover:border-white/20 hover:shadow-[0_8_32px_rgba(255,255,255,0.1)] transition-all duration-500">
              <div className="text-center space-y-6 mb-8 md:mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Why Axion Is Different</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: Github, title: 'GitHub-Native', desc: 'Works directly inside GitHub, no extra tabs or platforms needed' },
                  { icon: Sparkles, title: 'Context-Aware AI', desc: 'Understands code context and your development patterns' },
                  { icon: Shield, title: 'Enterprise Security', desc: 'Secure OAuth, granular permissions, full data control' },
                  { icon: Zap, title: 'Production-Ready', desc: 'Built on a scalable, modern tech stack for real workflows' },
                  { icon: TrendingUp, title: 'Scales with You', desc: 'From solo developers to large engineering teams' },
                  { icon: CheckCircle, title: 'Always Improving', desc: 'Continuous learning from your repository patterns' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4 group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 group-hover:rotate-6 transition-all" />
                      <div>
                        <h4 className="text-white font-semibold mb-2 group-hover:text-gray-200 transition-colors">{item.title}</h4>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center space-y-4 md:space-y-6 py-12 md:py-16 animate-fadeInUp">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Turn GitHub into an intelligent development platform.
              </h2>
              <p className="text-gray-400 md:text-gray-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Axion brings AI to your workflow, so you can focus on what matters — building great software.
              </p>
              <Link
                to="/login"
                className="group inline-block px-8 py-4 bg-white/80 backdrop-blur-md text-black rounded-lg font-semibold border border-white/50 hover:bg-white hover:border-white hover:shadow-[0_8_32px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 hover:-translate-y-1"
              >
                Get Started with GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
