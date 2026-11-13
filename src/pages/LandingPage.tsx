import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Milestone, 
  BookOpen, 
  ExternalLink,
  Users,
  Clock,
  Layers
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { QUESTIONS_DATA } from '../data/questionsData';
import { TOPICS_DATA } from '../data/topicsData';

export const LandingPage: React.FC = () => {
  const sampleQuestions = QUESTIONS_DATA.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-8 border-b border-slate-800/80 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Open Registration · Multi-User Platform · Zero Limits</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none text-balance">
            Your Daily DSA Practice Platform.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance">
            CodeOrbit empowers students and developers to master Data Structures and Algorithms through 
            <strong className="text-slate-200"> 400+ verified LeetCode Easy challenges</strong>, daily 5-question assignments with carry-forward + top-up, and 
            <strong className="text-slate-200"> automated daily email reminders at 1:00 PM, 5:30 PM & 10:00 PM IST</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In with Existing Account</span>
            </Link>
          </div>

          {/* Value markers */}
          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>400+ Verified LeetCode Easy</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Auto Carry-Forward Pending Work</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1:00 PM, 5:30 PM & 10:00 PM IST Reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Strict User Isolation & Streaks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-16 px-4 sm:px-8 border-b border-slate-800/80 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Engineered for Continuous Problem-Solving Consistency
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Everything you need to build long-term coding habits without burnout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">400+ Verified Easy Questions</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Extracted and verified from curated LeetCode datasets. Every problem links directly to its official LeetCode URL with real problem IDs and topic tags.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-sky-400 font-mono">
              682 verified problems · 0 duplicates
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Carry-Forward + Top-Up to 5</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Never lose track of unfinished questions. If you solve 3 out of 5 today, the remaining 2 carry forward tomorrow and 3 new problems are added to keep your daily target at 5.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-amber-400 font-mono">
              Zero lost tasks · Personalized daily batch
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">3x Daily IST Email Reminders</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Every logged-in user is automatically enrolled. A background scheduler dispatches personalized emails daily at 1:00 PM, 5:30 PM & 10:00 PM IST with their exact solved and pending questions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 font-mono">
              Auto-enrolled on login · Duplicate-safe
            </div>
          </div>
        </div>
      </section>

      {/* Live Question Bank Sample Preview */}
      <section id="question-bank" className="py-16 px-4 sm:px-8 border-b border-slate-800/80 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Verified Problem Bank</h2>
            <p className="text-xs text-slate-400 mt-1">Real LeetCode Easy problems with direct clickable problem URLs.</p>
          </div>
          <Link
            to="/signup"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
          >
            <span>Explore all 400+ questions in Question Bank</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
          <div className="divide-y divide-slate-800">
            {sampleQuestions.map((q) => (
              <div key={q.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/60 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 w-12 tabular-nums">#{q.leetcode_id}</span>
                  <div>
                    <a
                      href={q.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-200 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{q.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{q.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topics.slice(0, 2).join(', ')}</span>
                      {q.is_premium && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-mono text-[10px]">Premium</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500">Unsolved</span>
                  <Link
                    to="/signup"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    Track in CodeOrbit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Roadmap Preview */}
      <section id="roadmap" className="py-16 px-4 sm:px-8 border-b border-slate-800/80 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Structured 6-Phase DSA Roadmap
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Progress sequentially through 40 foundational DSA topics. Master each topic completely to unlock the next.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { phase: 'Phase 1', title: 'Fundamentals', count: '10 Topics', icon: Layers },
            { phase: 'Phase 2', title: 'Linear Structures', count: '6 Topics', icon: Milestone },
            { phase: 'Phase 3', title: 'Trees & Heaps', count: '6 Topics', icon: BookOpen },
            { phase: 'Phase 4', title: 'Graphs & BFS', count: '5 Topics', icon: Sparkles },
            { phase: 'Phase 5', title: 'Techniques & DP', count: '8 Topics', icon: Flame },
            { phase: 'Phase 6', title: 'Specialized', count: '5 Topics', icon: CheckCircle2 }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-left">
              <span className="text-[10px] uppercase font-mono text-sky-400">{item.phase}</span>
              <h4 className="text-xs font-bold text-slate-200 mt-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{item.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Strip */}
      <section className="py-16 px-4 sm:px-8 text-center max-w-3xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ready to Elevate Your Daily DSA Consistency?
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Create your free account today. Start practicing your first 5 questions immediately and receive automated reminders at 1:00 PM, 5:30 PM & 10:00 PM IST.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 sm:px-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div>
          <span className="font-semibold text-slate-300">CodeOrbit</span> · Your Daily DSA Practice Platform
        </div>
        <div>
          Timezone: <span className="font-mono text-slate-400">Asia/Kolkata</span> · Scheduled Reminders: <span className="font-mono text-slate-400">1:00 PM, 5:30 PM & 10:00 PM IST</span>
        </div>
      </footer>
    </div>
  );
};
