import React from 'react';
import { Menu, Flame, Bell, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB, getKolkataDateString } from '../lib/orbitDB';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const streak = OrbitDB.getUserStreak(user.id);
  const activeTopic = OrbitDB.getActiveTopic(user.id);
  const stats = OrbitDB.getUserStats(user.id);
  const reminderSettings = OrbitDB.getReminderSettings(user.id);
  const todayIST = getKolkataDateString();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/today') return "Today's Challenge";
    if (path === '/questions') return 'Question Bank';
    if (path === '/roadmap') return 'DSA Roadmap';
    if (path === '/progress') return 'My Progress';
    if (path === '/calendar') return 'Activity Calendar';
    if (path === '/settings') return 'Reminder Settings';
    if (path === '/profile') return 'Profile';
    if (path.startsWith('/admin/questions')) return 'Admin / Questions';
    if (path.startsWith('/admin/emails')) return 'Admin / Email Delivery';
    if (path.startsWith('/admin')) return 'Admin / Overview';
    return 'CodeOrbit';
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-200 hidden sm:inline">
            CodeOrbit
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
          <span className="text-slate-100 font-semibold">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Zone 2: Active Topic & Reminder Schedule */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800">
          <span className="text-slate-400">Active Topic:</span>
          <span className="font-semibold text-sky-400">{activeTopic.name}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-300 tabular-nums">
            {stats.topicSolvedCount}/{stats.topicQuestionsCount} solved
          </span>
        </div>

        <Link
          to="/settings"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
        >
          <Bell className={`w-3.5 h-3.5 ${reminderSettings.reminders_enabled ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>
            Reminders:{' '}
            <strong className="font-mono text-slate-200">
              {reminderSettings.reminders_enabled ? '1:00 PM · 5:30 PM · 10:00 PM IST' : 'Paused'}
            </strong>
          </span>
        </Link>
      </div>

      {/* Zone 3: Streak Counter & Primary Action */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-xs">
          <Flame className="w-4 h-4 fill-amber-500/20 text-amber-400 animate-pulse" />
          <span className="font-mono tabular-nums font-bold">{streak.current_streak}</span>
          <span className="hidden sm:inline text-amber-300/80">days</span>
        </div>

        <Link
          to="/today"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Today's 5 Questions</span>
          <span className="sm:hidden">Today</span>
        </Link>
      </div>
    </header>
  );
};
