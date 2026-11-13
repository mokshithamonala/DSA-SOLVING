-- ====================================================================
-- CodeOrbit: Multi-User DSA Practice Platform Database Migration
-- Fully normalized PostgreSQL schema with RLS, Triggers, & Indexes
-- ====================================================================

-- 1. Create Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    phase TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Create Questions Table (400+ Verified LeetCode Easy Questions)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    leetcode_id INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_slug TEXT NOT NULL,
    problem_url TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Easy' CHECK (difficulty = 'Easy'),
    is_premium BOOLEAN NOT NULL DEFAULT false,
    source TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Question-Topics Junction Table
CREATE TABLE IF NOT EXISTS public.question_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    UNIQUE (question_id, topic_id)
);

-- 5. Create User Topic Progress Table
CREATE TABLE IF NOT EXISTS public.user_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
    total_questions INT NOT NULL DEFAULT 0,
    solved_questions INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, topic_id)
);

-- 6. Create User Question Progress Table (Manual Solved Tracker)
CREATE TABLE IF NOT EXISTS public.user_question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    is_solved BOOLEAN NOT NULL DEFAULT false,
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, question_id)
);

-- 7. Create Daily Assignments Table (Daily 5 Questions + Pending Carry-Forward)
CREATE TABLE IF NOT EXISTS public.daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    original_date DATE,
    assignment_type TEXT NOT NULL DEFAULT 'new' CHECK (assignment_type IN ('new', 'carried_forward')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, question_id, assignment_date)
);

-- 8. Create Streaks Table (Calculated in Asia/Kolkata)
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Create Reminder Settings Table (Automated for ALL Registered Users)
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    reminder_time TEXT NOT NULL DEFAULT '13:00, 17:30, 22:00',
    reminder_slots TEXT[] NOT NULL DEFAULT ARRAY['13:00', '17:30', '22:00'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Create Email Logs Table (Duplicate Prevention & Audit)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL DEFAULT 'daily_reminder',
    reminder_slot TEXT NOT NULL DEFAULT '22:00',
    scheduled_date DATE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    CONSTRAINT unique_daily_delivery UNIQUE (user_id, scheduled_date, reminder_slot)
);

-- 11. Create Import Logs Table (Question Dataset Auditing)
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    imported_count INT NOT NULL DEFAULT 0,
    verified_easy_count INT NOT NULL DEFAULT 0,
    duplicate_count INT NOT NULL DEFAULT 0,
    invalid_count INT NOT NULL DEFAULT 0,
    excluded_medium_count INT NOT NULL DEFAULT 0,
    excluded_hard_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- Indexes for High Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_questions_leetcode_id ON public.questions(leetcode_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON public.question_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_q_prog_user_solved ON public.user_question_progress(user_id, is_solved);
CREATE INDEX IF NOT EXISTS idx_daily_assign_user_date ON public.daily_assignments(user_id, assignment_date, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_date ON public.email_logs(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminder_eligible ON public.reminder_settings(reminders_enabled);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Questions & Topics: Read-only for authenticated, full management for admin
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public Read Topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public Read Question Topics" ON public.question_topics FOR SELECT USING (true);

-- Profiles: Users can read and update their own profile; admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User Progress, Assignments, Streaks, Reminder Settings: STRICT USER ISOLATION
CREATE POLICY "User owns question progress select" ON public.user_question_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User owns question progress insert" ON public.user_question_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User owns question progress update" ON public.user_question_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User owns topic progress select" ON public.user_topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User owns topic progress insert" ON public.user_topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User owns topic progress update" ON public.user_topic_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User owns daily assignments select" ON public.daily_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User owns daily assignments insert" ON public.daily_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User owns daily assignments update" ON public.daily_assignments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User owns streaks select" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User owns streaks insert" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User owns streaks update" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User owns reminder settings select" ON public.reminder_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User owns reminder settings update" ON public.reminder_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User owns email logs select" ON public.email_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view email logs" ON public.email_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view import logs" ON public.import_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ====================================================================
-- Automatic Account Initialization Trigger
-- Runs on every auth.users INSERT to guarantee zero-friction onboarding
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'user'
    );

    -- 2. Create Reminder Settings (Defaults: enabled, 1:00 PM / 5:30 PM / 10:00 PM IST)
    INSERT INTO public.reminder_settings (user_id, email, reminders_enabled, timezone, reminder_time, reminder_slots)
    VALUES (NEW.id, NEW.email, true, 'Asia/Kolkata', '13:00, 17:30, 22:00', ARRAY['13:00', '17:30', '22:00']);

    -- 3. Initialize Streaks
    INSERT INTO public.streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0);

    -- 4. Initialize First Topic ("Arrays" as Active)
    INSERT INTO public.user_topic_progress (user_id, topic_id, status, unlocked_at)
    VALUES (NEW.id, 'arrays', 'active', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, then attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
