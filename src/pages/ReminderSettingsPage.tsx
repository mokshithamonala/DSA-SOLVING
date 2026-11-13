import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Key,
  History,
  Info,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB, REMINDER_SLOT_META, DEFAULT_REMINDER_SLOTS } from '../lib/orbitDB';

interface ServerReminderStatus {
  currentKolkataDate: string;
  currentKolkataTime: string;
  providers: {
    smtpConfigured: boolean;
    smtpUser: string;
    resendConfigured: boolean;
    resendCustomDomain: boolean;
    resendFromEmail: string;
  };
}

export const ReminderSettingsPage: React.FC = () => {
  const { user, dataVersion } = useAuth();
  const [settings, setSettings] = useState(() =>
    user ? OrbitDB.getReminderSettings(user.id) : null
  );
  const [resendKey, setResendKey] = useState(OrbitDB.getResendApiKey());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedTestSlot, setSelectedTestSlot] = useState<string>('manual');
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState(() => (user ? OrbitDB.getEmailLogs(user.id) : []));
  const [serverStatus, setServerStatus] = useState<ServerReminderStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    setSettings(OrbitDB.getReminderSettings(user.id));
    setEmailLogs(OrbitDB.getEmailLogs(user.id));
  }, [user, dataVersion]);

  useEffect(() => {
    if (!user) return;
    void OrbitDB.hydrateUserFromServer(user.id);
    fetch('/api/reminders/status')
      .then(r => r.json())
      .then(d => setServerStatus(d))
      .catch(() => {});
  }, [user?.id]);

  if (!user || !settings) return null;

  const activeSlots = settings.reminder_slots && settings.reminder_slots.length > 0
    ? settings.reminder_slots
    : [...DEFAULT_REMINDER_SLOTS];

  const handleToggleReminders = () => {
    const updated = OrbitDB.updateReminderSettings(user.id, {
      reminders_enabled: !settings.reminders_enabled
    });
    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleSlot = (slot: string) => {
    const exists = activeSlots.includes(slot);
    let nextSlots = exists
      ? activeSlots.filter(s => s !== slot)
      : [...activeSlots, slot];

    if (nextSlots.length === 0) {
      nextSlots = [slot];
    }

    const order = ['13:00', '17:30', '22:00'];
    nextSlots.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    const updated = OrbitDB.updateReminderSettings(user.id, {
      reminder_slots: nextSlots
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
      const res = await OrbitDB.triggerScheduledReminderCycle(user.id, selectedTestSlot);
      setEmailLogs(OrbitDB.getEmailLogs(user.id));
      const log = res.logs[0];
      if (res.sent > 0) {
        setTestResult({
          ok: true,
          text: `Personalized reminder dispatched to ${user.email} (${log?.provider?.toUpperCase() || 'Email'}).`
        });
      } else if (res.failed > 0) {
        setTestResult({
          ok: false,
          text: `Delivery failed for ${user.email}: ${log?.error_message || 'Check mail provider configuration.'}`
        });
      } else {
        setTestResult({
          ok: true,
          text: 'Reminder slot already delivered today for this account.'
        });
      }
    } catch (e: any) {
      setTestResult({ ok: false, text: `Error: ${e.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  const sandboxRestrictionApplies =
    serverStatus &&
    !serverStatus.providers.smtpConfigured &&
    !serverStatus.providers.resendCustomDomain &&
    user.email.toLowerCase() !== 'saimokshitha478@gmail.com';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-sky-400" />
            <span>Automated Daily Reminder Settings</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Personalized coding challenges and pending carry-forward status sent automatically to{' '}
            <strong className="text-slate-200">{settings.email}</strong> at{' '}
            <strong className="text-sky-400">1:00 PM, 5:30 PM & 10:00 PM IST</strong>.
          </p>
        </div>
        {serverStatus && (
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shrink-0">
            <span className="text-slate-500 block text-[10px]">Server Clock (Asia/Kolkata)</span>
            <span className="text-sky-400 font-bold">
              {serverStatus.currentKolkataDate} · {serverStatus.currentKolkataTime} IST
            </span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Reminder preferences synced with server scheduler.</span>
        </div>
      )}

      {sandboxRestrictionApplies && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Resend Sandbox Restriction Active for Non-Owner Emails
            </p>
            <p className="text-amber-200/80 leading-relaxed">
              Your email <strong>{user.email}</strong> is saved and scheduled in CodeOrbit, and the server will attempt delivery at 1:00 PM, 5:30 PM, and 10:00 PM IST. However, Resend's default <code>onboarding@resend.dev</code> sender only delivers to the Resend account owner (<code>saimokshitha478@gmail.com</code>). To deliver real inbox emails to all other addresses, configure Gmail SMTP or a verified Resend domain in Admin Email Monitor (or <code>.env</code>).
            </p>
          </div>
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

            {/* Master Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Automatic Daily Practice Email Reminders
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Enabled automatically on login/signup. Sends your solved & pending problems plus carry-forward status.
                </span>
              </div>
              <button
                onClick={handleToggleReminders}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.reminders_enabled ? 'bg-sky-500' : 'bg-slate-800'
                }`}
                aria-label="Toggle Daily Reminders"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.reminders_enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* 3 Daily IST Slots */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2.5">
                Daily Reminder Schedule (Asia/Kolkata)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {REMINDER_SLOT_META.map(slotItem => {
                  const isActive = activeSlots.includes(slotItem.slot);
                  return (
                    <button
                      key={slotItem.slot}
                      type="button"
                      onClick={() => handleToggleSlot(slotItem.slot)}
                      className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-500/10 border-sky-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-sky-400">
                          {slotItem.shortLabel}
                        </span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isActive
                              ? 'bg-sky-500 border-sky-500 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                      <span className="block text-[11px] text-slate-400 mt-1">
                        {slotItem.label} ({slotItem.slot})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuration Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Registered Email</span>
                <span className="text-slate-100 font-medium truncate block mt-0.5">{settings.email}</span>
                <span className="text-[10px] text-emerald-400">Saved on server</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Active Slots</span>
                <span className="text-sky-400 font-bold font-mono text-xs block mt-0.5">
                  {activeSlots.join(' · ')}
                </span>
                <span className="text-[10px] text-slate-500">3 check-ins / day</span>
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
                  <h4 className="text-xs font-bold text-white">Send Test Reminder to My Email</h4>
                  <p className="text-[11px] text-slate-400">
                    Dispatches your live personalized challenge & carry-forward report right now.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedTestSlot}
                    onChange={e => setSelectedTestSlot(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="manual">Instant Check-In</option>
                    <option value="13:00">1:00 PM IST Slot</option>
                    <option value="17:30">5:30 PM IST Slot</option>
                    <option value="22:00">10:00 PM IST Slot</option>
                  </select>

                  <button
                    onClick={handleTriggerTestEmail}
                    disabled={isSendingTest || !settings.reminders_enabled}
                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingTest ? 'Dispatching...' : 'Send Now'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-lg border text-xs ${
                    testResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {testResult.text}
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
                {emailLogs.map(log => (
                  <div key={log.id} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{log.recipient_email}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            log.delivery_status === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {log.delivery_status.toUpperCase()}
                        </span>
                        {log.reminder_slot && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-300">
                            {log.reminder_slot}
                          </span>
                        )}
                        {log.provider && (
                          <span className="text-[10px] font-mono text-slate-500">
                            via {log.provider}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {new Date(log.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 max-w-[260px] truncate text-right" title={log.error_message}>
                      {log.error_message || 'Delivered'}
                    </span>
                  </div>
                ))}

                {emailLogs.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    No reminder dispatches recorded yet for this account. Click "Send Now" to test immediately.
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-400 leading-relaxed">
              Tip: If a message shows <strong className="text-emerald-400">SENT via smtp</strong> but is not visible in Primary Inbox, check <strong>Spam / Promotions / All Mail</strong> and click <strong>Report not spam</strong> once (and verify there is no bounce notice in the sender Gmail inbox).
            </p>
          </div>
        </div>

        {/* Right 1 Col: Provider Status & Details */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Mail Delivery Engine</h3>
            </div>
            <div className="space-y-2 text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">SMTP (All Emails):</span>
                <span className={serverStatus?.providers.smtpConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {serverStatus?.providers.smtpConfigured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resend API:</span>
                <span className={serverStatus?.providers.resendConfigured ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {serverStatus?.providers.resendConfigured ? 'Active' : 'Missing Key'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resend Domain:</span>
                <span className={serverStatus?.providers.resendCustomDomain ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {serverStatus?.providers.resendCustomDomain ? 'Verified' : 'Sandbox Only'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveResendKey} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Optional Personal Resend Key Override
                </label>
                <input
                  type="password"
                  value={resendKey}
                  onChange={e => setResendKey(e.target.value)}
                  placeholder="Uses server RESEND_API_KEY by default"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Save Override Key
              </button>
            </form>
          </div>

          {/* Architecture Guarantee */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Server-Authoritative Scheduler</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The Node.js backend checks the Asia/Kolkata clock continuously and dispatches personalized emails automatically at <strong>1:00 PM</strong>, <strong>5:30 PM</strong>, and <strong>10:00 PM IST</strong> for every logged-in user. Unfinished problems automatically carry forward tomorrow + top up to 5.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
