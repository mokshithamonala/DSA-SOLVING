import React, { useState } from 'react';
import { 
  BellRing, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Mail, 
  Send, 
  AlertCircle, 
  Key, 
  History,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';

export const ReminderSettingsPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const [settings, setSettings] = useState(OrbitDB.getReminderSettings(user.id));
  const [resendKey, setResendKey] = useState(OrbitDB.getResendApiKey());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState(OrbitDB.getEmailLogs(user.id));

  const handleToggleReminders = () => {
    const updated = OrbitDB.updateReminderSettings(user.id, {
      reminders_enabled: !settings.reminders_enabled
    });
    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveResendKey = (e: React.FormEvent) => {
    e.preventDefault();
    OrbitDB.setResendApiKey(resendKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTriggerTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await OrbitDB.triggerScheduledReminderCycle(user.id);
      setEmailLogs(OrbitDB.getEmailLogs(user.id));
      if (res.sent > 0) {
        setTestResult(`Personalized 10 PM IST daily reminder dispatched to ${user.email} successfully.`);
      } else if (res.failed > 0) {
        setTestResult(`Dispatch attempted: ${res.logs[0]?.error_message || 'Check API key or logs'}`);
      } else {
        setTestResult('Email already sent today for this account.');
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BellRing className="w-6 h-6 text-sky-400" />
          <span>Automated Daily Reminder Settings</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Personalized daily coding challenges sent directly to <strong className="text-slate-200">{settings.email}</strong> every day at 10:00 PM IST.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Reminder preferences updated successfully.</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Preferences & Test Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Schedule & Delivery Preferences</span>
            </h2>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Daily Practice Email Reminders
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Receive today's 5 assigned problems, pending challenges, and streak status.
                </span>
              </div>
              <button
                onClick={handleToggleReminders}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.reminders_enabled ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.reminders_enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Read-Only Configuration Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Registered Email</span>
                <span className="text-slate-100 font-medium truncate block mt-0.5">{settings.email}</span>
                <span className="text-[10px] text-emerald-400">Auto-enrolled</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Delivery Time</span>
                <span className="text-sky-400 font-bold font-mono text-sm block mt-0.5">22:00 (10:00 PM)</span>
                <span className="text-[10px] text-slate-500">Every evening</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Timezone</span>
                <span className="text-slate-100 font-mono text-xs block mt-0.5">Asia/Kolkata</span>
                <span className="text-[10px] text-slate-500">Standard IST</span>
              </div>
            </div>

            {/* Test Email Dispatcher */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Test Scheduled Reminder</h4>
                  <p className="text-[11px] text-slate-400">
                    Triggers the exact personalized reminder template containing your questions.
                  </p>
                </div>

                <button
                  onClick={handleTriggerTestEmail}
                  disabled={isSendingTest || !settings.reminders_enabled}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Dispatching...' : 'Send Test Reminder Now'}</span>
                </button>
              </div>

              {testResult && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-sky-300">
                  {testResult}
                </div>
              )}
            </div>
          </div>

          {/* Delivery History */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span>Email Delivery Audit Log</span>
            </h3>

            <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/80 text-xs">
                {emailLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{log.recipient_email}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          log.delivery_status === 'sent' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {log.delivery_status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {new Date(log.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 max-w-[200px] truncate text-right">
                      {log.error_message || 'Delivered'}
                    </span>
                  </div>
                ))}

                {emailLogs.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    No reminder dispatches recorded yet for this account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Resend API Configuration & Details */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Resend API Key</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              CodeOrbit dispatches reminders using the Resend API or Supabase Edge Functions. You can optionally supply your personal Resend API key below to send real SMTP emails to your personal inbox.
            </p>

            <form onSubmit={handleSaveResendKey} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Resend Secret Key (e.g. re_...)
                </label>
                <input
                  type="password"
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Save Resend Key
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              When left empty, CodeOrbit uses its simulated high-fidelity cron engine to verify 10 PM IST dispatch schedules and log entries.
            </div>
          </div>

          {/* Architecture Guarantee */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Server-Authoritative Cron</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Reminders run automatically on the server. Your browser does not need to stay open and you do not need to be logged in to receive your daily 10 PM IST email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
