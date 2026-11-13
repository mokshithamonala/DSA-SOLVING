import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QUESTIONS_DATA, VERIFIED_QUESTIONS_STATS, Question } from '../src/data/questionsData';
import { TOPICS_DATA, Topic } from '../src/data/topicsData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'codeorbit-db.json');

export type ReminderSlot = '13:00' | '17:30' | '22:00';

export const REMINDER_SLOTS: { slot: ReminderSlot; label: string; shortLabel: string }[] = [
  { slot: '13:00', label: '1:00 PM IST', shortLabel: '1:00 PM' },
  { slot: '17:30', label: '5:30 PM IST', shortLabel: '5:30 PM' },
  { slot: '22:00', label: '10:00 PM IST', shortLabel: '10:00 PM' }
];

export interface StoredUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  passwordHash: string;
}

export interface StoredTopicProgress {
  topic_id: string;
  status: 'locked' | 'active' | 'completed';
  total_questions: number;
  solved_questions: number;
  unlocked_at?: string;
  completed_at?: string;
}

export interface StoredDailyAssignment {
  id: string;
  user_id: string;
  question_id: string;
  assignment_date: string; // YYYY-MM-DD in Asia/Kolkata
  original_date?: string;  // Preserved original date if carried forward
  assignment_type: 'new' | 'carried_forward';
  status: 'pending' | 'completed';
  completed_at?: string;
}

export interface StoredStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  updated_at?: string;
}

export interface StoredReminderSettings {
  user_id: string;
  email: string;
  reminders_enabled: boolean;
  timezone: string;
  reminder_time: string; // '13:00, 17:30, 22:00'
  reminder_slots: ReminderSlot[];
  updated_at: string;
}

export interface StoredEmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  email_type: string; // 'daily_reminder'
  reminder_slot: string; // '13:00' | '17:30' | '22:00' | 'manual'
  scheduled_date: string; // YYYY-MM-DD
  sent_at: string;
  delivery_status: 'sent' | 'failed' | 'pending';
  provider?: string;
  error_message?: string;
}

export interface MailConfig {
  resendFromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  solvedMap: Record<string, Record<string, { is_solved: boolean; solved_at: string }>>;
  topicProgressMap: Record<string, Record<string, StoredTopicProgress>>;
  dailyAssignmentsMap: Record<string, StoredDailyAssignment[]>;
  streaksMap: Record<string, StoredStreak>;
  reminderSettingsMap: Record<string, StoredReminderSettings>;
  emailLogs: StoredEmailLog[];
  mailConfig: MailConfig;
}

export function getKolkataDateString(offsetDays: number = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function getKolkataTimeParts(): { dateStr: string; hours: number; minutes: number; hhmm: string } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(now);

  const [hStr, mStr] = timeParts.split(':');
  const hours = parseInt(hStr, 10) % 24;
  const minutes = parseInt(mStr, 10);
  return {
    dateStr,
    hours,
    minutes,
    hhmm: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  };
}

const SEED_USERS: StoredUser[] = [
  {
    id: 'user-sai-001',
    full_name: 'Sai Mokshitha',
    email: 'saimokshitha478@gmail.com',
    role: 'user',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Sai%20Mokshitha',
    created_at: '2026-11-01T00:00:00.000Z',
    passwordHash: 'password123'
  },
  {
    id: 'user-alex-002',
    full_name: 'Alex Chen',
    email: 'alex@codeorbit.dev',
    role: 'user',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Chen',
    created_at: '2026-11-05T00:00:00.000Z',
    passwordHash: 'password123'
  },
  {
    id: 'user-maya-003',
    full_name: 'Maya Patel',
    email: 'maya@codeorbit.dev',
    role: 'user',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Maya%20Patel',
    created_at: '2026-11-08T00:00:00.000Z',
    passwordHash: 'password123'
  },
  {
    id: 'user-admin-004',
    full_name: 'Platform Administrator',
    email: 'admin@codeorbit.dev',
    role: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
    created_at: '2026-11-01T00:00:00.000Z',
    passwordHash: 'password123'
  }
];

