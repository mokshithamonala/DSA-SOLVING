import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Flame, 
  ArrowRight, 
  RotateCcw,
  BookOpen,
  Check,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB, getKolkataDateString } from '../lib/orbitDB';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

export const TodayChallengePage: React.FC = () => {
  const { user, dataVersion } = useAuth();
  const [, setUpdateTrigger] = useState(0);

  if (!user) return null;

  const todayIST = getKolkataDateString();
  const dailyAssignments = OrbitDB.getDailyAssignments(user.id);
  const activeTopic = OrbitDB.getActiveTopic(user.id);
  const streak = OrbitDB.getUserStreak(user.id);

  const completedCount = dailyAssignments.filter(a => a.status === 'completed').length;
  const pendingCount = dailyAssignments.filter(a => a.status === 'pending').length;
  const totalCount = dailyAssignments.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  const handleToggle = (questionId: string) => {
    const solved = OrbitDB.toggleQuestionSolved(user.id, questionId);
    if (solved) {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    setUpdateTrigger(prev => prev + 1);
  };

  const handleGenerateNextBatch = () => {
    // Assign next 5 questions from active topic and sync to backend
    OrbitDB.generateDailyAssignments(user.id, true);
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {activeTopic.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">Date: {todayIST} (Asia/Kolkata)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Today's 5-Question Challenge</span>
            {isAllCompleted && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                Completed!
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Assigned from your active roadmap topic. Unfinished challenges carry forward automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500/20 text-amber-400" />
            <span className="font-mono tabular-nums">{streak.current_streak}</span>
            <span>Day Streak</span>
          </div>

          {isAllCompleted && (
            <button
              onClick={handleGenerateNextBatch}
              className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Next 5 Questions</span>
            </button>
          )}
        </div>
      </div>

      {/* Target & Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Daily Target</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums mt-1 block">5 Problems</span>
          <span className="text-[10px] text-slate-500">LeetCode Easy</span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Assigned Today</span>
          <span className="text-xl font-bold text-sky-400 font-mono tabular-nums mt-1 block">{totalCount}</span>
          <span className="text-[10px] text-slate-500">Active workload</span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Completed</span>
          <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1 block">{completedCount}</span>
          <span className="text-[10px] text-emerald-500/80">Manually solved</span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Pending</span>
          <span className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-amber-500/80">Carries forward tomorrow</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-slate-300">
            Daily Progress: <strong className="text-sky-400">{completedCount} of {totalCount} Completed</strong>
          </span>
          <span className="text-sky-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Questions Card Container */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800">
        {dailyAssignments.map((assignment, index) => {
          const q = assignment.question;
          if (!q) return null;
          const isSolved = assignment.status === 'completed';
          const isCarried = assignment.assignment_type === 'carried_forward';

          return (
            <div
              key={assignment.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isSolved ? 'bg-slate-950/40' : 'hover:bg-slate-850/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Manual Solved Checkbox */}
                <button
                  onClick={() => handleToggle(q.id)}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 ${
                    isSolved
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs'
                      : 'border-slate-700 hover:border-sky-400 bg-slate-950'
                  }`}
                  title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                >
                  {isSolved && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      Q{index + 1} (#{q.leetcode_id})
                    </span>

                    <a
                      href={q.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm sm:text-base font-semibold hover:text-sky-400 transition-colors flex items-center gap-1.5 ${
                        isSolved ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      <span>{q.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </a>

                    {isCarried && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Carried Forward{assignment.original_date ? ` (from ${assignment.original_date})` : ''}
                      </span>
                    )}

                    {q.is_premium && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        LeetCode Premium
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed metadata with separators */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 flex-wrap">
                    <span className="text-emerald-400 font-medium">{q.difficulty}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{q.topics.join(', ')}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Assigned: {assignment.assignment_date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 shrink-0 sm:self-center">
                <span className={`text-xs font-semibold ${isSolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isSolved ? 'Solved' : 'Pending'}
                </span>
                <a
                  href={q.problem_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Solve on LeetCode</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carry-Forward Policy Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Carry-Forward + Top-Up Rule:</strong> Any unfinished questions from today automatically carry forward tomorrow and combine with new unsolved questions to make 5 total (e.g., 2 pending + 3 new = 5).
          </span>
        </div>
        <Link to="/roadmap" className="text-sky-400 hover:text-sky-300 font-semibold whitespace-nowrap">
          View Active Roadmap Topic →
        </Link>
      </div>
    </div>
  );
};
