import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import {
  serverStore,
  REMINDER_SLOTS,
  ReminderSlot,
  getKolkataDateString,
  getKolkataTimeParts,
  StoredEmailLog
} from './server/store';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

/**
 * Send an email via configured provider:
 * 1. If SMTP_USER + SMTP_PASS exist (in .env or server mailConfig), send via Nodemailer SMTP (delivers to ANY email).
 * 2. Otherwise use Resend API (RESEND_API_KEY). Note: Resend's onboarding@resend.dev only delivers to the Resend account owner unless a custom domain is verified in Resend.
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  overrideResendKey?: string;
}): Promise<{ ok: boolean; provider: string; message: string }> {
  const mailCfg = serverStore.getMailConfig();
  const smtpUser = (mailCfg.smtpUser || process.env.SMTP_USER || '').trim();
  const rawSmtpPass = mailCfg.smtpPass || process.env.SMTP_PASS || '';
  const smtpPass = rawSmtpPass.replace(/\s+/g, '');
  const smtpHost = (mailCfg.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(mailCfg.smtpPort || process.env.SMTP_PORT || 465);

  const resendKey = params.overrideResendKey || process.env.RESEND_API_KEY;
  const configuredResendFrom = (mailCfg.resendFromEmail || process.env.RESEND_FROM_EMAIL || '').trim();
  const isFreeWebmailFrom = /@(gmail|yahoo|outlook|hotmail)\.com>?$/i.test(configuredResendFrom);
  const resendFrom = configuredResendFrom && !isFreeWebmailFrom ? configuredResendFrom : 'CodeOrbit <onboarding@resend.dev>';

  let smtpErrorMsg = '';

  // 1. Prefer SMTP if configured (works for ALL recipient email addresses!)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"Sai Mokshitha - CodeOrbit" <${smtpUser}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html
      });

      if (info.rejected && info.rejected.length > 0) {
        throw new Error(`SMTP rejected recipient: ${info.rejected.join(', ')} (${info.response})`);
      }

      return {
        ok: true,
        provider: 'smtp',
        message: `Delivered via Gmail SMTP to ${info.accepted.join(', ')} (${info.response} | ${info.messageId})`
      };
    } catch (smtpErr: any) {
      smtpErrorMsg = smtpErr?.message || 'SMTP delivery failed';
      console.error('[SMTP Error]', params.to, smtpErrorMsg);
      // If Resend is also configured, try Resend before failing
      if (!resendKey) {
        return {
          ok: false,
          provider: 'smtp',
          message: smtpErrorMsg
        };
      }
    }
  }

  // 2. Resend API
  if (resendKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html
        })
      });

      const data = await resendRes.json();
      if (!resendRes.ok) {
        return {
          ok: false,
          provider: 'resend',
          message: data?.message || `Resend returned ${resendRes.status}`
        };
      }

      return {
        ok: true,
        provider: 'resend',
        message: `Delivered via Resend (ID: ${data.id})`
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: 'resend',
        message: err?.message || 'Network error reaching Resend API'
      };
    }
  }

  return {
    ok: false,
    provider: 'none',
    message: 'No email provider configured (set RESEND_API_KEY or SMTP_USER/SMTP_PASS)'
  };
}

/**
 * Execute a reminder cycle for a given slot ('13:00', '17:30', '22:00', or 'manual')
 */
async function runReminderCycle(options: {
  slot: string;
  slotLabel: string;
  targetUserId?: string;
  force?: boolean;
  overrideResendKey?: string;
}) {
  const todayIST = getKolkataDateString();
  const eligibleUsers = serverStore.getEligibleUsers().filter(u => {
    if (options.targetUserId && u.id !== options.targetUserId) return false;
    const settings = serverStore.getReminderSettings(u.id);
    if (!settings?.reminders_enabled) return false;
    if (options.slot !== 'manual' && settings.reminder_slots && !settings.reminder_slots.includes(options.slot as ReminderSlot)) {
      return false;
    }
    return true;
  });

  let sent = 0;
  let failed = 0;
  let skippedDuplicates = 0;
  const logs: StoredEmailLog[] = [];

  // Process in batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
    const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async u => {
        if (!options.force && options.slot !== 'manual') {
          if (serverStore.hasDeliveredSlotToday(u.id, todayIST, options.slot)) {
            skippedDuplicates++;
            return;
          }
        }

        const payload = serverStore.getUserEmailPayload(u.id, options.slotLabel);
        if (!payload) return;

        const dispatchRes = await dispatchEmail({
          to: u.email,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          overrideResendKey: options.overrideResendKey
        });

        const logEntry: StoredEmailLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          user_id: u.id,
          recipient_email: u.email,
          email_type: options.slot === 'manual' ? 'manual_reminder' : `scheduled_${options.slot}`,
          reminder_slot: options.slot,
          scheduled_date: todayIST,
          sent_at: new Date().toISOString(),
          delivery_status: dispatchRes.ok ? 'sent' : 'failed',
          provider: dispatchRes.provider,
          error_message: dispatchRes.message
        };

        serverStore.addEmailLog(logEntry);
        logs.push(logEntry);

        if (dispatchRes.ok) {
          sent++;
        } else {
          failed++;
        }
      })
    );
  }

  return {
    processed: eligibleUsers.length,
    sent,
    failed,
    skippedDuplicates,
    slot: options.slot,
    slotLabel: options.slotLabel,
    scheduledDate: todayIST,
    logs
  };
}

