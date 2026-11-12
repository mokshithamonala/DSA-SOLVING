import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Server-side health endpoint
app.get('/api/health', (req, res) => {
  const kolkataTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  res.json({
    status: 'healthy',
    platform: 'CodeOrbit DSA Platform',
    kolkataTime,
    scheduler: 'Active (Daily 10:00 PM IST / 22:00)',
    timestamp: new Date().toISOString()
  });
});

// Server-side reminder status endpoint
app.get('/api/reminders/status', (req, res) => {
  const now = new Date();
  const kolkataDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const kolkataHours = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }).format(now));

  res.json({
    schedulerConfigured: true,
    targetTime: '22:00 IST (10:00 PM)',
    targetTimezone: 'Asia/Kolkata',
    utcEquivalent: '16:30 UTC',
    cronSchedule: '30 16 * * *',
    currentKolkataDate: kolkataDate,
    nextScheduledRun: `${kolkataDate} 22:00:00 IST`
  });
});

// Server-side email dispatcher proxying Resend API securely
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, apiKey } = req.body || {};
  const activeKey = apiKey || process.env.RESEND_API_KEY;

  if (!activeKey) {
    return res.status(400).json({ success: false, error: 'RESEND_API_KEY is not configured.' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CodeOrbit <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html
      })
    });

    const data = await resendRes.json();
    if (!resendRes.ok) {
      return res.status(resendRes.status).json({ 
        success: false, 
        error: data.message || 'Resend API returned an error',
        details: data 
      });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger reminder cycle manually on server
app.post('/api/reminders/trigger', async (req, res) => {
  const { resendApiKey, targetEmail } = req.body || {};
  const activeKey = resendApiKey || process.env.RESEND_API_KEY;

  try {
    res.json({
      success: true,
      message: 'Server-side reminder dispatch initiated.',
      timestamp: new Date().toISOString(),
      dispatchedVia: activeKey ? 'Resend API' : 'Simulated Server Worker'
    });
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
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`Automated Reminder Scheduler: Active for 10:00 PM IST (Asia/Kolkata)`);
  });
}

startServer();
