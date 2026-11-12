import React from 'react';
import { Link } from 'react-router-dom';
import { Orbit, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark */}
      <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
          <Orbit className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">CodeOrbit</span>
      </Link>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <a href="#features" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">Platform Overview</a>
        <a href="#question-bank" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">400+ Verified Easy</a>
        <a href="#roadmap" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">DSA Roadmap</a>
        <a href="#reminders" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">10 PM IST Reminders</a>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
