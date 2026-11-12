import React, { useState } from 'react';
import { 
  BellRing, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Clock, 
  Users, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrbitDB, getKolkataDateString } from '../../lib/orbitDB';

export const AdminEmailsPage: React.FC = () => {
  const { user } = useAuth();
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleResult, setCycleResult] = useState<any | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [logs, setLogs] = useState(OrbitDB.getEmailLogs());

  if (!user) return null;

  const adminStats = OrbitDB.getAdminStats();
  const emailStats = adminStats.emailStats;
  const todayIST = getKolkataDateString();

  const handleRunScheduledCycle = async () => {
    setIsRunningCycle(true);
    setCycleResult(null);

    try {
      const res = await OrbitDB.triggerScheduledReminderCycle();
      setCycleResult(res);
      setLogs(OrbitDB.getEmailLogs());
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await OrbitDB.retryFailedEmail(logId);
      setLogs(OrbitDB.getEmailLogs());
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Automated Reminders
            </span>
            <span className="text-xs text-slate-400">Scheduled Daily at 10:00 PM IST</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-400" />
            <span>Email Delivery Monitor</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time audit of daily personalized reminders for every registered user. Duplicate prevention enforced.
          </p>
        </div>

        <button
          onClick={handleRunScheduledCycle}
          disabled={isRunningCycle}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-pulse' : ''}`} />
          <span>{isRunningCycle ? 'Executing Cycle...' : 'Trigger 10 PM IST Cycle Now'}</span>
        </button>
      </div>

      {cycleResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/30 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-sky-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Cycle Executed for All Eligible Registered Users</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Processed: {cycleResult.processed} · Sent: {cycleResult.sent} · Failed: {cycleResult.failed} · Skipped Duplicates: {cycleResult.skippedDuplicates}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Eligible Recipients</span>
          <span className="text-2xl font-bold text-white font-mono tabular-nums block mt-1">
            {emailStats.totalEligible}
          </span>
          <span className="text-[10px] text-slate-500">Registered with reminders</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Successfully Sent</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums block mt-1">
            {emailStats.sentCount}
          </span>
          <span className="text-[10px] text-emerald-500/80">Delivered</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Failed Deliveries</span>
          <span className="text-2xl font-bold text-red-400 font-mono tabular-nums block mt-1">
            {emailStats.failedCount}
          </span>
          <span className="text-[10px] text-slate-500">Retryable</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Success Rate</span>
          <span className="text-2xl font-bold text-sky-400 font-mono tabular-nums block mt-1">
            {emailStats.successRate}%
          </span>
          <span className="text-[10px] text-slate-500">Delivery reliability</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 block">Scheduled Time</span>
          <span className="text-sm font-bold text-amber-400 font-mono block mt-1">
            22:00 IST
          </span>
          <span className="text-[10px] text-slate-500">Cron: 30 16 * * *</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Delivery Logs & Scheduled Execution History</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Date: {todayIST}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-medium">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Email Type</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Sent At (IST)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Result / Message</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((log) => {
                const isSent = log.delivery_status === 'sent';
                return (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {log.recipient_email}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {log.email_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {log.scheduled_date}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded ${
                        isSent 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isSent ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.delivery_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[260px] truncate">
                      {log.error_message || 'Delivered successfully via Resend'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSent && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                        >
                          {retryingId === log.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No reminder logs found yet. Click "Trigger 10 PM IST Cycle Now" to test scheduled dispatch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
