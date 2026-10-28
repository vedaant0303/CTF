import { Challenge, DashboardStats, UserProfile, VmDiagnostics, VmStatus, Badge, ActivityLog, FlagSubmitResult } from '../types';
import { SEED_CHALLENGES, SEED_BADGES } from '../../electron/database/seed';

declare global {
  interface Window {
    ctfAPI?: {
      getVmStatus: () => Promise<VmStatus>;
      startLab: () => Promise<boolean>;
      stopLab: () => Promise<void>;
      resetLab: () => Promise<boolean>;
      getVmDiagnostics: () => Promise<VmDiagnostics>;
      onVmStateChange: (callback: (status: VmStatus) => void) => () => void;

      getChallenges: () => Promise<Challenge[]>;
      getChallengeById: (challengeId: string) => Promise<Challenge | null>;
      startChallenge: (challengeId: string) => Promise<void>;
      unlockHint: (challengeId: string, hintLevel: number) => Promise<{ success: boolean; hintText: string; penaltyXp: number }>;
      submitFlag: (challengeId: string, flag: string, timeSpentSeconds: number) => Promise<FlagSubmitResult>;
      importChallenges: (challenges: any[]) => Promise<{ count: number; imported: Challenge[] }>;
      fetchGithubChallenges: (rawUrl: string) => Promise<{ success: boolean; data?: any; error?: string }>;

      getActiveProfile: () => Promise<UserProfile | null>;
      getAllProfiles: () => Promise<UserProfile[]>;
      switchProfile: (profileId: string) => Promise<UserProfile>;
      deleteProfile: (profileId: string) => Promise<boolean>;
      createProfile: (data: { username: string; displayName: string; avatar: string }) => Promise<UserProfile>;
      submitAssessment: (answers: any) => Promise<{ skillLevel: string; learningPath: string; score: number } | null>;

      getDashboardStats: () => Promise<DashboardStats | null>;
      getBadges: () => Promise<Badge[]>;
      getActivityLogs: () => Promise<ActivityLog[]>;
      resetAllProgress: () => Promise<void>;

      openExternalUrl: (url: string) => Promise<void>;

      // Cloud Database (MongoDB)
      getMongoStatus?: () => Promise<{ connected: boolean; uri?: string; maskedUri?: string; database: string; error?: string | null }>;
      connectMongo?: (uri: string) => Promise<{ success: boolean; error?: string }>;
      disconnectMongo?: () => Promise<any>;
    };
  }
}

// Fallback in-memory / localStorage storage helpers for web mode
const STORAGE_KEYS = {
  CHALLENGES: 'ctf_local_challenges',
  PROFILES: 'ctf_local_profiles',
  ACTIVE_PROFILE_ID: 'ctf_local_active_profile_id',
  LOGS: 'ctf_local_logs',
};

function getLocalChallenges(): Challenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  // Initialize from seed
  const initial: Challenge[] = SEED_CHALLENGES.map((ch) => ({
    id: ch.id,
    order_index: ch.order_index,
    track: ch.track || 'meridian',
    title: ch.title,
    category: ch.category,
    difficulty: ch.difficulty,
    estimated_time: ch.estimated_time,
    xp_reward: ch.xp_reward,
    description: ch.description,
    learning_objectives: ch.learning_objectives,
    prerequisites: ch.prerequisites,
    safety_notes: ch.safety_notes,
    target_url: ch.target_url,
    unlocked: true,
    status: 'not_started',
    hints_revealed: 0,
    attempts: 0,
    score_awarded: 0,
    time_spent_seconds: 0,
    completed_at: null,
    hint_1: ch.hint_1,
    hint_2: ch.hint_2,
    hint_3: ch.hint_3,
    remediation_summary: ch.remediation_summary,
    remediation_diff: ch.remediation_diff,
    quiz_question: ch.quiz_question,
    quiz_options: ch.quiz_options,
    quiz_answer: ch.quiz_answer,
    flag_plain: ch.flag_plain,
  }));

  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(initial));
  } catch (e) {}

  return initial;
}

function saveLocalChallenges(chs: Challenge[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(chs));
  } catch (e) {}
}

