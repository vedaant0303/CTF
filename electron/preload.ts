import { contextBridge, ipcRenderer } from 'electron';

export interface CtfApi {
  // VM and Lab Controls
  getVmStatus: () => Promise<any>;
  startLab: () => Promise<boolean>;
  stopLab: () => Promise<void>;
  resetLab: () => Promise<boolean>;
  getVmDiagnostics: () => Promise<any>;
  onVmStateChange: (callback: (status: any) => void) => () => void;

  // Challenges
  getChallenges: () => Promise<any[]>;
  getChallengeById: (challengeId: string) => Promise<any>;
  startChallenge: (challengeId: string) => Promise<void>;
  unlockHint: (challengeId: string, hintLevel: number) => Promise<any>;
  submitFlag: (challengeId: string, flag: string, timeSpentSeconds: number) => Promise<any>;
  importChallenges: (challenges: any[]) => Promise<any>;
  fetchGithubChallenges: (rawUrl: string) => Promise<any>;

  // Profiles & Assessment
  getActiveProfile: () => Promise<any>;
  getAllProfiles: () => Promise<any[]>;
  switchProfile: (profileId: string) => Promise<any>;
  deleteProfile: (profileId: string) => Promise<boolean>;
  createProfile: (data: { username: string; displayName: string; avatar: string }) => Promise<any>;
  submitAssessment: (answers: any) => Promise<any>;

  // Dashboard & Logs
  getDashboardStats: () => Promise<any>;
  getBadges: () => Promise<any[]>;
  getActivityLogs: () => Promise<any[]>;
  resetAllProgress: () => Promise<void>;

  // System
  openExternalUrl: (url: string) => Promise<void>;

  // Cloud Database (MongoDB Atlas)
  getMongoStatus: () => Promise<{ connected: boolean; uri?: string; maskedUri?: string; database: string; error?: string | null }>;
  connectMongo: (uri: string) => Promise<{ success: boolean; error?: string }>;
  disconnectMongo: () => Promise<any>;
}

const api: CtfApi = {
  getVmStatus: () => ipcRenderer.invoke('vm:getStatus'),
  startLab: () => ipcRenderer.invoke('vm:start'),
  stopLab: () => ipcRenderer.invoke('vm:stop'),
  resetLab: () => ipcRenderer.invoke('vm:reset'),
  getVmDiagnostics: () => ipcRenderer.invoke('vm:getDiagnostics'),
  onVmStateChange: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('vm:stateChanged', handler);
    return () => ipcRenderer.removeListener('vm:stateChanged', handler);
  },

  getChallenges: () => ipcRenderer.invoke('challenges:getAll'),
  getChallengeById: (challengeId: string) => ipcRenderer.invoke('challenges:getById', challengeId),
  startChallenge: (challengeId: string) => ipcRenderer.invoke('challenges:start', challengeId),
  unlockHint: (challengeId: string, hintLevel: number) => ipcRenderer.invoke('challenges:unlockHint', challengeId, hintLevel),
  submitFlag: (challengeId: string, flag: string, timeSpentSeconds: number) =>
    ipcRenderer.invoke('challenges:submitFlag', challengeId, flag, timeSpentSeconds),
  importChallenges: (challenges: any[]) => ipcRenderer.invoke('challenges:import', challenges),
  fetchGithubChallenges: (rawUrl: string) => ipcRenderer.invoke('challenges:fetchGithub', rawUrl),

  getActiveProfile: () => ipcRenderer.invoke('profile:getActive'),
  getAllProfiles: () => ipcRenderer.invoke('profile:getAll'),
  switchProfile: (profileId: string) => ipcRenderer.invoke('profile:switch', profileId),
  deleteProfile: (profileId: string) => ipcRenderer.invoke('profile:delete', profileId),
  createProfile: (data: { username: string; displayName: string; avatar: string }) =>
    ipcRenderer.invoke('profile:create', data),
  submitAssessment: (answers: any) => ipcRenderer.invoke('profile:submitAssessment', answers),

  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getBadges: () => ipcRenderer.invoke('dashboard:getBadges'),
  getActivityLogs: () => ipcRenderer.invoke('dashboard:getLogs'),
  resetAllProgress: () => ipcRenderer.invoke('dashboard:resetProgress'),

  openExternalUrl: (url: string) => ipcRenderer.invoke('system:openExternal', url),

  getMongoStatus: () => ipcRenderer.invoke('db:getMongoStatus'),
  connectMongo: (uri: string) => ipcRenderer.invoke('db:connectMongo', uri),
  disconnectMongo: () => ipcRenderer.invoke('db:disconnectMongo'),
};

contextBridge.exposeInMainWorld('ctfAPI', api);
