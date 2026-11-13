/**
 * CodeOrbit Relational Data Engine & Server-Synchronized State Store
 * Implements strict user isolation, 400+ verified question management,
 * daily 5-question assignments with carry-forward + top-up to 5, topic unlocking,
 * streak calculations in Asia/Kolkata, and automated 3x-daily IST reminder distribution.
 */

import { QUESTIONS_DATA, VERIFIED_QUESTIONS_STATS } from '../data/questionsData';
import { TOPICS_DATA } from '../data/topicsData';
import {
  UserProfile,
  Question,
  Topic,
  UserTopicProgress,
  DailyAssignment,
  UserStreak,
  ReminderSettings,
  EmailLog
} from '../types';

const STORAGE_KEYS = {
  USERS: 'codeorbit_users_v2',
  CURRENT_USER_ID: 'codeorbit_active_user_id_v2',
  SOLVED_MAP: 'codeorbit_solved_map_v2',
  TOPIC_PROGRESS: 'codeorbit_topic_progress_v2',
  DAILY_ASSIGNMENTS: 'codeorbit_daily_assignments_v2',
  STREAKS: 'codeorbit_streaks_v2',
  REMINDER_SETTINGS: 'codeorbit_reminders_v2',
  EMAIL_LOGS: 'codeorbit_email_logs_v2',
  RESEND_KEY: 'codeorbit_resend_api_key_v2'
};

export const DEFAULT_REMINDER_SLOTS = ['13:00', '17:30', '22:00'] as const;

export const REMINDER_SLOT_META = [
  { slot: '13:00', label: '1:00 PM IST', shortLabel: '1:00 PM' },
  { slot: '17:30', label: '5:30 PM IST', shortLabel: '5:30 PM' },
  { slot: '22:00', label: '10:00 PM IST', shortLabel: '10:00 PM' }
] as const;

export interface MailProviderStatus {
  smtpConfigured: boolean;
  smtpUser: string;
  smtpHost: string;
  resendConfigured: boolean;
  resendCustomDomain: boolean;
  resendFromEmail: string;
}

export interface ServerUserState {
  user: UserProfile;
  solvedMap: Record<string, { is_solved: boolean; solved_at: string }>;
  topicProgress: Record<string, UserTopicProgress>;
  dailyAssignments: DailyAssignment[];
  streak: UserStreak;
  reminderSettings: ReminderSettings;
  emailLogs: EmailLog[];
}

