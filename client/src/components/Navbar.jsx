import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar({ transparent = false }) {
  return (
    <nav className={`sticky top-0 z-50 ${transparent ? 'bg-black/40 backdrop-blur-md' : 'bg-black/95 backdrop-blur-md'} border-b border-neutral-900`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#product" className="text-gray-400 hover:text-white transition-colors text-sm">
              Product
            </a>
            <a href="#docs" className="text-gray-400 hover:text-white transition-colors text-sm">
              Docs
            </a>
            <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">
              About
            </a>
            <Link
              to="/login"
              className="px-4 py-2 border border-neutral-700 rounded-lg text-white hover:bg-neutral-900 transition-colors text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
