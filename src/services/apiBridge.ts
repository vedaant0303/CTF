import { Challenge, DashboardStats, UserProfile, VmDiagnostics, VmStatus, Badge, ActivityLog, FlagSubmitResult } from '../types';

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
    return [];
  },

  getChallengeById: async (id: string): Promise<Challenge | null> => {
    if (window.ctfAPI) return window.ctfAPI.getChallengeById(id);
    return null;
  },

  startChallenge: async (id: string): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.startChallenge(id);
  },

  unlockHint: async (id: string, level: number): Promise<{ success: boolean; hintText: string; penaltyXp: number }> => {
    if (window.ctfAPI) return window.ctfAPI.unlockHint(id, level);
    return { success: true, hintText: 'Sample hint text', penaltyXp: 10 };
  },

  submitFlag: async (id: string, flag: string, timeSpentSeconds: number): Promise<FlagSubmitResult> => {
    if (window.ctfAPI) return window.ctfAPI.submitFlag(id, flag, timeSpentSeconds);
    
    // Fallback when previewing outside Electron IPC:
    const trimmed = (flag || '').trim();
    const flags: Record<string, string> = {
      'ch-sqli-01': 'flag{data_not_instructions}',
      'ch-info-02': 'flag{debug_notes_reveal_secrets}',
      'ch-auth-03': 'flag{auth_boundary_bypassed}',
      'ch-idor-04': 'flag{idor_ticket_exposed_991}',
      'ch-upload-05': 'flag{file_upload_shell_exec}',
      'ch-privesc-06': 'flag{privesc_root_access_granted}',
      'ch-dos-07': 'flag{rate_limiting_protects_service}',
    };

    const targetFlag = flags[id] || 'flag{data_not_instructions}';
    if (trimmed === targetFlag || trimmed === 'flag{data_not_instructions}') {
      return {
        success: true,
        message: 'Congratulations! Flag captured successfully.',
        xpEarned: 100,
        nextChallengeId: 'ch-info-02',
        remediationSummary: 'Unsafe input handling can change a database request and expose private areas. Parameterized queries protect the boundary between data and instructions.',
      };
    }
    return { success: false, message: 'Not quite. Check the full flag in the member note and try again. Your progress is saved.' };
  },

  importChallenges: async (challenges: any[]): Promise<{ count: number; imported: Challenge[] }> => {
    if (window.ctfAPI?.importChallenges) {
      return window.ctfAPI.importChallenges(challenges);
    }
    return { count: 0, imported: [] };
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
    return null;
  },

  getAllProfiles: async (): Promise<UserProfile[]> => {
    if (window.ctfAPI) return window.ctfAPI.getAllProfiles();
    return [];
  },

  switchProfile: async (profileId: string): Promise<UserProfile> => {
    if (window.ctfAPI) return window.ctfAPI.switchProfile(profileId);
    throw new Error('IPC not available');
  },

  deleteProfile: async (profileId: string): Promise<boolean> => {
    if (window.ctfAPI) return window.ctfAPI.deleteProfile(profileId);
    return true;
  },

  createProfile: async (data: { username: string; displayName: string; avatar: string }): Promise<UserProfile> => {
    if (window.ctfAPI) return window.ctfAPI.createProfile(data);
    return {
      id: 'local-demo',
      username: data.username,
      display_name: data.displayName,
      avatar: data.avatar,
      skill_level: 'Apprentice Security Analyst',
      learning_path: 'Web Exploitation to Host Compromise',
      total_xp: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  submitAssessment: async (answers: any) => {
    if (window.ctfAPI) return window.ctfAPI.submitAssessment(answers);
    return {
      skillLevel: 'Apprentice Security Analyst',
      learningPath: 'Web Exploitation to Host Compromise (Beginner Chained Track)',
      score: 50,
    };
  },

  getDashboardStats: async (): Promise<DashboardStats | null> => {
    if (window.ctfAPI) return window.ctfAPI.getDashboardStats();
    return {
      totalXp: 100,
      challengesCompleted: 1,
      totalChallenges: 7,
      completionPercentage: 14,
      badgesEarned: 1,
      totalBadges: 6,
      totalTimeSpentMinutes: 12,
      rank: 'Apprentice Security Analyst',
      learningPath: 'Web Exploitation to Host Compromise',
    };
  },

  getBadges: async (): Promise<Badge[]> => {
    if (window.ctfAPI) return window.ctfAPI.getBadges();
    return [];
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    if (window.ctfAPI) return window.ctfAPI.getActivityLogs();
    return [];
  },

  resetAllProgress: async (): Promise<void> => {
    if (window.ctfAPI) return window.ctfAPI.resetAllProgress();
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
