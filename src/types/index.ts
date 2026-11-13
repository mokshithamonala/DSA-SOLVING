export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Question {
  id: string;
  leetcode_id: number;
  title: string;
  title_slug: string;
  problem_url: string;
  difficulty: 'Easy';
  topics: string[];
  topic_ids: string[];
  is_premium: boolean;
  source: string;
  verified_at: string;
  is_active: boolean;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  phase: string;
  display_order: number;
  description: string;
}

export interface UserTopicProgress {
  topic_id: string;
  status: 'locked' | 'active' | 'completed';
  total_questions: number;
  solved_questions: number;
  unlocked_at?: string;
  completed_at?: string;
}

export interface DailyAssignment {
  id: string;
  user_id: string;
  question_id: string;
  assignment_date: string; // YYYY-MM-DD
  original_date?: string; // Preserved original assignment date when carried forward
  assignment_type: 'new' | 'carried_forward';
  status: 'pending' | 'completed';
  completed_at?: string;
  question?: Question;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string; // YYYY-MM-DD in Asia/Kolkata
  updated_at?: string;
}

export interface ReminderSettings {
  user_id: string;
  email: string;
  reminders_enabled: boolean;
  timezone: string;
  reminder_time: string; // e.g., '13:00, 17:30, 22:00'
  reminder_slots?: string[]; // ['13:00', '17:30', '22:00']
  updated_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  email_type: string;
  reminder_slot?: string;
  scheduled_date: string;
  sent_at: string;
  delivery_status: 'sent' | 'failed' | 'pending';
  provider?: string;
  error_message?: string;
}

export interface ImportLog {
  id: string;
  source: string;
  imported_count: number;
  verified_easy_count: number;
  duplicate_count: number;
  invalid_count: number;
  excluded_medium_count: number;
  excluded_hard_count: number;
  status: string;
  error_message?: string;
  created_at: string;
}
