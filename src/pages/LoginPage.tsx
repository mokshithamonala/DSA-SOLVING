import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Orbit, AlertCircle, ArrowRight, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
            <Orbit className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">CodeOrbit</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Sign In to CodeOrbit
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Continue your daily streak and solve today's challenge.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-xl border border-slate-800 rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="mt-1 block w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-sky-400 hover:text-sky-300">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 block w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-xs text-xs font-semibold text-slate-950 bg-sky-500 hover:bg-sky-400 focus:outline-hidden transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts for reviewer evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="block text-[11px] font-medium text-slate-400 mb-2">
              Instant Demo Accounts (Click to Autofill):
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex@codeorbit.dev')}
                className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-200">Alex Chen (User A)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">alex@codeorbit.dev</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('maya@codeorbit.dev')}
                className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">Maya Patel (User B)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">maya@codeorbit.dev</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@codeorbit.dev')}
                className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-200">Platform Admin</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">admin@codeorbit.dev</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300">
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
