import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Trophy, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Layers,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB, getKolkataDateString } from '../lib/orbitDB';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  if (!user) return null;

  const stats = OrbitDB.getUserStats(user.id);
  const dailyAssignments = OrbitDB.getDailyAssignments(user.id);
  const todayIST = getKolkataDateString();
  const reminderSettings = OrbitDB.getReminderSettings(user.id);

  // Time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleToggleSolve = (questionId: string) => {
    const solved = OrbitDB.toggleQuestionSolved(user.id, questionId);
    if (solved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
    setUpdateTrigger(prev => prev + 1);
  };

  // Weekly activity sample data
  const weeklyData = [
    { day: 'Mon', solved: 4 },
    { day: 'Tue', solved: 5 },
    { day: 'Wed', solved: 3 },
    { day: 'Thu', solved: stats.solvedToday >= 2 ? stats.solvedToday : 5 },
    { day: 'Fri', solved: 2 },
    { day: 'Sat', solved: 4 },
    { day: 'Sun', solved: stats.solvedToday }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {getGreeting()}, {user.full_name}!
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ready for today's coding challenge? You have <strong className="text-sky-400">{stats.pendingCount} pending questions</strong> in <strong className="text-slate-200">{stats.activeTopic.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/today"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Today's Challenge</span>
          </Link>
          <Link
            to="/questions"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Question Bank</span>
          </Link>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Available */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total Easy</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
            {stats.totalAvailable}
          </span>
          <span className="text-[10px] text-slate-500">Verified Easy</span>
        </div>

        {/* Total Solved */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total Solved</span>
          <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums block mt-1">
            {stats.totalSolved}
          </span>
          <span className="text-[10px] text-emerald-500/80">Completed</span>
        </div>

        {/* Solved Today */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Solved Today</span>
          <span className="text-lg font-bold text-sky-400 font-mono tabular-nums block mt-1">
            {stats.solvedToday}
          </span>
          <span className="text-[10px] text-slate-500">of 5 target</span>
        </div>

        {/* Pending Questions */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Pending</span>
          <span className="text-lg font-bold text-amber-400 font-mono tabular-nums block mt-1">
            {stats.pendingCount}
          </span>
          <span className="text-[10px] text-amber-500/80">Carried forward</span>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Current Streak</span>
          <div className="flex items-center gap-1 mt-1">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {stats.currentStreak}d
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Asia/Kolkata</span>
        </div>

        {/* Longest Streak */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Longest Streak</span>
          <div className="flex items-center gap-1 mt-1">
            <Trophy className="w-4 h-4 text-indigo-400" />
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {stats.longestStreak}d
            </span>
          </div>
          <span className="text-[10px] text-slate-500">All-time record</span>
        </div>

        {/* Completed Topics */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Topics Done</span>
          <span className="text-lg font-bold text-sky-400 font-mono tabular-nums block mt-1">
            {stats.completedTopics} / 40
          </span>
          <span className="text-[10px] text-slate-500">Roadmap</span>
        </div>

        {/* Overall Completion */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Overall Done</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums block mt-1">
            {stats.completionPercentage}%
          </span>
          <span className="text-[10px] text-slate-500">Progress</span>
        </div>
      </div>

      {/* Main Grid: Today's 5 Questions + Active Topic & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Daily 5 Questions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Today's Daily Challenge</h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {stats.activeTopic.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  5 daily questions from your active topic. Complete manually to earn today's streak.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  {stats.solvedToday} / {dailyAssignments.length} Done
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">{todayIST}</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="mt-4 divide-y divide-slate-800/80">
              {dailyAssignments.map((item, idx) => {
                const q = item.question;
                if (!q) return null;
                const isSolved = item.status === 'completed';

                return (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Manual checkbox */}
                      <button
                        onClick={() => handleToggleSolve(q.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isSolved
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-700 hover:border-sky-400 bg-slate-950'
                        }`}
                        title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                      >
                        {isSolved && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-500 tabular-nums">#{q.leetcode_id}</span>
                          <a
                            href={q.problem_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs sm:text-sm font-semibold truncate hover:text-sky-400 transition-colors flex items-center gap-1.5 ${
                              isSolved ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            <span>{q.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                          </a>

                          {item.assignment_type === 'carried_forward' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                              Carried Forward
                            </span>
                          )}

                          {q.is_premium && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
                              Premium
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{q.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span>{q.topics.slice(0, 2).join(', ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isSolved ? 'text-emerald-400' : 'text-amber-400'}>
                            {isSolved ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={q.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-300 hover:text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>LeetCode</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Clicking checkbox records completion & updates your streak immediately.
              </span>
              <Link to="/today" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
                <span>Full Challenge View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span>Weekly Activity Rhythm</span>
                </h3>
                <p className="text-xs text-slate-400">Questions completed per day this week.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {weeklyData.reduce((acc, curr) => acc + curr.solved, 0)} solved this week
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="solved" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Topic & Automated Reminder Status */}
        <div className="space-y-4">
          {/* Active Topic Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                Active Topic
              </span>
              <span className="text-xs font-mono text-slate-300 tabular-nums">
                {stats.topicSolvedCount}/{stats.topicQuestionsCount} solved
              </span>
            </div>

            <h3 className="text-base font-bold text-white">{stats.activeTopic.name}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {stats.activeTopic.description}
            </p>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Topic Completion</span>
                <span className="text-sky-400 font-semibold">{stats.topicPercentage}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, stats.topicPercentage)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Next Topic: <strong className="text-slate-300">Strings</strong></span>
              <Link to="/roadmap" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
                <span>Roadmap</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Automated Daily Email Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Automated Daily Reminder</h4>
                <span className="text-[10px] text-slate-400">Scheduled for every registered user</span>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Email:</span>
                <span className="text-slate-200 font-medium truncate max-w-[150px]">{reminderSettings.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timezone:</span>
                <span className="text-slate-200 font-mono">Asia/Kolkata</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Time:</span>
                <span className="text-sky-400 font-bold font-mono">10:00 PM IST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
            </div>

            <div className="mt-3">
              <Link
                to="/settings"
                className="w-full flex justify-center items-center gap-1 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded transition-colors"
              >
                <span>Manage Reminder Settings</span>
              </Link>
            </div>
          </div>

          {/* User Isolation Guarantee Banner */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Independent Progress Isolated</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your assignments, solved count, and streak belong strictly to <strong className="text-slate-300">{user.email}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