// Helper: Get today's date formatted as YYYY-MM-DD in Asia/Kolkata
export function getKolkataDateString(offsetDays: number = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

// Initial Seed Users
const SEED_USERS: (UserProfile & { passwordHash: string })[] = [
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

type Listener = () => void;

class OrbitDataStore {
  private users: (UserProfile & { passwordHash?: string })[] = [];
  private activeUserId: string | null = null;
  private solvedMap: Record<string, Record<string, { is_solved: boolean; solved_at: string }>> = {};
  private topicProgressMap: Record<string, Record<string, UserTopicProgress>> = {};
  private dailyAssignmentsMap: Record<string, DailyAssignment[]> = {};
  private streaksMap: Record<string, UserStreak> = {};
  private reminderSettingsMap: Record<string, ReminderSettings> = {};
  private emailLogs: EmailLog[] = [];
  private resendApiKey: string = '';
  private listeners: Set<Listener> = new Set();
  private version: number = 0;

  constructor() {
    this.init();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getVersion(): number {
    return this.version;
  }

  private notify() {
    this.version += 1;
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        for (const seed of SEED_USERS) {
          if (!this.users.some(u => u.id === seed.id || u.email.toLowerCase() === seed.email.toLowerCase())) {
            this.users.unshift(seed);
          }
        }
        this.persistUsers();
      } else {
        this.users = [...SEED_USERS];
        this.persistUsers();
      }

      this.activeUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;

      const storedSolved = localStorage.getItem(STORAGE_KEYS.SOLVED_MAP);
      this.solvedMap = storedSolved ? JSON.parse(storedSolved) : {};

      const storedTopics = localStorage.getItem(STORAGE_KEYS.TOPIC_PROGRESS);
      this.topicProgressMap = storedTopics ? JSON.parse(storedTopics) : {};

      const storedAssignments = localStorage.getItem(STORAGE_KEYS.DAILY_ASSIGNMENTS);
      this.dailyAssignmentsMap = storedAssignments ? JSON.parse(storedAssignments) : {};

      const storedStreaks = localStorage.getItem(STORAGE_KEYS.STREAKS);
      this.streaksMap = storedStreaks ? JSON.parse(storedStreaks) : {};

      const storedReminders = localStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
      this.reminderSettingsMap = storedReminders ? JSON.parse(storedReminders) : {};

      const storedEmailLogs = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
      this.emailLogs = storedEmailLogs ? JSON.parse(storedEmailLogs) : [];

      this.resendApiKey = localStorage.getItem(STORAGE_KEYS.RESEND_KEY) || '';

      for (const u of this.users) {
        this.ensureUserInitialized(u.id, u.email);
      }
    } catch (e) {
      console.error('Failed to initialize OrbitDataStore', e);
      this.users = [...SEED_USERS];
    }
  }

  // Hydrate full state returned from server for a given user
  private applyServerState(state: ServerUserState, serverUsers?: UserProfile[]) {
    if (serverUsers && Array.isArray(serverUsers)) {
      this.mergeServerUsers(serverUsers);
    }
    if (!state || !state.user) return;

    const uid = state.user.id;
    this.mergeServerUsers([state.user]);

    this.solvedMap[uid] = state.solvedMap || {};
    this.topicProgressMap[uid] = state.topicProgress || {};
    this.dailyAssignmentsMap[uid] = state.dailyAssignments || [];
    if (state.streak) {
      this.streaksMap[uid] = state.streak;
    }
    if (state.reminderSettings) {
      this.reminderSettingsMap[uid] = state.reminderSettings;
    }
    if (Array.isArray(state.emailLogs)) {
      const otherLogs = this.emailLogs.filter(l => l.user_id !== uid);
      this.emailLogs = [...state.emailLogs, ...otherLogs].sort(
        (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );
      this.persistEmailLogs();
    }

    this.persistSolved();
    this.persistTopicProgress();
    this.persistDailyAssignments();
    this.persistStreaks();
    this.persistReminders();
    this.notify();
  }

  private mergeServerUsers(serverUsers: UserProfile[]) {
    let changed = false;
    for (const su of serverUsers) {
      const idx = this.users.findIndex(
        u => u.id === su.id || u.email.toLowerCase() === su.email.toLowerCase()
      );
      if (idx === -1) {
        this.users.push({ ...su });
        changed = true;
      } else {
        this.users[idx] = { ...this.users[idx], ...su };
        changed = true;
      }
    }
    if (changed) {
      this.persistUsers();
    }
  }

  // Called on app mount to synchronize users & active user state with server DB
  public async bootstrapFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          this.mergeServerUsers(data.users);
        }
      }

      if (this.activeUserId) {
        await this.hydrateUserFromServer(this.activeUserId);
      } else {
        this.notify();
      }
    } catch {
      // Offline / dev boot fallback
    }
  }

  public async hydrateUserFromServer(userId: string): Promise<void> {
    try {
      const localUser = this.users.find(u => u.id === userId);
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/state`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          this.applyServerState(data.state);
          return;
        }
      }

      // If user existed locally before server knew about them, sync them now!
      if (localUser && localUser.email) {
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: localUser.id,
            email: localUser.email,
            full_name: localUser.full_name,
            role: localUser.role
          })
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.state) {
            this.applyServerState(syncData.state, syncData.users);
          }
        }
      }
    } catch {
      // ignore transient network errors
    }
  }

  public ensureUserInitialized(userId: string, email: string) {
    if (!this.streaksMap[userId]) {
      this.streaksMap[userId] = {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: undefined
      };
      this.persistStreaks();
    }

    const existingReminder = this.reminderSettingsMap[userId];
    if (!existingReminder) {
      this.reminderSettingsMap[userId] = {
        user_id: userId,
        email,
        reminders_enabled: true,
        timezone: 'Asia/Kolkata',
        reminder_time: '13:00, 17:30, 22:00',
        reminder_slots: [...DEFAULT_REMINDER_SLOTS],
        updated_at: new Date().toISOString()
      };
      this.persistReminders();
    } else if (!existingReminder.reminder_slots || existingReminder.reminder_slots.length === 0) {
      existingReminder.reminder_slots = [...DEFAULT_REMINDER_SLOTS];
      existingReminder.reminder_time = '13:00, 17:30, 22:00';
      this.persistReminders();
    }

    if (!this.solvedMap[userId]) {
      this.solvedMap[userId] = {};
      if (userId === 'user-alex-002') {
        this.solvedMap[userId]['q-1'] = { is_solved: true, solved_at: new Date().toISOString() };
        this.solvedMap[userId]['q-26'] = { is_solved: true, solved_at: new Date().toISOString() };
        this.solvedMap[userId]['q-27'] = { is_solved: true, solved_at: new Date().toISOString() };
      }
      this.persistSolved();
    }

    if (!this.topicProgressMap[userId]) {
      this.topicProgressMap[userId] = {};
      TOPICS_DATA.forEach((topic, idx) => {
        const topicQuestions = this.getQuestionsForTopic(topic.id);
        const solvedCount = topicQuestions.filter(q => this.solvedMap[userId]?.[q.id]?.is_solved).length;
        this.topicProgressMap[userId][topic.id] = {
          topic_id: topic.id,
          status: idx === 0 ? 'active' : 'locked',
          total_questions: topicQuestions.length,
          solved_questions: solvedCount,
          unlocked_at: idx === 0 ? new Date().toISOString() : undefined,
          completed_at: undefined
        };
      });
      this.persistTopicProgress();
    }

    if (!this.dailyAssignmentsMap[userId] || this.dailyAssignmentsMap[userId].length === 0) {
      this.generateDailyAssignments(userId);
    }
  }

  // --- Auth & Users ---
  public getUsers(): UserProfile[] {
    return this.users.map(({ passwordHash, ...rest }) => rest);
  }

  public getActiveUser(): UserProfile | null {
    if (!this.activeUserId) return null;
    const found = this.users.find(u => u.id === this.activeUserId);
    if (!found) return null;
    const { passwordHash, ...safeUser } = found;
    return safeUser;
  }

  public switchUser(userId: string): UserProfile | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    this.activeUserId = userId;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.ensureUserInitialized(user.id, user.email);
    this.notify();
    void this.hydrateUserFromServer(user.id);
    return this.getActiveUser();
  }

  public async registerUserAsync(fullName: string, email: string, password: string): Promise<{ user: UserProfile }> {
    const normalizedEmail = email.trim().toLowerCase();

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email: normalizedEmail, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed.');
    }

    const serverUser: UserProfile = data.user;
    this.activeUserId = serverUser.id;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, serverUser.id);
    this.applyServerState(data.state, data.users);
    return { user: serverUser };
  }

  public async loginUserAsync(email: string, password: string): Promise<{ user: UserProfile }> {
    const normalizedEmail = email.trim().toLowerCase();

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const serverUser: UserProfile = data.user;
      this.activeUserId = serverUser.id;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, serverUser.id);
      this.applyServerState(data.state, data.users);
      return { user: serverUser };
    }

    // Fallback: if account was created locally earlier with matching password, sync it to server!
    const localMatch = this.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (localMatch && localMatch.passwordHash === password) {
      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: localMatch.id,
          email: localMatch.email,
          full_name: localMatch.full_name,
          role: localMatch.role
        })
      });
      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.success) {
        this.activeUserId = syncData.user.id;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, syncData.user.id);
        this.applyServerState(syncData.state, syncData.users);
        return { user: syncData.user };
      }
    }

    throw new Error(data.error || 'Invalid email or password.');
  }

  public registerUser(fullName: string, email: string, password: string): { user: UserProfile } {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser: UserProfile & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role: 'user',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
      created_at: new Date().toISOString(),
      passwordHash: password
    };

    this.users.push(newUser);
    this.persistUsers();
    this.ensureUserInitialized(newUser.id, newUser.email);
    this.activeUserId = newUser.id;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    this.notify();

    void fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newUser.id, email: newUser.email, full_name: newUser.full_name, role: newUser.role })
    });

    const { passwordHash, ...safeUser } = newUser;
    return { user: safeUser };
  }

  public loginUser(email: string, password: string): { user: UserProfile } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    if (user.passwordHash && user.passwordHash !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    this.activeUserId = user.id;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    this.ensureUserInitialized(user.id, user.email);
    this.notify();
    void this.hydrateUserFromServer(user.id);

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser };
  }

  public logoutUser(): void {
    this.activeUserId = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.notify();
  }

  public updateProfile(userId: string, data: Partial<UserProfile>): UserProfile {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (data.full_name) user.full_name = data.full_name.trim();
    if (data.avatar_url) user.avatar_url = data.avatar_url;
    if (data.email) {
      const normalized = data.email.trim().toLowerCase();
      user.email = normalized;
      if (this.reminderSettingsMap[userId]) {
        this.reminderSettingsMap[userId].email = normalized;
        this.persistReminders();
      }
    }
    this.persistUsers();
    this.notify();

    void fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        avatar_url: data.avatar_url
      })
    })
      .then(r => r.json())
      .then(d => {
        if (d?.success && d.state) {
          this.applyServerState(d.state);
        }
      })
      .catch(() => {});

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // --- Questions & Topics ---
  public getAllQuestions(): Question[] {
    return QUESTIONS_DATA;
  }

  public getQuestionById(id: string): Question | undefined {
    return QUESTIONS_DATA.find(q => q.id === id);
  }

  public getAllTopics(): Topic[] {
    return TOPICS_DATA;
  }

  public getTopicById(topicId: string): Topic | undefined {
    return TOPICS_DATA.find(t => t.id === topicId || t.slug === topicId);
  }

  public getQuestionsForTopic(topicId: string): Question[] {
    const topic = this.getTopicById(topicId);
    if (!topic) return [];
    const tSlug = topic.slug.toLowerCase();
    const tName = topic.name.toLowerCase();

    return QUESTIONS_DATA.filter(q => {
      const matchId = q.topic_ids?.some(id => id.toLowerCase() === tSlug || id.toLowerCase() === topic.id);
      const matchName = q.topics?.some(t => t.toLowerCase() === tName || t.toLowerCase() === tSlug);
      return matchId || matchName;
    });
  }

  // --- Topic Progression & Unlocking ---
  public getUserTopicProgress(userId: string): Record<string, UserTopicProgress> {
    if (!this.topicProgressMap[userId]) {
      this.ensureUserInitialized(userId, this.getActiveUser()?.email || '');
    }
    return this.topicProgressMap[userId] || {};
  }

  public getActiveTopic(userId: string): Topic {
    const progress = this.getUserTopicProgress(userId);
    const activeEntry = Object.values(progress).find(p => p.status === 'active');
    if (activeEntry) {
      const topic = this.getTopicById(activeEntry.topic_id);
      if (topic) return topic;
    }
    return TOPICS_DATA[0];
  }

  // --- Daily 5-Question Challenge & Carry-Forward + Top-Up Engine ---
  public getDailyAssignments(userId: string): DailyAssignment[] {
    const today = getKolkataDateString();
    const existing = this.dailyAssignmentsMap[userId] || [];
    const hasOutdatedDate = existing.some(a => a.assignment_date < today);

    if (existing.length === 0 || hasOutdatedDate) {
      return this.generateDailyAssignments(userId, false);
    }

    return existing.map(a => ({
      ...a,
      question: a.question || this.getQuestionById(a.question_id)
    }));
  }

  /**
   * Carry-Forward + Top-Up Rule:
   * - Any pending questions from previous days roll forward as 'carried_forward' (preserving original_date).
   * - Today's completed questions stay visible unless forceNextBatch is true.
   * - If active workload < 5, add new unsolved questions from active topic to reach 5!
   */
  public generateDailyAssignments(userId: string, forceNextBatch: boolean = false): DailyAssignment[] {
    const today = getKolkataDateString();
    const existing = this.dailyAssignmentsMap[userId] || [];
    const solvedSet = this.solvedMap[userId] || {};

    const activeList: DailyAssignment[] = [];

    for (const a of existing) {
      const isSolved = Boolean(solvedSet[a.question_id]?.is_solved) || a.status === 'completed';
      if (!isSolved) {
        if (a.assignment_date < today) {
          activeList.push({
            ...a,
            original_date: a.original_date || a.assignment_date,
            assignment_date: today,
            assignment_type: 'carried_forward',
            status: 'pending',
            question: this.getQuestionById(a.question_id)
          });
        } else {
          activeList.push({
            ...a,
            status: 'pending',
            question: this.getQuestionById(a.question_id)
          });
        }
      } else if (a.assignment_date === today && !forceNextBatch) {
        activeList.push({
          ...a,
          status: 'completed',
          question: this.getQuestionById(a.question_id)
        });
      }
    }

    const needed = Math.max(0, 5 - activeList.length);
    if (needed > 0) {
      const activeTopic = this.getActiveTopic(userId);
      const topicQuestions = this.getQuestionsForTopic(activeTopic.id);
      const alreadyIds = new Set(activeList.map(a => a.question_id));
      const candidates = topicQuestions.filter(q => !solvedSet[q.id]?.is_solved && !alreadyIds.has(q.id));

      candidates.slice(0, needed).forEach((q, idx) => {
        activeList.push({
          id: `assign-${userId}-${today}-${q.id}-${Date.now()}-${idx}`,
          user_id: userId,
          question_id: q.id,
          assignment_date: today,
          original_date: today,
          assignment_type: 'new',
          status: 'pending',
          question: q
        });
      });
    }

    this.dailyAssignmentsMap[userId] = activeList;
    this.persistDailyAssignments();

    if (forceNextBatch) {
      void fetch(`/api/users/${encodeURIComponent(userId)}/next-batch`, { method: 'POST' })
        .then(r => r.json())
        .then(d => {
          if (d?.success && d.state) {
            this.applyServerState(d.state);
          }
        })
        .catch(() => {});
    }

    return activeList;
  }

  // --- Manual Question Completion & Streak Calculation ---
  public toggleQuestionSolved(userId: string, questionId: string): boolean {
    const userSolved = this.solvedMap[userId] || (this.solvedMap[userId] = {});
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

    this.persistSolved();

    const assignments = this.dailyAssignmentsMap[userId] || [];
    let updatedAssignment = false;
    for (const a of assignments) {
      if (a.question_id === questionId) {
        a.status = nowSolved ? 'completed' : 'pending';
        a.completed_at = nowSolved ? new Date().toISOString() : undefined;
        updatedAssignment = true;
      }
    }
    if (updatedAssignment) {
      this.persistDailyAssignments();
    }

    this.recalculateTopicProgress(userId);
    this.notify();

    // Persist on backend so scheduled reminder emails always reflect exact solved/pending state
    void fetch(`/api/users/${encodeURIComponent(userId)}/toggle-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId })
    })
      .then(r => r.json())
      .then(d => {
        if (d?.success && d.state) {
          this.applyServerState(d.state);
        }
      })
      .catch(() => {});

    return nowSolved;
  }

  public isQuestionSolved(userId: string, questionId: string): boolean {
    return Boolean(this.solvedMap[userId]?.[questionId]?.is_solved);
  }

  private updateStreakOnSolve(userId: string) {
    const today = getKolkataDateString();
    const streak = this.streaksMap[userId] || {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: undefined
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
    this.streaksMap[userId] = streak;
    this.persistStreaks();
  }

  private recalculateTopicProgress(userId: string) {
    const userTopics = this.topicProgressMap[userId] || {};
    const solvedSet = this.solvedMap[userId] || {};
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

    this.topicProgressMap[userId] = userTopics;
    this.persistTopicProgress();
  }

  // --- Streaks & Stats ---
  public getUserStreak(userId: string): UserStreak {
    return (
      this.streaksMap[userId] || {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: undefined
      }
    );
  }

  public getUserStats(userId: string) {
    const solvedMap = this.solvedMap[userId] || {};
    const totalSolved = Object.values(solvedMap).filter(v => v.is_solved).length;
    const totalAvailable = QUESTIONS_DATA.length;
    const completionPercentage = totalAvailable > 0 ? Math.round((totalSolved / totalAvailable) * 100) : 0;

    const streak = this.getUserStreak(userId);
    const activeTopic = this.getActiveTopic(userId);
    const topicQuestions = this.getQuestionsForTopic(activeTopic.id);
    const topicSolved = topicQuestions.filter(q => solvedMap[q.id]?.is_solved).length;

    const assignments = this.getDailyAssignments(userId);
    const pendingCount = assignments.filter(a => a.status === 'pending').length;
    const carriedForwardCount = assignments.filter(a => a.assignment_type === 'carried_forward').length;
    const solvedToday = assignments.filter(a => a.status === 'completed').length;

    const topicProgress = this.getUserTopicProgress(userId);
    const completedTopics = Object.values(topicProgress).filter(p => p.status === 'completed').length;

    return {
      totalSolved,
      totalAvailable,
      completionPercentage,
      pendingCount,
      carriedForwardCount,
      solvedToday,
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      completedTopics,
      activeTopic,
      topicQuestionsCount: topicQuestions.length,
      topicSolvedCount: topicSolved,
      topicPercentage: topicQuestions.length > 0 ? Math.round((topicSolved / topicQuestions.length) * 100) : 0
    };
  }

  // --- Automated Daily Email Reminder System ---
  public getReminderSettings(userId: string): ReminderSettings {
    const user = this.users.find(u => u.id === userId);
    const existing = this.reminderSettingsMap[userId];
    if (existing) {
      return {
        ...existing,
        reminder_slots:
          existing.reminder_slots && existing.reminder_slots.length > 0
            ? existing.reminder_slots
            : [...DEFAULT_REMINDER_SLOTS]
      };
    }
    return {
      user_id: userId,
      email: user?.email || '',
      reminders_enabled: true,
      timezone: 'Asia/Kolkata',
      reminder_time: '13:00, 17:30, 22:00',
      reminder_slots: [...DEFAULT_REMINDER_SLOTS],
      updated_at: new Date().toISOString()
    };
  }

  public updateReminderSettings(userId: string, data: Partial<ReminderSettings>): ReminderSettings {
    const current = this.getReminderSettings(userId);
    const nextSlots = data.reminder_slots || current.reminder_slots || [...DEFAULT_REMINDER_SLOTS];
    const updated: ReminderSettings = {
      ...current,
      ...data,
      reminder_slots: nextSlots,
      reminder_time: nextSlots.join(', '),
      updated_at: new Date().toISOString()
    };
    this.reminderSettingsMap[userId] = updated;
    this.persistReminders();
    this.notify();

    void fetch(`/api/users/${encodeURIComponent(userId)}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});

    return updated;
  }

  public getEmailLogs(userId?: string): EmailLog[] {
    if (userId) {
      return this.emailLogs.filter(log => log.user_id === userId);
    }
    return this.emailLogs;
  }

  public getResendApiKey(): string {
    return this.resendApiKey;
  }

  public setResendApiKey(key: string): void {
    this.resendApiKey = key.trim();
    localStorage.setItem(STORAGE_KEYS.RESEND_KEY, this.resendApiKey);
  }

  /**
   * Dispatch real personalized reminder emails via server /api/reminders/trigger
   */
  public async triggerScheduledReminderCycle(
    forceTargetUserId?: string,
    slot: string = 'manual'
  ): Promise<{
    processed: number;
    sent: number;
    failed: number;
    skippedDuplicates: number;
    logs: EmailLog[];
  }> {
    const res = await fetch('/api/reminders/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot,
        targetUserId: forceTargetUserId || undefined,
        force: true,
        resendApiKey: this.resendApiKey || undefined
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to trigger reminder cycle');
    }

    if (Array.isArray(data.logs)) {
      const existingIds = new Set(this.emailLogs.map(l => l.id));
      const newEntries = data.logs.filter((l: EmailLog) => !existingIds.has(l.id));
      this.emailLogs = [...newEntries, ...this.emailLogs];
      this.persistEmailLogs();
    }

    if (forceTargetUserId) {
      await this.hydrateUserFromServer(forceTargetUserId);
    } else {
      this.notify();
    }

    return {
      processed: data.processed,
      sent: data.sent,
      failed: data.failed,
      skippedDuplicates: data.skippedDuplicates,
      logs: data.logs || []
    };
  }

  public async retryFailedEmail(logId: string): Promise<boolean> {
    const res = await fetch(`/api/reminders/retry/${encodeURIComponent(logId)}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (Array.isArray(data.logs)) {
        const existingIds = new Set(this.emailLogs.map(l => l.id));
        const newEntries = data.logs.filter((l: EmailLog) => !existingIds.has(l.id));
        this.emailLogs = [...newEntries, ...this.emailLogs];
        this.persistEmailLogs();
      }
      this.notify();
      return data.sent > 0;
    }
    return false;
  }

  public async fetchAdminOverview(): Promise<{
    stats: ReturnType<OrbitDataStore['getAdminStats']>;
    logs: EmailLog[];
    users: (UserProfile & { reminderSettings?: ReminderSettings })[];
    mailProviderStatus: MailProviderStatus;
  } | null> {
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.logs)) {
          this.emailLogs = data.logs;
          this.persistEmailLogs();
        }
        if (Array.isArray(data.users)) {
          this.mergeServerUsers(data.users);
          for (const u of data.users) {
            if (u.reminderSettings) {
              this.reminderSettingsMap[u.id] = u.reminderSettings;
            }
          }
          this.persistReminders();
        }
        return {
          stats: data.stats,
          logs: data.logs,
          users: data.users,
          mailProviderStatus: data.mailProviderStatus
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  public async saveMailConfig(cfg: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    resendFromEmail?: string;
  }): Promise<MailProviderStatus> {
    const res = await fetch('/api/admin/mail-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save mail configuration');
    }
    return data.mailProviderStatus;
  }

  // --- Admin Dataset & Platform Stats ---
  public getAdminStats() {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => {
      const streak = this.streaksMap[u.id];
      return streak && streak.last_activity_date;
    }).length;

    const emailLogs = this.emailLogs;
    const sentCount = emailLogs.filter(l => l.delivery_status === 'sent').length;
    const failedCount = emailLogs.filter(l => l.delivery_status === 'failed').length;
    const eligibleCount = this.users.filter(u => this.getReminderSettings(u.id).reminders_enabled).length;

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
        lastExecution: emailLogs[0]?.sent_at || '1:00 PM, 5:30 PM & 10:00 PM IST'
      }
    };
  }

  // --- Persistence Handlers ---
  private persistUsers() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
  }
  private persistSolved() {
    localStorage.setItem(STORAGE_KEYS.SOLVED_MAP, JSON.stringify(this.solvedMap));
  }
  private persistTopicProgress() {
    localStorage.setItem(STORAGE_KEYS.TOPIC_PROGRESS, JSON.stringify(this.topicProgressMap));
  }
  private persistDailyAssignments() {
    localStorage.setItem(STORAGE_KEYS.DAILY_ASSIGNMENTS, JSON.stringify(this.dailyAssignmentsMap));
  }
  private persistStreaks() {
    localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(this.streaksMap));
  }
  private persistReminders() {
    localStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(this.reminderSettingsMap));
  }
  private persistEmailLogs() {
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(this.emailLogs));
  }
}

export const OrbitDB = new OrbitDataStore();