class ServerStore {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
    this.ensureAllUsersInitialized();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        return {
          users: parsed.users || [...SEED_USERS],
          solvedMap: parsed.solvedMap || {},
          topicProgressMap: parsed.topicProgressMap || {},
          dailyAssignmentsMap: parsed.dailyAssignmentsMap || {},
          streaksMap: parsed.streaksMap || {},
          reminderSettingsMap: parsed.reminderSettingsMap || {},
          emailLogs: parsed.emailLogs || [],
          mailConfig: parsed.mailConfig || {}
        };
      }
    } catch (err) {
      console.error('Error loading CodeOrbit server DB, initializing fresh DB:', err);
    }

    return {
      users: [...SEED_USERS],
      solvedMap: {},
      topicProgressMap: {},
      dailyAssignmentsMap: {},
      streaksMap: {},
      reminderSettingsMap: {},
      emailLogs: [],
      mailConfig: {}
    };
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist server DB:', err);
    }
  }

  private ensureAllUsersInitialized() {
    for (const seed of SEED_USERS) {
      if (!this.db.users.some(u => u.email.toLowerCase() === seed.email.toLowerCase())) {
        this.db.users.push(seed);
      }
    }
    for (const u of this.db.users) {
      this.ensureUserInitialized(u.id, u.email);
    }
    this.save();
  }

  public getQuestionsForTopic(topicId: string): Question[] {
    const topic = TOPICS_DATA.find(t => t.id === topicId || t.slug === topicId);
    if (!topic) return [];
    const tSlug = topic.slug.toLowerCase();
    const tName = topic.name.toLowerCase();

    return QUESTIONS_DATA.filter(q => {
      const matchId = q.topic_ids?.some(id => id.toLowerCase() === tSlug || id.toLowerCase() === topic.id);
      const matchName = q.topics?.some(t => t.toLowerCase() === tName || t.toLowerCase() === tSlug);
      return matchId || matchName;
    });
  }

  public ensureUserInitialized(userId: string, email: string) {
    let changed = false;

    if (!this.db.streaksMap[userId]) {
      this.db.streaksMap[userId] = {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: undefined
      };
      changed = true;
    }

    const isSyntheticDemo = email.toLowerCase().endsWith('@codeorbit.dev');
    const existingReminder = this.db.reminderSettingsMap[userId];
    if (!existingReminder) {
      this.db.reminderSettingsMap[userId] = {
        user_id: userId,
        email,
        reminders_enabled: !isSyntheticDemo,
        timezone: 'Asia/Kolkata',
        reminder_time: '13:00, 17:30, 22:00',
        reminder_slots: ['13:00', '17:30', '22:00'],
        updated_at: new Date().toISOString()
      };
      changed = true;
    } else {
      // Upgrade legacy single-slot reminder settings to the 3 daily slots
      if (!existingReminder.reminder_slots || existingReminder.reminder_slots.length < 3) {
        existingReminder.reminder_slots = ['13:00', '17:30', '22:00'];
        existingReminder.reminder_time = '13:00, 17:30, 22:00';
        existingReminder.timezone = 'Asia/Kolkata';
        changed = true;
      }
      if (existingReminder.email !== email && email) {
        existingReminder.email = email;
        changed = true;
      }
    }

    if (!this.db.solvedMap[userId]) {
      this.db.solvedMap[userId] = {};
      if (userId === 'user-alex-002') {
        this.db.solvedMap[userId]['q-1'] = { is_solved: true, solved_at: new Date().toISOString() };
        this.db.solvedMap[userId]['q-26'] = { is_solved: true, solved_at: new Date().toISOString() };
        this.db.solvedMap[userId]['q-27'] = { is_solved: true, solved_at: new Date().toISOString() };
      }
      changed = true;
    }

    if (!this.db.topicProgressMap[userId]) {
      this.db.topicProgressMap[userId] = {};
      TOPICS_DATA.forEach((topic, idx) => {
        const topicQuestions = this.getQuestionsForTopic(topic.id);
        const solvedCount = topicQuestions.filter(q => this.db.solvedMap[userId]?.[q.id]?.is_solved).length;
        this.db.topicProgressMap[userId][topic.id] = {
          topic_id: topic.id,
          status: idx === 0 ? 'active' : 'locked',
          total_questions: topicQuestions.length,
          solved_questions: solvedCount,
          unlocked_at: idx === 0 ? new Date().toISOString() : undefined
        };
      });
      changed = true;
    }

    if (!this.db.dailyAssignmentsMap[userId] || this.db.dailyAssignmentsMap[userId].length === 0) {
      this.reconcileDailyAssignments(userId);
      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  public getActiveTopic(userId: string): Topic {
    const progress = this.db.topicProgressMap[userId] || {};
    const activeEntry = Object.values(progress).find(p => p.status === 'active');
    if (activeEntry) {
      const topic = TOPICS_DATA.find(t => t.id === activeEntry.topic_id);
      if (topic) return topic;
    }
    return TOPICS_DATA[0];
  }

  /**
   * Reconcile daily assignments for today (Asia/Kolkata):
   * 1. Carry forward any pending questions from previous dates (preserving original_date).
   * 2. Drop completed questions from previous days (keeping today's completed questions visible for today).
   * 3. If active questions for today < 5, top up with new unsolved questions from active topic to reach 5!
   *    Example: Yesterday had 5 questions, user solved 3, forgot 2 -> Today gets 2 carried-forward + 3 new = 5!
   */
  public reconcileDailyAssignments(userId: string, forceNextBatch: boolean = false): StoredDailyAssignment[] {
    const today = getKolkataDateString();
    const existing = this.db.dailyAssignmentsMap[userId] || [];
    const solvedSet = this.db.solvedMap[userId] || {};

    // Sync status with solvedMap first
    for (const a of existing) {
      const isSolved = Boolean(solvedSet[a.question_id]?.is_solved);
      a.status = isSolved ? 'completed' : 'pending';
      if (isSolved && !a.completed_at) {
        a.completed_at = solvedSet[a.question_id].solved_at;
      }
    }

    // Keep:
    // - ALL pending questions (if from an earlier date, roll forward as 'carried_forward')
    // - Today's completed questions (unless user explicitly requested next batch after finishing all 5)
    const activeList: StoredDailyAssignment[] = [];

    for (const a of existing) {
      if (a.status === 'pending') {
        if (a.assignment_date < today) {
          activeList.push({
            ...a,
            original_date: a.original_date || a.assignment_date,
            assignment_date: today,
            assignment_type: 'carried_forward'
          });
        } else {
          activeList.push(a);
        }
      } else if (a.status === 'completed' && a.assignment_date === today && !forceNextBatch) {
        activeList.push(a);
      }
    }

    // Top up to 5 if activeList.length < 5
    const needed = Math.max(0, 5 - activeList.length);
    if (needed > 0) {
      const activeTopic = this.getActiveTopic(userId);
      const topicQuestions = this.getQuestionsForTopic(activeTopic.id);
      const alreadyAssignedIds = new Set(activeList.map(a => a.question_id));

      const candidates = topicQuestions.filter(
        q => !solvedSet[q.id]?.is_solved && !alreadyAssignedIds.has(q.id)
      );

      const additions = candidates.slice(0, needed);
      additions.forEach((q, idx) => {
        activeList.push({
          id: `assign-${userId}-${today}-${q.id}-${Date.now()}-${idx}`,
          user_id: userId,
          question_id: q.id,
          assignment_date: today,
          original_date: today,
          assignment_type: 'new',
          status: 'pending'
        });
      });
    }

    this.db.dailyAssignmentsMap[userId] = activeList;
    this.save();
    return activeList;
  }

  // --- Auth & User Management ---
  public sanitizeUser(u: StoredUser) {
    const { passwordHash, ...safe } = u;
    return safe;
  }

  public getAllUsers() {
    return this.db.users.map(u => this.sanitizeUser(u));
  }

  public getUserById(userId: string) {
    const u = this.db.users.find(x => x.id === userId);
    return u ? this.sanitizeUser(u) : null;
  }

  public registerUser(fullName: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    const existing = this.db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      full_name: fullName.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: 'user',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim() || normalizedEmail)}`,
      created_at: new Date().toISOString(),
      passwordHash: password
    };

    this.db.users.push(newUser);
    this.ensureUserInitialized(newUser.id, newUser.email);
    this.save();

    return this.sanitizeUser(newUser);
  }

  public loginUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    if (user.passwordHash !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    // Always ensure email is saved & reminders enabled when logging in
    this.ensureUserInitialized(user.id, user.email);
    this.reconcileDailyAssignments(user.id);
    this.save();

    return this.sanitizeUser(user);
  }

  /**
   * Upsert a user authenticated externally (e.g. Supabase Auth or client sync)
   * so that whoever logs in automatically gets their email saved & reminders enabled!
   */
  public syncExternalUser(profile: { id?: string; email: string; full_name?: string; role?: 'user' | 'admin' }) {
    const normalizedEmail = profile.email.trim().toLowerCase();
    let user = this.db.users.find(
      u => u.email.toLowerCase() === normalizedEmail || (profile.id && u.id === profile.id)
    );

    if (!user) {
      user = {
        id: profile.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        full_name: profile.full_name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: profile.role || 'user',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || normalizedEmail)}`,
        created_at: new Date().toISOString(),
        passwordHash: 'external-auth'
      };
      this.db.users.push(user);
    } else if (profile.full_name && user.full_name !== profile.full_name) {
      user.full_name = profile.full_name;
    }

    this.ensureUserInitialized(user.id, user.email);
    this.reconcileDailyAssignments(user.id);
    this.save();
    return this.sanitizeUser(user);
  }

  public updateProfile(userId: string, data: { full_name?: string; email?: string; avatar_url?: string }) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (data.full_name) user.full_name = data.full_name.trim();
    if (data.avatar_url) user.avatar_url = data.avatar_url;
    if (data.email) {
      const normalized = data.email.trim().toLowerCase();
      if (!normalized.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      const conflict = this.db.users.find(u => u.id !== userId && u.email.toLowerCase() === normalized);
      if (conflict) {
        throw new Error('Another account already uses this email address.');
      }
      user.email = normalized;
      if (this.db.reminderSettingsMap[userId]) {
        this.db.reminderSettingsMap[userId].email = normalized;
        this.db.reminderSettingsMap[userId].updated_at = new Date().toISOString();
      }
    }
    this.save();
    return this.sanitizeUser(user);
  }

  // --- User State & Progress ---
  public getUserFullState(userId: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return null;

    this.ensureUserInitialized(user.id, user.email);
    const assignments = this.reconcileDailyAssignments(user.id);
    const enrichedAssignments = assignments.map(a => ({
      ...a,
      question: QUESTIONS_DATA.find(q => q.id === a.question_id)
    }));

    return {
      user: this.sanitizeUser(user),
      solvedMap: this.db.solvedMap[userId] || {},
      topicProgress: this.db.topicProgressMap[userId] || {},
      dailyAssignments: enrichedAssignments,
      streak: this.db.streaksMap[userId],
      reminderSettings: this.db.reminderSettingsMap[userId],
      emailLogs: this.db.emailLogs.filter(l => l.user_id === userId)
    };
  }

  public toggleQuestionSolved(userId: string, questionId: string): { is_solved: boolean } {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const userSolved = this.db.solvedMap[userId] || (this.db.solvedMap[userId] = {});
    const currentlySolved = Boolean(userSolved[questionId]?.is_solved);
    const nowSolved = !currentlySolved;

    if (nowSolved) {
      userSolved[questionId] = {
        is_solved: true,
        solved_at: new Date().toISOString()
      };
      this.updateStreakOnSolve(userId);
    } else {
      delete userSolved[questionId];
    }

    const assignments = this.db.dailyAssignmentsMap[userId] || [];
    for (const a of assignments) {
      if (a.question_id === questionId) {
        a.status = nowSolved ? 'completed' : 'pending';
        a.completed_at = nowSolved ? new Date().toISOString() : undefined;
      }
    }

    this.recalculateTopicProgress(userId);
    this.save();
    return { is_solved: nowSolved };
  }

  private updateStreakOnSolve(userId: string) {
    const today = getKolkataDateString();
    const streak = this.db.streaksMap[userId] || {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0
    };

    if (streak.last_activity_date === today) {
      return;
    }

    const yesterday = getKolkataDateString(-1);
    if (streak.last_activity_date === yesterday) {
      streak.current_streak += 1;
    } else {
      streak.current_streak = 1;
    }

    if (streak.current_streak > streak.longest_streak) {
      streak.longest_streak = streak.current_streak;
    }

    streak.last_activity_date = today;
    streak.updated_at = new Date().toISOString();
    this.db.streaksMap[userId] = streak;
  }

  private recalculateTopicProgress(userId: string) {
    const userTopics = this.db.topicProgressMap[userId] || {};
    const solvedSet = this.db.solvedMap[userId] || {};
    let shouldUnlockNext = false;

    for (let i = 0; i < TOPICS_DATA.length; i++) {
      const topic = TOPICS_DATA[i];
      const questions = this.getQuestionsForTopic(topic.id);
      const solvedInTopic = questions.filter(q => solvedSet[q.id]?.is_solved).length;

      const currentProg = userTopics[topic.id] || {
        topic_id: topic.id,
        status: i === 0 ? 'active' : 'locked',
        total_questions: questions.length,
        solved_questions: 0
      };

      currentProg.total_questions = questions.length;
      currentProg.solved_questions = solvedInTopic;

      if (shouldUnlockNext && currentProg.status === 'locked') {
        currentProg.status = 'active';
        currentProg.unlocked_at = new Date().toISOString();
        shouldUnlockNext = false;
      }

      if (currentProg.status === 'active' && questions.length > 0 && solvedInTopic >= questions.length) {
        currentProg.status = 'completed';
        currentProg.completed_at = new Date().toISOString();
        shouldUnlockNext = true;
      }

      userTopics[topic.id] = currentProg;
    }

    this.db.topicProgressMap[userId] = userTopics;
  }

  public updateReminderSettings(userId: string, data: Partial<StoredReminderSettings>) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    this.ensureUserInitialized(userId, user.email);

    const current = this.db.reminderSettingsMap[userId];
    const updated: StoredReminderSettings = {
      ...current,
      ...data,
      updated_at: new Date().toISOString()
    };
    this.db.reminderSettingsMap[userId] = updated;
    this.save();
    return updated;
  }

  public getReminderSettings(userId: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (user) {
      this.ensureUserInitialized(userId, user.email);
    }
    return this.db.reminderSettingsMap[userId];
  }

  public getEmailLogs(userId?: string): StoredEmailLog[] {
    if (userId) {
      return this.db.emailLogs.filter(l => l.user_id === userId);
    }
    return this.db.emailLogs;
  }

  public hasDeliveredSlotToday(userId: string, dateStr: string, slot: string): boolean {
    return this.db.emailLogs.some(
      l =>
        l.user_id === userId &&
        l.scheduled_date === dateStr &&
        l.reminder_slot === slot &&
        (l.delivery_status === 'sent' ||
          (l.delivery_status === 'failed' && Date.now() - new Date(l.sent_at).getTime() < 6 * 60 * 1000))
    );
  }

  public hasReceivedWelcomeEmail(userId: string): boolean {
    return this.db.emailLogs.some(
      l =>
        l.user_id === userId &&
        (l.email_type === 'welcome_journey' || l.reminder_slot === 'welcome') &&
        l.delivery_status === 'sent'
    );
  }

  public addEmailLog(log: StoredEmailLog) {
    this.db.emailLogs.unshift(log);
    if (this.db.emailLogs.length > 500) {
      this.db.emailLogs = this.db.emailLogs.slice(0, 500);
    }
    this.save();
  }

  public getEligibleUsers() {
    return this.db.users.filter(u => {
      const settings = this.db.reminderSettingsMap[u.id];
      return settings?.reminders_enabled !== false;
    });
  }

  public getMailConfig(): MailConfig {
    return this.db.mailConfig || {};
  }

  public updateMailConfig(cfg: Partial<MailConfig>): MailConfig {
    this.db.mailConfig = {
      ...(this.db.mailConfig || {}),
      ...cfg
    };
    this.save();
    return this.db.mailConfig;
  }

  public getWelcomeEmailPayload(userId: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return null;

    const assignments = this.reconcileDailyAssignments(userId);
    const enriched = assignments.map(a => ({
      ...a,
      question: QUESTIONS_DATA.find(q => q.id === a.question_id)
    }));
    const activeTopic = this.getActiveTopic(userId);

    const rawAppUrl = (process.env.APP_URL || '').trim();
    const safeAppUrl =
      rawAppUrl && !rawAppUrl.includes('.run.app') && !rawAppUrl.includes('localhost') && !rawAppUrl.includes('127.0.0.1')
        ? rawAppUrl
        : '';

    const subject = 'Welcome to CodeOrbit - Your DSA Journey Starts Today';

    const questionsText = enriched
      .map((a, idx) => `${idx + 1}. ${a.question?.title || a.question_id}\n   ${a.question?.problem_url || ''}`)
      .join('\n\n');

    const text = `Hi ${user.full_name},

Welcome to CodeOrbit! You are starting your daily Data Structures and Algorithms journey with CodeOrbit, building problem-solving consistency one day at a time.

Your study plan:
- Starting Topic: ${activeTopic.name}
- Daily Target: 5 LeetCode Easy problems each day
- Carry-Forward Rule: Unfinished problems automatically carry forward to the next day and combine with new problems to make 5
- Daily Reminder Times: 1:00 PM, 5:30 PM, and 10:00 PM IST to ${user.email}

Today's Starting Problems (${enriched.length}):

${questionsText}

${safeAppUrl ? `Open CodeOrbit: ${safeAppUrl}/today\n` : 'Open CodeOrbit in your browser to mark solved problems and update your streak.\n'}
Best regards,
CodeOrbit`;

    const questionsHtml = enriched
      .map(
        (a, idx) =>
          `<p style="margin: 0 0 10px 0;"><strong>${idx + 1}. ${a.question?.title || a.question_id}</strong><br />${a.question?.problem_url || ''}</p>`
      )
      .join('');

    const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937;">
  <p style="margin: 0 0 12px 0;">Hi ${user.full_name},</p>
  <p style="margin: 0 0 12px 0;">Welcome to CodeOrbit! You are starting your daily Data Structures and Algorithms journey with CodeOrbit, building problem-solving consistency one day at a time.</p>
  <p style="margin: 0 0 12px 0;">
    <strong>Starting Topic:</strong> ${activeTopic.name}<br />
    <strong>Daily Goal:</strong> 5 LeetCode Easy problems per day<br />
    <strong>Carry-Forward:</strong> Unfinished problems carry forward tomorrow and combine with new ones<br />
    <strong>Daily Reminders:</strong> 1:00 PM, 5:30 PM &amp; 10:00 PM IST (${user.email})
  </p>
  <p style="margin: 0 0 8px 0;"><strong>Today's Starting Problems (${enriched.length}):</strong></p>
  ${questionsHtml}
  <p style="margin: 14px 0 0 0;">${safeAppUrl ? `Open CodeOrbit: ${safeAppUrl}/today` : 'Open CodeOrbit in your browser to mark solved problems and update your streak.'}</p>
  <p style="margin: 14px 0 0 0;">Best regards,<br />CodeOrbit</p>
</div>`;

    return { user, subject, text, html };
  }

  public getUserEmailPayload(userId: string, slotLabel: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return null;

    const assignments = this.reconcileDailyAssignments(userId);
    const enriched = assignments.map(a => ({
      ...a,
      question: QUESTIONS_DATA.find(q => q.id === a.question_id)
    }));

    const solvedMap = this.db.solvedMap[userId] || {};
    const totalSolved = Object.values(solvedMap).filter(v => v.is_solved).length;
    const totalAvailable = QUESTIONS_DATA.length;
    const completionPercentage = totalAvailable > 0 ? Math.round((totalSolved / totalAvailable) * 100) : 0;

    const streak = this.db.streaksMap[userId]?.current_streak || 0;
    const activeTopic = this.getActiveTopic(userId);

    const solvedToday = enriched.filter(a => a.status === 'completed').length;
    const pendingItems = enriched.filter(a => a.status === 'pending');
    const carriedForwardCount = pendingItems.filter(a => a.assignment_type === 'carried_forward').length;

    const rawAppUrl = (process.env.APP_URL || '').trim();
    const safeAppUrl =
      rawAppUrl && !rawAppUrl.includes('.run.app') && !rawAppUrl.includes('localhost') && !rawAppUrl.includes('127.0.0.1')
        ? rawAppUrl
        : '';

    const subject = `CodeOrbit ${slotLabel} Reminder: ${pendingItems.length > 0 ? `${pendingItems.length} Pending Problems` : 'Daily Goal Complete'} (${activeTopic.name})`;

    const questionsText = enriched
      .map((a, idx) => {
        const tag = a.status === 'completed'
          ? 'Solved'
          : a.assignment_type === 'carried_forward'
            ? `Pending (Carried Forward from ${a.original_date || 'previous day'})`
            : 'Pending';
        return `${idx + 1}. ${a.question?.title || a.question_id} [${tag}]\n   ${a.question?.problem_url || ''}`;
      })
      .join('\n\n');

    const text = `Hi ${user.full_name},

Here is your CodeOrbit ${slotLabel} DSA practice reminder for ${activeTopic.name}.

Today's Coding Questions (${enriched.length} total, ${carriedForwardCount} carried forward):

${questionsText}

Your Progress:
- Completed today: ${solvedToday} / ${enriched.length}
- Pending remaining: ${pendingItems.length}
- Current streak: ${streak} days
- Overall progress: ${completionPercentage}% (${totalSolved} / ${totalAvailable} Easy solved)

Unfinished problems automatically carry forward tomorrow and combine with new problems to make 5.
${safeAppUrl ? `\nOpen CodeOrbit: ${safeAppUrl}/today\n` : '\nOpen CodeOrbit in your browser to mark solved problems and keep your streak going.\n'}
Best regards,
CodeOrbit`;

    const questionsHtml = enriched
      .map((a, idx) => {
        const isDone = a.status === 'completed';
        const isCarried = a.assignment_type === 'carried_forward';
        const badgeLabel = isDone
          ? 'Solved'
          : isCarried
            ? `Pending - Carried Forward (${a.original_date || 'prev'})`
            : 'Pending';
        const statusColor = isDone ? '#047857' : '#b45309';
        return `<p style="margin: 0 0 10px 0;"><strong>${idx + 1}. ${a.question?.title || a.question_id}</strong> <span style="color: ${statusColor}; font-size: 12px;">[${badgeLabel}]</span><br />${a.question?.problem_url || ''}</p>`;
      })
      .join('');

    const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937;">
  <p style="margin: 0 0 12px 0;">Hi ${user.full_name},</p>
  <p style="margin: 0 0 12px 0;">Here is your <strong>${slotLabel}</strong> CodeOrbit practice reminder for <strong>${activeTopic.name}</strong>.</p>
  ${questionsHtml}
  <p style="margin: 12px 0;">
    <strong>Completed today:</strong> ${solvedToday} / ${enriched.length}<br />
    <strong>Pending remaining:</strong> ${pendingItems.length} (${carriedForwardCount} carried forward)<br />
    <strong>Current streak:</strong> ${streak} days<br />
    <strong>Overall progress:</strong> ${completionPercentage}% (${totalSolved}/${totalAvailable} Easy solved)
  </p>
  <p style="margin: 0 0 12px 0;">Unfinished problems automatically carry forward tomorrow and combine with new problems to make 5.</p>
  <p style="margin: 0 0 12px 0;">${safeAppUrl ? `Open CodeOrbit: ${safeAppUrl}/today` : 'Open CodeOrbit in your browser to update your progress.'}</p>
  <p style="margin: 0; font-size: 12px; color: #6b7280;">Scheduled daily at 1:00 PM, 5:30 PM &amp; 10:00 PM IST for ${user.email}</p>
</div>`;

    return { user, subject, text, html };
  }

  public getAdminStats() {
    const totalUsers = this.db.users.length;
    const activeUsers = this.db.users.filter(u => {
      const s = this.db.streaksMap[u.id];
      return Boolean(s && s.last_activity_date);
    }).length;

    const logs = this.db.emailLogs;
    const sentCount = logs.filter(l => l.delivery_status === 'sent').length;
    const failedCount = logs.filter(l => l.delivery_status === 'failed').length;
    const eligibleCount = this.getEligibleUsers().length;

    return {
      totalUsers,
      verifiedUsers: totalUsers,
      activeUsers,
      totalQuestions: QUESTIONS_DATA.length,
      verifiedStats: VERIFIED_QUESTIONS_STATS,
      emailStats: {
        totalEligible: eligibleCount,
        sentCount,
        failedCount,
        successRate: sentCount + failedCount > 0 ? Math.round((sentCount / (sentCount + failedCount)) * 100) : 100,
        lastExecution: logs[0]?.sent_at || 'Scheduled 1:00 PM, 5:30 PM, 10:00 PM IST'
      }
    };
  }
}

export const serverStore = new ServerStore();
