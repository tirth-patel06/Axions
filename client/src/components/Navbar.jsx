import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from './Logo';

export default function Navbar({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-6 animate-slideDown">
      <div className="max-w-7xl mx-auto">
        <div
          className={`rounded-2xl border transition-all duration-500 ${
            scrolled
              ? 'bg-black/80 backdrop-blur-xl border-white/20 shadow-[0_8_32px_rgba(255,255,255,0.1)]'
              : transparent
              ? 'bg-black/40 backdrop-blur-md border-white/10'
              : 'bg-black/60 backdrop-blur-lg border-white/15'
          }`}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="transform hover:scale-105 transition-transform duration-300">
                <Logo />
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <a
                  href="#product"
                  className="text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                >
                  Product
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#docs"
                  className="text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                >
                  Docs
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#about"
                  className="text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                >
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </a>
                <Link
                  to="/login"
                  className="px-5 py-2.5 border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 hover:border-white/50 hover:shadow-[0_4_16px_rgba(255,255,255,0.15)] transition-all duration-300 text-sm font-medium hover:-translate-y-0.5"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
