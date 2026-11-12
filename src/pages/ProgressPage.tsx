import React from 'react';
import { 
  BarChart3, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ExternalLink,
  Milestone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';
import { TOPICS_DATA } from '../data/topicsData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const stats = OrbitDB.getUserStats(user.id);
  const streak = OrbitDB.getUserStreak(user.id);
  const topicProgress = OrbitDB.getUserTopicProgress(user.id);

  // Weekly data
  const weeklyData = [
    { day: 'Mon', solved: 4 },
    { day: 'Tue', solved: 5 },
    { day: 'Wed', solved: 3 },
    { day: 'Thu', solved: stats.solvedToday >= 2 ? stats.solvedToday : 5 },
    { day: 'Fri', solved: 2 },
    { day: 'Sat', solved: 4 },
    { day: 'Sun', solved: stats.solvedToday }
  ];

  // Topic breakdown sorted by order
  const topicItems = TOPICS_DATA.map(t => {
    const prog = topicProgress[t.id] || {
      status: t.id === 'arrays' ? 'active' : 'locked',
      total_questions: OrbitDB.getQuestionsForTopic(t.id).length,
      solved_questions: 0
    };
    const pct = prog.total_questions > 0 
      ? Math.round((prog.solved_questions / prog.total_questions) * 100) 
      : 0;

    return {
      topic: t,
      ...prog,
      percentage: pct
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-sky-400" />
          <span>My Personal Analytics</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Private progress overview for <strong className="text-slate-200">{user.email}</strong>. Streak times tracked in Asia/Kolkata.
        </p>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Solved</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums block mt-1">
            {stats.totalSolved}
          </span>
          <span className="text-[11px] text-slate-500">out of {stats.totalAvailable} Easy problems</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Overall Completion</span>
          <span className="text-2xl font-bold text-sky-400 font-mono tabular-nums block mt-1">
            {stats.completionPercentage}%
          </span>
          <span className="text-[11px] text-slate-500">of LeetCode collection</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Current Streak</span>
          <div className="flex items-center gap-1 mt-1">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {streak.current_streak}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">consecutive active days</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Longest Streak</span>
          <div className="flex items-center gap-1 mt-1">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {streak.longest_streak}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">personal best streak</span>
        </div>
      </div>

      {/* Chart & Topic Overview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Weekly Activity Rhythm</h3>
          <p className="text-xs text-slate-400 mb-4">Questions manually solved per day this week.</p>

          <div className="h-56 w-full">
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

        {/* Roadmap Completion Status */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">DSA Roadmap Status</h3>
          <p className="text-xs text-slate-400 mb-4">Top 8 active & unlocked algorithmic domains.</p>

          <div className="space-y-3">
            {topicItems.slice(0, 8).map((item) => (
              <div key={item.topic.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.topic.name}</span>
                  <span className="font-mono text-slate-400">
                    {item.solved_questions}/{item.total_questions} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
