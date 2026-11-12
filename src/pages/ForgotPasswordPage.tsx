import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Orbit, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
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
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your registered email and we'll dispatch a secure reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-xl border border-slate-800 rounded-xl sm:px-10">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Password Reset Link Sent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists for <strong className="text-slate-200">{email}</strong>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Registered Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="block w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-xs text-xs font-semibold text-slate-950 bg-sky-500 hover:bg-sky-400 focus:outline-hidden transition-colors cursor-pointer"
                >
                  <span>Send Reset Link</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
