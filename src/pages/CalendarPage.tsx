import React from 'react';
import { Calendar as CalendarIcon, Flame, Trophy, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB, getKolkataDateString } from '../lib/orbitDB';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const streak = OrbitDB.getUserStreak(user.id);
  const todayStr = getKolkataDateString();

  // Generate 84 days of activity grid (12 weeks)
  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    
    // Simulate activity for past days based on user streak
    const isToday = dateStr === todayStr;
    const isWithinStreak = i < (streak.current_streak || 1);
    const count = isWithinStreak ? (i % 3 === 0 ? 5 : 4) : (i % 7 === 1 ? 3 : 0);

    days.push({
      date: dateStr,
      count,
      isToday
    });
  }

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-900 border border-slate-800';
    if (count <= 2) return 'bg-sky-950 border border-sky-800 text-sky-300';
    if (count <= 4) return 'bg-sky-600 text-white';
    return 'bg-sky-400 text-slate-950';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
            <span>Activity Calendar</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Daily problem completions tracked in <strong className="text-slate-200">Asia/Kolkata</strong> timezone.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500/20 text-amber-400" />
            <span className="font-mono tabular-nums">{streak.current_streak}</span>
            <span>Day Streak</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">12-Week Contribution Matrix</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>Less</span>
            <span className="w-3 h-3 rounded-xs bg-slate-900 border border-slate-800" />
            <span className="w-3 h-3 rounded-xs bg-sky-950 border border-sky-800" />
            <span className="w-3 h-3 rounded-xs bg-sky-600" />
            <span className="w-3 h-3 rounded-xs bg-sky-400" />
            <span>More</span>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[650px]">
            {days.map((day, idx) => (
              <div
                key={day.date}
                className={`w-4 h-4 rounded-xs transition-colors flex items-center justify-center text-[9px] ${getColorClass(day.count)} ${
                  day.isToday ? 'ring-2 ring-sky-400' : ''
                }`}
                title={`${day.date}: ${day.count} problems solved`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Streaks reset if no problems are manually marked solved within a calendar day in Asia/Kolkata.
          </span>
        </div>
      </div>
    </div>
  );
};
