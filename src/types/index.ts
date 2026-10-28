export type PageView =
  | 'launch-setup'
  | 'welcome-lab'
  | 'registration'
  | 'assessment'
  | 'training-home'
  | 'challenge-explanation'
  | 'active-sandbox'
  | 'progress-dashboard'
  | 'lab-manager';

export interface VmStatus {
  state: 'stopped' | 'starting' | 'running' | 'resetting' | 'error';
  vmName: string;
  uptimeSeconds: number;
  memoryMb: number;
  cpus: number;
  endpoint: string;
  isolated: boolean;
  engine: 'qemu-whpx' | 'qemu-tcg' | 'embedded-isolated-sandbox';
  qemuPath: string | null;
  baseImagePresent: boolean;
  overlayImagePresent: boolean;
  lastError?: string;
}

export interface VmDiagnostics {
  qemuFound: boolean;
  qemuPath: string | null;
  qemuVersion: string | null;
  virtualizationSupported: boolean;
  accelerationEngine: string;
  diskFreeGb: number;
  hostPortAvailable: boolean;
  isolationValid: boolean;
  statusMessage: string;
}

export interface Challenge {
  id: string;
  order_index: number;
  track?: 'meridian' | 'picoctf' | string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_time: string;
  xp_reward: number;
  description: string;
  learning_objectives: string;
  prerequisites: string;
  safety_notes: string;
  target_url: string;
  flag_plain?: string;
  unlocked: boolean | number;
  status: 'not_started' | 'in_progress' | 'completed';
  hints_revealed: number;
  attempts: number;
  score_awarded: number;
  time_spent_seconds: number;
  completed_at: string | null;
  hint_1?: string;
  hint_2?: string;
  hint_3?: string;
  remediation_summary?: string;
  remediation_diff?: string;
  quiz_question?: string;
  quiz_options?: string[];
  quiz_answer?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  skill_level: string;
  learning_path: string;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id?: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface ActivityLog {
  id: string;
  profile_id?: string;
  event_type: string;
  message: string;
  details_json?: string;
  created_at: string;
}

export interface DashboardStats {
  totalXp: number;
  challengesCompleted: number;
  totalChallenges: number;
  completionPercentage: number;
  badgesEarned: number;
  totalBadges: number;
  totalTimeSpentMinutes: number;
  rank: string;
  learningPath: string;
}

export interface FlagSubmitResult {
  success: boolean;
  message: string;
  xpEarned?: number;
  hintsUsed?: number;
  attempts?: number;
  nextChallengeId?: string | null;
  remediationSummary?: string;
  remediationDiff?: string;
  quizQuestion?: string;
  quizOptions?: string[];
}
