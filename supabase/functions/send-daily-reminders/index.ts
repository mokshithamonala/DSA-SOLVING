// Supabase Edge Function: send-daily-reminders
// Triggered daily at 1:00 PM IST (07:30 UTC), 5:30 PM IST (12:00 UTC), and 10:00 PM IST (16:30 UTC)
// Sends personalized daily coding challenges to EVERY registered & verified user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "CodeOrbit <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SLOT_LABELS: Record<string, string> = {
  "13:00": "1:00 PM IST",
  "17:30": "5:30 PM IST",
  "22:00": "10:00 PM IST",
  "manual": "Instant Check-In",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const slot = body.slot || "22:00";
    const slotLabel = SLOT_LABELS[slot] || "Scheduled Check-In";

    const scheduledDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // 1. Fetch all eligible registered users with reminders_enabled = true
    const { data: reminderUsers, error: usersErr } = await supabase
      .from("reminder_settings")
      .select(`
        user_id,
        email,
        reminders_enabled,
        timezone,
        reminder_slots,
        profiles (
          full_name,
          email
        ),
        streaks (
          current_streak,
          longest_streak
        )
      `)
      .eq("reminders_enabled", true);

    if (usersErr) throw usersErr;

    const results = [];
    const BATCH_SIZE = 25;
    const users = reminderUsers || [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (u: any) => {
          const userId = u.user_id;
          const userEmail = u.email || u.profiles?.email;
          const userName = u.profiles?.full_name || "CodeOrbit Developer";
          const currentStreak = u.streaks?.current_streak || 0;

          if (slot !== "manual" && Array.isArray(u.reminder_slots) && !u.reminder_slots.includes(slot)) {
            return;
          }

          // 2. Check if already delivered for this slot today to prevent duplicate emails
          if (slot !== "manual") {
            const { data: existingLog } = await supabase
              .from("email_logs")
              .select("id")
              .eq("user_id", userId)
              .eq("scheduled_date", scheduledDateStr)
              .eq("reminder_slot", slot)
              .eq("delivery_status", "sent")
              .maybeSingle();

            if (existingLog) {
              results.push({ userId, email: userEmail, slot, status: "skipped_duplicate" });
              return;
            }
          }

          // 3. Fetch user's active topic
          const { data: activeTopicProgress } = await supabase
            .from("user_topic_progress")
            .select("topic_id, topics(name)")
            .eq("user_id", userId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          const activeTopicName = (activeTopicProgress as any)?.topics?.name || "Arrays";

          // 4. Fetch daily assignments for today (carried forward + new up to 5)
          const { data: assignments } = await supabase
            .from("daily_assignments")
            .select(`
              id,
              status,
              assignment_type,
              original_date,
              questions (
                id,
                leetcode_id,
                title,
                problem_url,
                difficulty,
                is_premium
              )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

          const dailyQuestions = assignments || [];
          const solvedToday = dailyQuestions.filter((q: any) => q.status === "completed").length;
          const pendingQuestions = dailyQuestions.filter((q: any) => q.status === "pending");

          // 5. Build HTML email
          const questionsListHtml = dailyQuestions
            .map((item: any, idx: number) => {
              const q = item.questions;
              const statusBadge = item.status === "completed"
                ? "<span style='color: #10b981; font-weight: 600;'>[Solved]</span>"
                : item.assignment_type === "carried_forward"
                  ? `<span style='color: #f59e0b; font-weight: 600;'>[Carried Forward ${item.original_date || ""}]</span>`
                  : "<span style='color: #f59e0b; font-weight: 600;'>[Pending]</span>";
              const premiumBadge = q.is_premium ? " <span style='color: #eab308; font-size: 11px;'>[LeetCode Premium]</span>" : "";
              return `
                <div style="margin-bottom: 12px; padding: 10px; background: #1e293b; border-radius: 6px; border: 1px solid #334155;">
                  <div style="font-weight: 600; color: #f8fafc;">${idx + 1}. ${q.title}${premiumBadge}</div>
                  <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                    LeetCode: <a href="${q.problem_url}" style="color: #60a5fa; text-decoration: underline;" target="_blank">${q.problem_url}</a>
                  </div>
                  <div style="font-size: 12px; margin-top: 4px;">Status: ${statusBadge}</div>
                </div>
              `;
            })
            .join("");

          const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
              <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
                <h1 style="color: #38bdf8; font-size: 22px; margin: 0;">CodeOrbit</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${slotLabel} Reminder · Daily Practice Check-In</p>
              </div>

              <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="color: #cbd5e1; line-height: 1.5;">Your personalized <strong>${slotLabel}</strong> CodeOrbit DSA practice reminder is here! Unfinished questions carry forward tomorrow and combine with new ones to make 5.</p>

              <div style="background: #1e293b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #334155;">
                <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Today's Topic</span>
                <div style="font-size: 18px; font-weight: 700; color: #38bdf8;">${activeTopicName}</div>
              </div>

              <h3 style="color: #f8fafc; margin-top: 24px;">Today's Coding Questions:</h3>
              ${questionsListHtml || "<p style='color: #94a3b8;'>Visit your dashboard to generate today's batch!</p>"}

              <div style="background: #1e293b; padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid #334155;">
                <h4 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 15px;">Your Progress Snapshot</h4>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  <li>Completed today: <strong>${solvedToday} / ${dailyQuestions.length}</strong></li>
                  <li>Pending questions: <strong>${pendingQuestions.length}</strong></li>
                  <li>Current streak: <strong>${currentStreak} days</strong></li>
                </ul>
              </div>

              <div style="margin-top: 24px; text-align: center;">
                <a href="${Deno.env.get("APP_URL") || "https://codeorbit.dev"}/today" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Open CodeOrbit & Update Progress</a>
              </div>

              <div style="margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
                Scheduled daily at 1:00 PM, 5:30 PM & 10:00 PM IST.<br/>
                Regards, <strong>CodeOrbit Team</strong>
              </div>
            </div>
          `;

          // 6. Send email via Resend API
          let deliveryStatus = "sent";
          let errorMessage: string | null = null;

          if (RESEND_API_KEY) {
            try {
              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: RESEND_FROM_EMAIL,
                  to: [userEmail],
                  subject: `CodeOrbit ${slotLabel} Reminder — ${pendingQuestions.length} Pending Problems`,
                  html: htmlContent,
                }),
              });

              if (!res.ok) {
                const errData = await res.json();
                deliveryStatus = "failed";
                errorMessage = JSON.stringify(errData);
              }
            } catch (err: any) {
              deliveryStatus = "failed";
              errorMessage = err.message;
            }
          } else {
            deliveryStatus = "failed";
            errorMessage = "RESEND_API_KEY not configured on Edge Function";
          }

          // 7. Record delivery status in email_logs
          await supabase.from("email_logs").insert({
            user_id: userId,
            recipient_email: userEmail,
            email_type: `scheduled_${slot}`,
            reminder_slot: slot,
            scheduled_date: scheduledDateStr,
            delivery_status: deliveryStatus,
            error_message: errorMessage,
            sent_at: new Date().toISOString(),
          });

          results.push({ userId, email: userEmail, slot, status: deliveryStatus, error: errorMessage });
        })
      );
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