// =====================================================================
// Background 3x-Daily IST Scheduler (1:00 PM, 5:30 PM, 10:00 PM IST)
// =====================================================================
let isSchedulerTickRunning = false;

// Optional one-shot test slot (can be set via /api/reminders/schedule-next-minute for live testing)
let oneTimeTestSlot: { dateStr: string; slot: string; label: string } | null = null;

function startDailyReminderScheduler() {
  const checkAndDispatch = async () => {
    if (isSchedulerTickRunning) return;
    isSchedulerTickRunning = true;

    try {
      const { dateStr, hours, minutes } = getKolkataTimeParts();
      const nowTotalMinutes = hours * 60 + minutes;

      const slotsToCheck: { slot: string; label: string; isTest?: boolean }[] = [...REMINDER_SLOTS];
      if (oneTimeTestSlot && oneTimeTestSlot.dateStr === dateStr) {
        slotsToCheck.push({ slot: oneTimeTestSlot.slot, label: oneTimeTestSlot.label, isTest: true });
      }

      for (const slotDef of slotsToCheck) {
        const [sh, sm] = slotDef.slot.split(':').map(Number);
        const slotTotalMinutes = sh * 60 + sm;

        // Trigger within a 5-minute window starting at the exact slot minute (deduplicated per user/date/slot)
        if (nowTotalMinutes >= slotTotalMinutes && nowTotalMinutes <= slotTotalMinutes + 5) {
          const eligible = serverStore.getEligibleUsers().filter(u => {
            if (slotDef.isTest) return true;
            const settings = serverStore.getReminderSettings(u.id);
            return !settings?.reminder_slots || settings.reminder_slots.includes(slotDef.slot as ReminderSlot);
          });

          const needsDispatch = eligible.some(
            u => !serverStore.hasDeliveredSlotToday(u.id, dateStr, slotDef.slot)
          );

          if (needsDispatch) {
            console.log(`[Scheduler] Auto-triggering ${slotDef.label} (${slotDef.slot}) reminder cycle for ${dateStr}...`);
            const res = await runReminderCycle({
              slot: slotDef.isTest ? 'manual' : slotDef.slot,
              slotLabel: slotDef.label,
              force: Boolean(slotDef.isTest)
            });
            console.log(
              `[Scheduler] ${slotDef.label} completed: processed=${res.processed}, sent=${res.sent}, failed=${res.failed}, skipped=${res.skippedDuplicates}`
            );
            if (slotDef.isTest) {
              oneTimeTestSlot = null;
            }
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error in reminder tick:', err);
    } finally {
      isSchedulerTickRunning = false;
    }
  };

  // Check every 10 seconds for high-precision slot firing
  setInterval(checkAndDispatch, 10_000);
  // Also run once 5 seconds after boot
  setTimeout(checkAndDispatch, 5_000);
}

// =====================================================================
// REST API Routes
// =====================================================================

app.get('/api/health', (req, res) => {
  const kolkataTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  res.json({
    status: 'healthy',
    platform: 'CodeOrbit DSA Platform',
    kolkataTime,
    scheduler: 'Active (Daily at 1:00 PM, 5:30 PM & 10:00 PM IST)',
    slots: REMINDER_SLOTS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reminders/status', (req, res) => {
  const { dateStr, hhmm } = getKolkataTimeParts();
  const mailCfg = serverStore.getMailConfig();
  const smtpConfigured = Boolean((mailCfg.smtpUser || process.env.SMTP_USER) && (mailCfg.smtpPass || process.env.SMTP_PASS));
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const resendCustomDomain = Boolean(mailCfg.resendFromEmail || process.env.RESEND_FROM_EMAIL);

  res.json({
    schedulerConfigured: true,
    timezone: 'Asia/Kolkata',
    currentKolkataDate: dateStr,
    currentKolkataTime: hhmm,
    slots: REMINDER_SLOTS,
    cronExpressions: ['0 7:30 * * * (13:00 IST)', '0 12 * * * (17:30 IST)', '30 16 * * * (22:00 IST)'],
    providers: {
      smtpConfigured,
      smtpUser: mailCfg.smtpUser || process.env.SMTP_USER || '',
      resendConfigured,
      resendCustomDomain,
      resendFromEmail: mailCfg.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'CodeOrbit <onboarding@resend.dev>'
    }
  });
});

app.get('/api/bootstrap', (req, res) => {
  res.json({
    users: serverStore.getAllUsers()
  });
});

async function sendWelcomeEmailIfFirstStart(userId: string) {
  try {
    if (serverStore.hasReceivedWelcomeEmail(userId)) {
      return null;
    }
    const payload = serverStore.getWelcomeEmailPayload(userId);
    if (!payload) return null;

    // Skip synthetic demo @codeorbit.dev addresses so SMTP never bounces
    if (payload.user.email.toLowerCase().endsWith('@codeorbit.dev')) {
      return null;
    }

    const dispatchRes = await dispatchEmail({
      to: payload.user.email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    });

    const logEntry: StoredEmailLog = {
      id: `log-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: payload.user.id,
      recipient_email: payload.user.email,
      email_type: 'welcome_journey',
      reminder_slot: 'welcome',
      scheduled_date: getKolkataDateString(),
      sent_at: new Date().toISOString(),
      delivery_status: dispatchRes.ok ? 'sent' : 'failed',
      provider: dispatchRes.provider,
      error_message: dispatchRes.message
    };

    serverStore.addEmailLog(logEntry);
    return logEntry;
  } catch (err) {
    console.error('[WelcomeEmail] Failed to send welcome email:', err);
    return null;
  }
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    const user = serverStore.registerUser(fullName, email, password);
    const welcomeLog = await sendWelcomeEmailIfFirstStart(user.id);
    const state = serverStore.getUserFullState(user.id);
    res.json({ success: true, user, state, users: serverStore.getAllUsers(), welcomeEmailSent: welcomeLog?.delivery_status === 'sent' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = serverStore.loginUser(email, password);
    const welcomeLog = await sendWelcomeEmailIfFirstStart(user.id);
    const state = serverStore.getUserFullState(user.id);
    res.json({ success: true, user, state, users: serverStore.getAllUsers(), welcomeEmailSent: welcomeLog?.delivery_status === 'sent' });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/sync', async (req, res) => {
  try {
    const { id, email, full_name, role } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const user = serverStore.syncExternalUser({ id, email, full_name, role });
    const welcomeLog = await sendWelcomeEmailIfFirstStart(user.id);
    const state = serverStore.getUserFullState(user.id);
    res.json({ success: true, user, state, users: serverStore.getAllUsers(), welcomeEmailSent: welcomeLog?.delivery_status === 'sent' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:userId/state', (req, res) => {
  const state = serverStore.getUserFullState(req.params.userId);
  if (!state) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, state });
});

app.post('/api/users/:userId/profile', (req, res) => {
  try {
    const updated = serverStore.updateProfile(req.params.userId, req.body || {});
    const state = serverStore.getUserFullState(req.params.userId);
    res.json({ success: true, user: updated, state });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/reminders/schedule-next-minute', (req, res) => {
  const { dateStr, hours, minutes } = getKolkataTimeParts();
  const nextTotal = (hours * 60 + minutes + 1) % (24 * 60);
  const nh = String(Math.floor(nextTotal / 60)).padStart(2, '0');
  const nm = String(nextTotal % 60).padStart(2, '0');
  const nextSlot = `${nh}:${nm}`;
  oneTimeTestSlot = {
    dateStr,
    slot: nextSlot,
    label: `Scheduled Test (${nextSlot} IST)`
  };
  res.json({ success: true, scheduledFor: oneTimeTestSlot, currentKolkataTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` });
});

app.post('/api/users/:userId/toggle-question', (req, res) => {
  try {
    const { questionId } = req.body || {};
    if (!questionId) {
      return res.status(400).json({ success: false, error: 'questionId is required' });
    }
    const result = serverStore.toggleQuestionSolved(req.params.userId, questionId);
    const state = serverStore.getUserFullState(req.params.userId);
    res.json({ success: true, ...result, state });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/users/:userId/next-batch', (req, res) => {
  try {
    serverStore.reconcileDailyAssignments(req.params.userId, true);
    const state = serverStore.getUserFullState(req.params.userId);
    res.json({ success: true, state });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/users/:userId/reminders', (req, res) => {
  try {
    const updated = serverStore.updateReminderSettings(req.params.userId, req.body || {});
    res.json({ success: true, reminderSettings: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/overview', (req, res) => {
  const stats = serverStore.getAdminStats();
  const logs = serverStore.getEmailLogs();
  const users = serverStore.getAllUsers().map(u => ({
    ...u,
    reminderSettings: serverStore.getReminderSettings(u.id)
  }));
  const mailCfg = serverStore.getMailConfig();
  const smtpConfigured = Boolean((mailCfg.smtpUser || process.env.SMTP_USER) && (mailCfg.smtpPass || process.env.SMTP_PASS));
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const resendCustomDomain = Boolean(mailCfg.resendFromEmail || process.env.RESEND_FROM_EMAIL);

  res.json({
    success: true,
    stats,
    logs,
    users,
    mailProviderStatus: {
      smtpConfigured,
      smtpUser: mailCfg.smtpUser || process.env.SMTP_USER || '',
      smtpHost: mailCfg.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      resendConfigured,
      resendCustomDomain,
      resendFromEmail: mailCfg.resendFromEmail || process.env.RESEND_FROM_EMAIL || ''
    }
  });
});

app.post('/api/admin/mail-config', (req, res) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, resendFromEmail } = req.body || {};
  const updated = serverStore.updateMailConfig({
    ...(smtpHost !== undefined ? { smtpHost } : {}),
    ...(smtpPort !== undefined ? { smtpPort: Number(smtpPort) } : {}),
    ...(smtpUser !== undefined ? { smtpUser } : {}),
    ...(smtpPass !== undefined && smtpPass !== '' ? { smtpPass } : {}),
    ...(resendFromEmail !== undefined ? { resendFromEmail } : {})
  });
  res.json({
    success: true,
    mailProviderStatus: {
      smtpConfigured: Boolean((updated.smtpUser || process.env.SMTP_USER) && (updated.smtpPass || process.env.SMTP_PASS)),
      smtpUser: updated.smtpUser || process.env.SMTP_USER || '',
      smtpHost: updated.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      resendCustomDomain: Boolean(updated.resendFromEmail || process.env.RESEND_FROM_EMAIL),
      resendFromEmail: updated.resendFromEmail || process.env.RESEND_FROM_EMAIL || ''
    }
  });
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, apiKey } = req.body || {};
  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'Missing to or subject' });
  }
  const result = await dispatchEmail({
    to,
    subject,
    text: text || '',
    html,
    overrideResendKey: apiKey
  });
  if (!result.ok) {
    return res.status(400).json({ success: false, error: result.message, provider: result.provider });
  }
  return res.json({ success: true, message: result.message, provider: result.provider });
});

app.post('/api/reminders/trigger', async (req, res) => {
  try {
    const { slot = 'manual', targetUserId, force = true, resendApiKey } = req.body || {};
    const foundSlot = REMINDER_SLOTS.find(s => s.slot === slot);
    const slotLabel = foundSlot ? foundSlot.label : 'Instant Check-In';

    const result = await runReminderCycle({
      slot,
      slotLabel,
      targetUserId,
      force,
      overrideResendKey: resendApiKey
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reminders/retry/:logId', async (req, res) => {
  try {
    const logs = serverStore.getEmailLogs();
    const targetLog = logs.find(l => l.id === req.params.logId);
    if (!targetLog) {
      return res.status(404).json({ success: false, error: 'Email log not found' });
    }
    const foundSlot = REMINDER_SLOTS.find(s => s.slot === targetLog.reminder_slot);
    const result = await runReminderCycle({
      slot: targetLog.reminder_slot || 'manual',
      slotLabel: foundSlot ? foundSlot.label : 'Retry Dispatch',
      targetUserId: targetLog.user_id,
      force: true
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Production or Vite development integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    });

    // Prevent Vite client from attempting wss://:24678 HMR connections inside AI Studio's proxy
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
    data: {}
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay {}
`);
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeOrbit server running on http://0.0.0.0:${PORT}`);
    console.log('Automated Reminder Scheduler: Active for 1:00 PM, 5:30 PM & 10:00 PM IST (Asia/Kolkata)');
    startDailyReminderScheduler();
  });
}

startServer();
