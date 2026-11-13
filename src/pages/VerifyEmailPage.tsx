import React from 'react';
import { Link } from 'react-router-dom';
import { Orbit, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();

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
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-xl border border-slate-800 rounded-xl sm:px-10 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-white">Account Verified Successfully</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Your email <strong className="text-slate-200">{user?.email || 'your account'}</strong> has been verified and registered in the daily automated reminder system.
          </p>

          <div className="mt-4 p-3 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 text-left">
            <div>· Daily Reminders: <strong className="text-emerald-400">Enabled</strong></div>
            <div>· Scheduled Delivery: <strong className="text-slate-200 font-mono">1:00 PM · 5:30 PM · 10:00 PM IST</strong></div>
            <div>· Active Topic: <strong className="text-sky-400">Arrays (Phase 1)</strong></div>
          </div>

          <div className="mt-6">
            <Link
              to="/dashboard"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-xs text-xs font-semibold text-slate-950 bg-sky-500 hover:bg-sky-400 focus:outline-hidden transition-colors"
            >
              <span>Go to Your Personal Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