function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const defaultProfile: UserProfile = {
    id: 'profile-varun-01',
    username: 'varun',
    display_name: 'Varun',
    avatar: 'Shield',
    skill_level: 'Junior Penetration Tester',
    learning_path: 'Web Exploitation to Host Compromise',
    total_xp: 400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([defaultProfile]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, defaultProfile.id);
  } catch (e) {}

  return [defaultProfile];
}

function saveLocalProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (e) {}
}

export const api = {
  getVmStatus: async (): Promise<VmStatus> => {
    if (window.ctfAPI) return window.ctfAPI.getVmStatus();
    return {
      state: 'running',
      vmName: 'Antigravity-Isolated-CTF-Linux-Node',
      uptimeSeconds: 120,
      memoryMb: 1024,
      cpus: 1,
      endpoint: 'http://127.0.0.1:8888',
      isolated: true,
      engine: 'embedded-isolated-sandbox',
      qemuPath: null,
      baseImagePresent: false,
      overlayImagePresent: false,
    };
  },

  startLab: async (): Promise<boolean> => {
    if (window.ctfAPI) return window.ctfAPI.startLab();
    return true;
  },

  stopLab: async (): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.stopLab();
  },

  resetLab: async (): Promise<boolean> => {
    if (window.ctfAPI) return window.ctfAPI.resetLab();

    // Trigger local reset against sandbox server if running on port 8888
    try {
      await fetch('http://127.0.0.1:8888/api/reset', { method: 'POST' });
    } catch (e) {}

    return true;
  },

  getVmDiagnostics: async (): Promise<VmDiagnostics> => {
    if (window.ctfAPI) return window.ctfAPI.getVmDiagnostics();
    return {
      qemuFound: false,
      qemuPath: null,
      qemuVersion: null,
      virtualizationSupported: true,
      accelerationEngine: 'embedded-isolated-sandbox',
      diskFreeGb: 24.5,
      hostPortAvailable: true,
      isolationValid: true,
      statusMessage: 'Ready: Isolated host sandbox operational.',
    };
  },

  onVmStateChange: (callback: (status: VmStatus) => void): (() => void) => {
    if (window.ctfAPI) return window.ctfAPI.onVmStateChange(callback);
    return () => {};
  },

  getChallenges: async (): Promise<Challenge[]> => {
    if (window.ctfAPI) return window.ctfAPI.getChallenges();
    return getLocalChallenges();
  },

  getChallengeById: async (id: string): Promise<Challenge | null> => {
    if (window.ctfAPI) return window.ctfAPI.getChallengeById(id);
    const list = getLocalChallenges();
    return list.find((c) => c.id === id) || null;
  },

  startChallenge: async (id: string): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.startChallenge(id);
    const list = getLocalChallenges();
    const target = list.find((c) => c.id === id);
    if (target && target.status === 'not_started') {
      target.status = 'in_progress';
      saveLocalChallenges(list);
    }
  },

  unlockHint: async (id: string, level: number): Promise<{ success: boolean; hintText: string; penaltyXp: number }> => {
    if (window.ctfAPI) return window.ctfAPI.unlockHint(id, level);
    const list = getLocalChallenges();
    const ch = list.find((c) => c.id === id);
    if (!ch) return { success: false, hintText: '', penaltyXp: 0 };

    ch.hints_revealed = Math.max(ch.hints_revealed || 0, level);
    saveLocalChallenges(list);

    let text = ch.hint_1 || '';
    if (level === 2) text = ch.hint_2 || '';
    if (level === 3) text = ch.hint_3 || '';

    return { success: true, hintText: text, penaltyXp: 10 * level };
  },

  submitFlag: async (id: string, flag: string, timeSpentSeconds: number): Promise<FlagSubmitResult> => {
    if (window.ctfAPI) return window.ctfAPI.submitFlag(id, flag, timeSpentSeconds);

    const challenges = getLocalChallenges();
    const ch = challenges.find((c) => c.id === id);
    if (!ch) return { success: false, message: 'Challenge target not found.' };

    const trimmedInput = (flag || '').trim().toLowerCase();
    const correctFlag = (ch.flag_plain || '').trim().toLowerCase();

    // Verification check
    const isMatch = trimmedInput === correctFlag;

    if (isMatch) {
      const xpEarned = ch.xp_reward;
      ch.status = 'completed';
      ch.score_awarded = xpEarned;
      ch.completed_at = new Date().toISOString();
      saveLocalChallenges(challenges);

      // Update active profile XP
      const profiles = getLocalProfiles();
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || profiles[0].id;
      const active = profiles.find((p) => p.id === activeId) || profiles[0];
      if (active) {
        active.total_xp = (active.total_xp || 0) + xpEarned;
        active.updated_at = new Date().toISOString();
        saveLocalProfiles(profiles);
      }

      // Find next challenge in chain
      const nextOrder = ch.order_index + 1;
      const nextChallenge = challenges.find((c) => c.order_index === nextOrder);

      return {
        success: true,
        message: 'Congratulations! Flag captured successfully.',
        xpEarned,
        hintsUsed: ch.hints_revealed || 0,
        attempts: (ch.attempts || 0) + 1,
        nextChallengeId: nextChallenge ? nextChallenge.id : null,
        remediationSummary: ch.remediation_summary,
        remediationDiff: ch.remediation_diff,
        quizQuestion: ch.quiz_question,
        quizOptions: ch.quiz_options,
      };
    }

    ch.attempts = (ch.attempts || 0) + 1;
    saveLocalChallenges(challenges);

    return {
      success: false,
      message: 'Not quite. Check your syntax, examine the response, or reveal a progressive clue.',
    };
  },

  importChallenges: async (challenges: any[]): Promise<{ count: number; imported: Challenge[] }> => {
    if (window.ctfAPI?.importChallenges) {
      return window.ctfAPI.importChallenges(challenges);
    }
    const current = getLocalChallenges();
    const formatted: Challenge[] = challenges.map((c, i) => ({
      id: c.id || `custom-${Date.now()}-${i}`,
      order_index: current.length + i + 1,
      track: 'picoctf',
      title: c.title,
      category: c.category || 'Web Exploitation',
      difficulty: c.difficulty || 'Easy',
      estimated_time: c.estimated_time || '15 min',
      xp_reward: c.xp_reward || 100,
      description: c.description || '',
      learning_objectives: c.learning_objectives || '',
      prerequisites: c.prerequisites || '',
      safety_notes: c.safety_notes || '',
      target_url: c.target_url || 'http://127.0.0.1:8888/',
      unlocked: true,
      status: 'not_started',
      hints_revealed: 0,
      attempts: 0,
      score_awarded: 0,
      time_spent_seconds: 0,
      completed_at: null,
      flag_plain: c.flag_plain || c.flag || '',
      hint_1: c.hint_1 || c.hints?.[0] || '',
      hint_2: c.hint_2 || c.hints?.[1] || '',
      hint_3: c.hint_3 || c.hints?.[2] || '',
      remediation_summary: c.remediation_summary || '',
      remediation_diff: c.remediation_diff || '',
      quiz_question: c.quiz_question || '',
      quiz_options: c.quiz_options || [],
      quiz_answer: c.quiz_answer || '',
    }));

    const merged = [...current, ...formatted];
    saveLocalChallenges(merged);
    return { count: formatted.length, imported: formatted };
  },

  fetchGithubChallenges: async (rawUrl: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (window.ctfAPI?.fetchGithubChallenges) {
      return window.ctfAPI.fetchGithubChallenges(rawUrl);
    }
    try {
      const res = await fetch(rawUrl);
      const data = await res.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  getActiveProfile: async (): Promise<UserProfile | null> => {
    if (window.ctfAPI) return window.ctfAPI.getActiveProfile();
    const profiles = getLocalProfiles();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    return profiles.find((p) => p.id === activeId) || profiles[0] || null;
  },

  getAllProfiles: async (): Promise<UserProfile[]> => {
    if (window.ctfAPI) return window.ctfAPI.getAllProfiles();
    return getLocalProfiles();
  },

  switchProfile: async (profileId: string): Promise<UserProfile> => {
    if (window.ctfAPI) return window.ctfAPI.switchProfile(profileId);
    const profiles = getLocalProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) throw new Error('Profile not found');
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
    return target;
  },

  deleteProfile: async (profileId: string): Promise<boolean> => {
    if (window.ctfAPI) return window.ctfAPI.deleteProfile(profileId);
    let profiles = getLocalProfiles();
    if (profiles.length <= 1) throw new Error('Cannot delete the only existing profile');
    profiles = profiles.filter((p) => p.id !== profileId);
    saveLocalProfiles(profiles);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, profiles[0].id);
    return true;
  },

  createProfile: async (data: { username: string; displayName: string; avatar: string }): Promise<UserProfile> => {
    if (window.ctfAPI) return window.ctfAPI.createProfile(data);
    const profiles = getLocalProfiles();
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      username: data.username,
      display_name: data.displayName,
      avatar: data.avatar,
      skill_level: 'Junior Penetration Tester',
      learning_path: 'Web Exploitation to Host Compromise',
      total_xp: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    saveLocalProfiles(profiles);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, newProfile.id);
    return newProfile;
  },

  submitAssessment: async (answers: any) => {
    if (window.ctfAPI) return window.ctfAPI.submitAssessment(answers);
    return {
      skillLevel: 'Junior Penetration Tester',
      learningPath: 'Web Exploitation to Host Compromise (Beginner Chained Track)',
      score: 75,
    };
  },

  getDashboardStats: async (): Promise<DashboardStats | null> => {
    if (window.ctfAPI) return window.ctfAPI.getDashboardStats();
    const challenges = getLocalChallenges();
    const profiles = getLocalProfiles();
    const active = profiles[0];
    const completed = challenges.filter((c) => c.status === 'completed');
    const totalXp = challenges.reduce((sum, c) => sum + (c.score_awarded || (c.status === 'completed' ? c.xp_reward : 0)), 0);

    return {
      totalXp: Math.max(active?.total_xp || 0, totalXp),
      challengesCompleted: completed.length,
      totalChallenges: challenges.length,
      completionPercentage: challenges.length > 0 ? Math.round((completed.length / challenges.length) * 100) : 0,
      badgesEarned: completed.length > 0 ? 2 : 0,
      totalBadges: 8,
      totalTimeSpentMinutes: completed.length * 15,
      rank: active?.skill_level || 'Junior Penetration Tester',
      learningPath: active?.learning_path || 'Web Exploitation to Host Compromise',
    };
  },

  getBadges: async (): Promise<Badge[]> => {
    if (window.ctfAPI) return window.ctfAPI.getBadges();
    return SEED_BADGES.map((b) => ({
      id: b.code,
      code: b.code,
      title: b.title,
      description: b.description,
      icon: b.icon,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
    }));
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    if (window.ctfAPI) return window.ctfAPI.getActivityLogs();
    return [
      {
        id: 'log-1',
        event_type: 'LAB_ONLINE',
        message: 'MERIDIAN-01 isolated local sandbox running on 127.0.0.1:8888',
        created_at: new Date().toISOString(),
      },
    ];
  },

  resetAllProgress: async (): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.resetAllProgress();
    localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
    const profiles = getLocalProfiles();
    if (profiles.length > 0) {
      profiles[0].total_xp = 0;
      saveLocalProfiles(profiles);
    }
  },

  openExternalUrl: async (targetUrl: string): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.openExternalUrl(targetUrl);
    window.open(targetUrl, '_blank');
  },

  getMongoStatus: async () => {
    if (window.ctfAPI && window.ctfAPI.getMongoStatus) {
      return window.ctfAPI.getMongoStatus();
    }
    const savedUri = localStorage.getItem('mock_mongo_uri');
    return {
      connected: !!savedUri,
      uri: savedUri || '',
      maskedUri: savedUri ? savedUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:••••••••@') : '',
      database: 'ctf_training',
      error: null,
    };
  },

  connectMongo: async (uri: string) => {
    if (window.ctfAPI && window.ctfAPI.connectMongo) {
      return window.ctfAPI.connectMongo(uri);
    }
    localStorage.setItem('mock_mongo_uri', uri);
    return { success: true };
  },

  disconnectMongo: async () => {
    if (window.ctfAPI && window.ctfAPI.disconnectMongo) {
      return window.ctfAPI.disconnectMongo();
    }
    localStorage.removeItem('mock_mongo_uri');
    return {
      connected: false,
      database: 'ctf_training',
      error: null,
    };
  },
};
