import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';
import { QUESTIONS_DATA } from '../data/questionsData';
import { TOPICS_DATA } from '../data/topicsData';
import confetti from 'canvas-confetti';

const ITEMS_PER_PAGE = 25;

export const QuestionBankPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  if (!user) return null;

  const handleToggle = (questionId: string) => {
    const solved = OrbitDB.toggleQuestionSolved(user.id, questionId);
    if (solved) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    }
    setUpdateTrigger(prev => prev + 1);
  };

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return QUESTIONS_DATA.filter(q => {
      // Search by title, leetcode id, or keyword
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchId = q.leetcode_id.toString().includes(query);
        const matchSlug = q.title_slug.toLowerCase().includes(query);
        const matchTopic = q.topics.some(t => t.toLowerCase().includes(query));
        if (!matchTitle && !matchId && !matchSlug && !matchTopic) {
          return false;
        }
      }

      // Topic filter
      if (selectedTopic !== 'all') {
        const topic = TOPICS_DATA.find(t => t.id === selectedTopic);
        if (topic) {
          const matchTopic = q.topic_ids?.includes(topic.id) || q.topics?.includes(topic.name);
          if (!matchTopic) return false;
        }
      }

      // Status filter
      const isSolved = OrbitDB.isQuestionSolved(user.id, q.id);
      if (statusFilter === 'solved' && !isSolved) return false;
      if (statusFilter === 'unsolved' && isSolved) return false;

      // Access filter
      if (accessFilter === 'free' && q.is_premium) return false;
      if (accessFilter === 'premium' && !q.is_premium) return false;

      return true;
    });
  }, [searchQuery, selectedTopic, statusFilter, accessFilter, updateTrigger, user.id]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const stats = OrbitDB.getUserStats(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" />
            <span>LeetCode Easy Question Bank</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Browse, filter, and track <strong className="text-slate-200">682 verified LeetCode Easy problems</strong>. Complete them at your own pace.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            Solved: <strong className="text-emerald-400">{stats.totalSolved}</strong> / {stats.totalAvailable}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by problem name, #ID, or keyword (e.g. 'Two Sum', '1', 'reverse')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-medium"
            />
          </div>

          {/* Topic Select */}
          <div>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="all">All Topics (40 Categories)</option>
              {TOPICS_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.phase})
                </option>
              ))}
            </select>
          </div>

          {/* Status & Access Tabs */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved Only</option>
              <option value="unsolved">Unsolved Only</option>
            </select>

            <select
              value={accessFilter}
              onChange={(e) => {
                setAccessFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="all">Free & Premium</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>
        </div>

        {/* Filter results counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>
            Showing <strong className="text-slate-200 font-mono">{filteredQuestions.length}</strong> matching verified questions
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Questions Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-medium">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Problem Title</th>
                <th className="py-3 px-4">Topics</th>
                <th className="py-3 px-4 w-24">Difficulty</th>
                <th className="py-3 px-4 w-24">Access</th>
                <th className="py-3 px-4 w-32 text-right">LeetCode Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedQuestions.map((q) => {
                const isSolved = OrbitDB.isQuestionSolved(user.id, q.id);

                return (
                  <tr
                    key={q.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      isSolved ? 'bg-slate-950/30' : ''
                    }`}
                  >
                    {/* Solved Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(q.id)}
                        className={`w-4 h-4 rounded border mx-auto flex items-center justify-center transition-colors cursor-pointer ${
                          isSolved
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-700 hover:border-sky-400 bg-slate-950'
                        }`}
                        title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                      >
                        {isSolved && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Question ID */}
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      #{q.leetcode_id}
                    </td>

                    {/* Problem Title */}
                    <td className="py-3 px-4">
                      <a
                        href={q.problem_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-semibold hover:text-sky-400 transition-colors flex items-center gap-1.5 ${
                          isSolved ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        <span>{q.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </a>
                    </td>

                    {/* Topic Tags */}
                    <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                      {q.topics.join(' · ')}
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-medium">Easy</span>
                    </td>

                    {/* Access (Free vs Premium) */}
                    <td className="py-3 px-4">
                      {q.is_premium ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          Premium
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          Free
                        </span>
                      )}
                    </td>

                    {/* Direct URL */}
                    <td className="py-3 px-4 text-right">
                      <a
                        href={q.problem_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
                      >
                        <span>Solve</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}

              {paginatedQuestions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No questions found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-mono text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-mono text-slate-200">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}
            </span>{' '}
            of <span className="font-mono text-slate-200">{filteredQuestions.length}</span> questions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
