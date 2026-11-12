import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  if (!user) return null;

  const [fullName, setFullName] = useState(user.full_name);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim()) {
      updateProfile({ full_name: fullName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const streak = OrbitDB.getUserStreak(user.id);
  const stats = OrbitDB.getUserStats(user.id);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="w-6 h-6 text-sky-400" />
          <span>User Profile</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage your personal account details and review your practice credentials.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`}
            alt={user.full_name}
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-800"
          />
          <div>
            <h2 className="text-base font-bold text-white">{user.full_name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {user.role}
              </span>
              <span className="text-[11px] text-slate-500">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Email Address (Authentication & Reminders)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="mt-1 block w-full rounded-md bg-slate-950/60 border border-slate-800/80 px-3 py-2 text-xs text-slate-400 cursor-not-allowed font-mono"
            />
            <span className="block mt-1 text-[11px] text-slate-500">
              Your registered email is automatically synchronized with the 10:00 PM IST reminder system.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Snapshot Summary */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3">Account Practice Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Solved</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">{stats.totalSolved}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Active Streak</span>
            <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">{streak.current_streak} days</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Current Topic</span>
            <span className="text-sm font-bold text-sky-400 mt-1 block truncate">{stats.activeTopic.name}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Account ID</span>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">{user.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
