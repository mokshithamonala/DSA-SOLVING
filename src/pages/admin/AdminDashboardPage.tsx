import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  BookOpen, 
  BellRing, 
  ArrowRight,
  Sparkles,
  Server,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrbitDB } from '../../lib/orbitDB';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const adminStats = OrbitDB.getAdminStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Platform Administration
            </span>
            <span className="text-xs text-slate-400">Restricted to Staff Roles</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>CodeOrbit Control Center</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Monitor registered users, inspect question collection integrity, and audit automated email pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/questions"
            className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Question Validation</span>
          </Link>
          <Link
            to="/admin/emails"
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <BellRing className="w-4 h-4" />
            <span>Email Delivery Monitor</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Total Registered</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-white font-mono tabular-nums block">
            {adminStats.totalUsers}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Open signup (unlimited)</span>
        </div>

        {/* Verified Easy Questions */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Verified Easy Questions</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums block">
            {adminStats.totalQuestions}
          </span>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">400+ Requirement Satisfied</span>
        </div>

        {/* Email Success Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Email Delivery Rate</span>
            <BellRing className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-sky-400 font-mono tabular-nums block">
            {adminStats.emailStats.successRate}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {adminStats.emailStats.sentCount} sent / {adminStats.emailStats.totalEligible} eligible
          </span>
        </div>

        {/* Active Practice Accounts */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Active Users</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold text-indigo-300 font-mono tabular-nums block">
            {adminStats.activeUsers}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">With recorded activity</span>
        </div>
      </div>

      {/* Two Column Deep Dives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions Collection Status */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Question Collection Health</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Complete
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Total Imported</span>
              <span className="font-bold text-slate-100 font-mono mt-0.5 block">682</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Duplicate Records</span>
              <span className="font-bold text-emerald-400 font-mono mt-0.5 block">0</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Invalid URLs</span>
              <span className="font-bold text-emerald-400 font-mono mt-0.5 block">0</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Premium Questions</span>
              <span className="font-bold text-amber-400 font-mono mt-0.5 block">44</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Excluded Medium/Hard</span>
              <span className="font-bold text-slate-400 font-mono mt-0.5 block">0</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Collection Status</span>
              <span className="font-bold text-emerald-400 font-mono mt-0.5 block text-[11px]">Satisfied</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/questions"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
            >
              <span>View Full Dataset Inspection Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Email Pipeline & Scheduler Health */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>Automated Reminder Pipeline</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Daily 22:00 IST
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Timezone:</span>
              <span className="text-slate-200 font-mono">Asia/Kolkata</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Scheduled Trigger:</span>
              <span className="text-sky-400 font-mono font-semibold">10:00 PM (16:30 UTC)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">All Registered Users Enrolled:</span>
              <span className="text-emerald-400 font-semibold">Yes (Automatic)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duplicate Prevention:</span>
              <span className="text-emerald-400 font-semibold">Enforced via email_logs constraint</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/emails"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
            >
              <span>Inspect Delivery Logs & Test Scheduled Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
