import React from 'react';
import { 
  Milestone, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';
import { TOPICS_DATA } from '../data/topicsData';
import { Link } from 'react-router-dom';

export const RoadmapPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const topicProgress = OrbitDB.getUserTopicProgress(user.id);
  const activeTopic = OrbitDB.getActiveTopic(user.id);

  // Group topics by phase
  const phases = [
    'Phase 1: Fundamentals',
    'Phase 2: Linear Data Structures',
    'Phase 3: Trees and Heaps',
    'Phase 4: Graphs',
    'Phase 5: Problem-Solving Techniques',
    'Phase 6: Additional Topics'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Milestone className="w-6 h-6 text-sky-400" />
            <span>Structured DSA Roadmap</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Sequential mastery of 40 algorithmic domains. Complete 100% of questions in your active topic to unlock the next.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            Active: <span className="text-white">{activeTopic.name}</span>
          </div>
        </div>
      </div>

      {/* Roadmap Phases */}
      {phases.map((phaseName) => {
        const topicsInPhase = TOPICS_DATA.filter(t => t.phase === phaseName);

        return (
          <div key={phaseName} className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                {phaseName}
              </span>
              <span className="text-xs text-slate-500">
                ({topicsInPhase.length} Topics)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topicsInPhase.map((topic) => {
                const prog = topicProgress[topic.id] || {
                  status: topic.id === 'arrays' ? 'active' : 'locked',
                  total_questions: OrbitDB.getQuestionsForTopic(topic.id).length,
                  solved_questions: 0
                };

                const isCompleted = prog.status === 'completed';
                const isActive = prog.status === 'active';
                const isLocked = prog.status === 'locked';

                const percent = prog.total_questions > 0 
                  ? Math.round((prog.solved_questions / prog.total_questions) * 100) 
                  : 0;

                return (
                  <div
                    key={topic.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-slate-900 border-sky-500/40 shadow-sm shadow-sky-500/5'
                        : isCompleted
                        ? 'bg-slate-900/60 border-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">
                          #{topic.display_order}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">{topic.name}</h3>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <Sparkles className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>

                    {/* Progress Bar & Questions Count */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>{prog.solved_questions} of {prog.total_questions} Solved</span>
                        <span className={isActive ? 'text-sky-400 font-bold' : ''}>{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3 text-right">
                        <Link
                          to="/today"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
                        >
                          <span>Practice Topic</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
