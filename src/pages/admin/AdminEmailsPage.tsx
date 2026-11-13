import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Check,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrbitDB, getKolkataDateString, MailProviderStatus, REMINDER_SLOT_META } from '../../lib/orbitDB';
import { EmailLog, ReminderSettings, UserProfile } from '../../types';

export const AdminEmailsPage: React.FC = () => {
  const { user, dataVersion } = useAuth();
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('13:00');
  const [cycleResult, setCycleResult] = useState<any | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>(OrbitDB.getEmailLogs());
  const [serverUsers, setServerUsers] = useState<(UserProfile & { reminderSettings?: ReminderSettings })[]>([]);
  const [serverStats, setServerStats] = useState<ReturnType<typeof OrbitDB.getAdminStats> | null>(null);
  const [mailStatus, setMailStatus] = useState<MailProviderStatus | null>(null);

  // Mail Provider Config Form State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
  const [configMsg, setConfigMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadOverview = async () => {
    const res = await OrbitDB.fetchAdminOverview();
    if (res) {
      setLogs(res.logs);
      setServerUsers(res.users);
      setServerStats(res.stats);
      setMailStatus(res.mailProviderStatus);
      if (res.mailProviderStatus.smtpHost) setSmtpHost(res.mailProviderStatus.smtpHost);
      if (res.mailProviderStatus.smtpUser) setSmtpUser(res.mailProviderStatus.smtpUser);
      if (res.mailProviderStatus.resendFromEmail) setResendFromEmail(res.mailProviderStatus.resendFromEmail);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [dataVersion]);

  if (!user) return null;

  const adminStats = serverStats || OrbitDB.getAdminStats();
  const emailStats = adminStats.emailStats;
  const todayIST = getKolkataDateString();

  const handleRunScheduledCycle = async (slotToRun: string) => {
    setIsRunningCycle(true);
    setCycleResult(null);

    try {
      const res = await OrbitDB.triggerScheduledReminderCycle(undefined, slotToRun);
      setCycleResult(res);
      await loadOverview();
    } catch (err: any) {
      setCycleResult({ error: err.message });
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await OrbitDB.retryFailedEmail(logId);
      await loadOverview();
    } finally {
      setRetryingId(null);
    }
  };

  const handleSaveMailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigMsg(null);
    try {
      const updated = await OrbitDB.saveMailConfig({
        smtpHost: smtpHost.trim() || 'smtp.gmail.com',
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser.trim(),
        ...(smtpPass.trim() ? { smtpPass: smtpPass.trim() } : {}),
        resendFromEmail: resendFromEmail.trim()
      });
      setMailStatus(updated);
      setSmtpPass('');
      setConfigMsg({
        ok: true,
        text: updated.smtpConfigured
          ? `SMTP configured (${updated.smtpUser}). Emails can now deliver to ALL registered recipients!`
          : updated.resendCustomDomain
            ? `Verified Resend sender saved (${updated.resendFromEmail}).`
            : 'Mail configuration updated.'
      });
    } catch (err: any) {
      setConfigMsg({ ok: false, text: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const hasMultiRecipientDelivery =
    Boolean(mailStatus?.smtpConfigured || mailStatus?.resendCustomDomain);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Automated 3x Daily Scheduler
            </span>
            <span className="text-xs text-slate-400">1:00 PM · 5:30 PM · 10:00 PM IST</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-400" />
            <span>Email Delivery Monitor</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time audit of personalized daily reminders for every registered and logged-in user.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={selectedSlot}
            onChange={e => setSelectedSlot(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
          >
            {REMINDER_SLOT_META.map(s => (
              <option key={s.slot} value={s.slot}>
                {s.label} ({s.slot})
              </option>
            ))}
            <option value="manual">Manual Check-In</option>
          </select>

          <button
            onClick={() => handleRunScheduledCycle(selectedSlot)}
            disabled={isRunningCycle}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-pulse' : ''}`} />
            <span>{isRunningCycle ? 'Dispatching Batch...' : 'Send Batch to All Users Now'}</span>
          </button>
        </div>
      </div>

      {!hasMultiRecipientDelivery && mailStatus && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Action Needed to Deliver Emails to All Registered Users
            </p>
            <p className="text-amber-200/80 leading-relaxed">
              Resend is currently using <code>onboarding@resend.dev</code> with no verified custom domain, so Resend only delivers to the account owner (<code>saimokshitha478@gmail.com</code>) and rejects other users. Configure a <strong>Gmail App Password</strong> below (easiest, free, delivers to any email) or add a verified Resend sender domain.
            </p>
          </div>
        </div>
      )}

      {cycleResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/30 text-xs text-slate-300 space-y-1">
          {cycleResult.error ? (
            <div className="text-red-400 font-semibold">Error: {cycleResult.error}</div>
          ) : (
            <>
              <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>
                  Batch Executed ({cycleResult.slotLabel || cycleResult.slot}) for All Enrolled Users
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Processed: {cycleResult.processed} · Sent: {cycleResult.sent} · Failed: {cycleResult.failed} · Skipped Duplicates: {cycleResult.skippedDuplicates}
              </div>
            </>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Enrolled Users</span>
          <span className="text-2xl font-bold text-white font-mono tabular-nums block mt-1">
            {emailStats.totalEligible}
          </span>
          <span className="text-[10px] text-slate-500">Auto-enrolled on login</span>
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
          <span className="text-xs text-slate-400 block">Daily IST Slots</span>
          <span className="text-xs font-bold text-amber-400 font-mono block mt-1.5">
            1:00 PM · 5:30 PM · 10:00 PM
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Asia/Kolkata</span>
        </div>
      </div>

      {/* Multi-Recipient Mail Provider Configuration + Enrolled Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mail Provider Setup */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Multi-Recipient Email Provider (SMTP / Resend)</span>
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                hasMultiRecipientDelivery
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {hasMultiRecipientDelivery ? 'ALL RECIPIENTS READY' : 'SANDBOX ONLY'}
            </span>
          </div>

          <form onSubmit={handleSaveMailConfig} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">SMTP Host (e.g. smtp.gmail.com)</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">SMTP Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gmail / SMTP Email (SMTP_USER)</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gmail App Password (SMTP_PASS)</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  placeholder={mailStatus?.smtpConfigured ? '•••••••• (saved)' : '16-char Google App Password'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                OR Resend Verified From Address (RESEND_FROM_EMAIL)
              </label>
              <input
                type="text"
                value={resendFromEmail}
                onChange={e => setResendFromEmail(e.target.value)}
                placeholder="CodeOrbit <reminders@yourdomain.com>"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>

            {configMsg && (
              <div
                className={`p-2.5 rounded border text-xs ${
                  configMsg.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {configMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? 'Saving...' : 'Save Mail Delivery Configuration'}
            </button>
          </form>
        </div>

        {/* Enrolled Registered Users */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Enrolled Registered Users ({serverUsers.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Auto-saved on Login/Signup</span>
          </div>

          <div className="rounded-lg bg-slate-950 border border-slate-800 divide-y divide-slate-800/80 max-h-[290px] overflow-y-auto text-xs">
            {serverUsers.map(u => {
              const rs = u.reminderSettings;
              const enabled = rs?.reminders_enabled !== false;
              const slots = rs?.reminder_slots?.join(', ') || '13:00, 17:30, 22:00';
              return (
                <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{u.full_name}</div>
                    <div className="text-[11px] text-sky-400 font-mono truncate">{u.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {enabled ? 'AUTO-ENROLLED' : 'PAUSED'}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">{slots} IST</div>
                  </div>
                </div>
              );
            })}
            {serverUsers.length === 0 && (
              <div className="p-6 text-center text-slate-500">Loading registered users...</div>
            )}
          </div>
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
                <th className="py-3 px-4">Slot / Type</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Sent At (IST)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Result / Message</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map(log => {
                const isSent = log.delivery_status === 'sent';
                return (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">{log.recipient_email}</td>
                    <td className="py-3 px-4 text-sky-300 font-mono text-[11px]">
                      {log.reminder_slot || log.email_type}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {log.provider || 'resend'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {log.scheduled_date}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded ${
                          isSent
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {isSent ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.delivery_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[260px] truncate" title={log.error_message}>
                      {log.error_message || 'Delivered'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSent && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
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
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No reminder logs found yet. Click "Send Batch to All Users Now" to dispatch and inspect logs.
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
