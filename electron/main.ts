import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from './database/db';
import { MongoManager } from './database/mongo';
import { LoggerService } from './services/loggerService';
import { ProfileService } from './services/profileService';
import { ChallengeService } from './services/challengeService';
import { VmController } from './vm/vmController';

let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;
let mongoManager: MongoManager;
let loggerService: LoggerService;
let profileService: ProfileService;
let challengeService: ChallengeService;
let vmController: VmController;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

async function initializeServices() {
  const userDataDir = app.getPath('userData');
  console.log(`[Main] Initializing CTF Application. User Data Directory: ${userDataDir}`);

  // 1. Database (Local SQLite)
  dbManager = new DatabaseManager(userDataDir);
  await dbManager.init();

  // 2. Cloud Database Manager (MongoDB Atlas)
  mongoManager = new MongoManager(userDataDir);

  // 3. Logger
  loggerService = new LoggerService(dbManager, userDataDir, mongoManager);
  loggerService.log('APP_LAUNCH', 'CTF Training Lab software launched');

  // 4. Profile & Challenge Services
  profileService = new ProfileService(dbManager, loggerService, mongoManager);
  challengeService = new ChallengeService(dbManager, loggerService, profileService, mongoManager);

  // Attempt initial MongoDB connection if URI configured
  mongoManager.connect().then(async (res) => {
    if (res.success) {
      console.log('[Main] MongoDB Atlas connection active. Syncing curriculum to cloud...');
      const challenges = challengeService.getChallenges();
      await mongoManager.syncChallenges(challenges);
      const active = profileService.getActiveProfile();
      if (active) await mongoManager.syncProfile(active);
    }
  }).catch((err) => {
    console.warn('[Main] MongoDB initial connect note:', err.message);
  });

  // 4. VM Controller (Auto-start isolated sandbox server so target shop is always accessible)
  const appRootDir = app.getAppPath();
  vmController = new VmController(appRootDir);
  await vmController.init();
  await vmController.start();

  // Forward VM state changes to renderer
  vmController.on('stateChange', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('vm:stateChanged', status);
    }
  });

  registerIpcHandlers();
}

function registerIpcHandlers() {
  // --- VM Controls ---
  ipcMain.handle('vm:getStatus', () => vmController.getStatus());
  ipcMain.handle('vm:start', async () => {
    const success = await vmController.start();
    loggerService.log('VM_START_ACTION', `Lab start requested: result=${success}`);
    return success;
  });
  ipcMain.handle('vm:stop', async () => {
    await vmController.stop();
    loggerService.log('VM_STOP_ACTION', 'Lab stopped by user');
  });
  ipcMain.handle('vm:reset', async () => {
    const success = await vmController.reset();
    loggerService.log('VM_RESET_ACTION', `Lab snapshot reset requested: result=${success}`);
    return success;
  });
  ipcMain.handle('vm:getDiagnostics', () => vmController.getDiagnostics());

  // --- Challenges ---
  ipcMain.handle('challenges:getAll', () => {
    const active = profileService.getActiveProfile();
    return challengeService.getChallenges(active?.id);
  });
  ipcMain.handle('challenges:getById', (_e, challengeId: string) => {
    const active = profileService.getActiveProfile();
    return challengeService.getChallengeById(challengeId, active?.id);
  });
  ipcMain.handle('challenges:start', (_e, challengeId: string) => {
    const active = profileService.getActiveProfile();
    if (active) challengeService.startChallenge(challengeId, active.id);
  });
  ipcMain.handle('challenges:unlockHint', (_e, challengeId: string, hintLevel: number) => {
    const active = profileService.getActiveProfile();
    if (!active) return { success: false, hintText: '', penaltyXp: 0 };
    return challengeService.unlockHint(challengeId, active.id, hintLevel);
  });
  ipcMain.handle('challenges:submitFlag', (_e, challengeId: string, flag: string, timeSpentSeconds: number) => {
    let active = profileService.getActiveProfile();
    if (!active) {
      active = profileService.createProfile('alex', 'Alex Lee', 'Shield');
    }
    return challengeService.submitFlag(challengeId || 'ch-sqli-01', active.id, flag, timeSpentSeconds);
  });
  ipcMain.handle('challenges:import', (_e, challenges: any[]) => {
    return challengeService.importChallenges(challenges);
  });
  ipcMain.handle('challenges:fetchGithub', async (_e, rawUrl: string) => {
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // --- Profile & Assessment ---
  ipcMain.handle('profile:getActive', () => profileService.getActiveProfile());
  ipcMain.handle('profile:getAll', () => profileService.getAllProfiles());
  ipcMain.handle('profile:switch', (_e, profileId: string) => profileService.switchProfile(profileId));
  ipcMain.handle('profile:delete', (_e, profileId: string) => profileService.deleteProfile(profileId));
  ipcMain.handle('profile:create', (_e, data: { username: string; displayName: string; avatar: string }) => {
    return profileService.createProfile(data.username, data.displayName, data.avatar);
  });
  ipcMain.handle('profile:submitAssessment', (_e, answers: any) => {
    const active = profileService.getActiveProfile();
    if (!active) return null;
    return profileService.evaluateAssessment(active.id, answers);
  });

  // --- Dashboard & Analytics ---
  ipcMain.handle('dashboard:getStats', () => {
    const active = profileService.getActiveProfile();
    if (!active) return null;
    return challengeService.getDashboardStats(active.id);
  });
  ipcMain.handle('dashboard:getBadges', () => {
    const active = profileService.getActiveProfile();
    if (!active) return [];
    return challengeService.getBadges(active.id);
  });
  ipcMain.handle('dashboard:getLogs', () => {
    return loggerService.getRecentLogs(60);
  });
  ipcMain.handle('dashboard:resetProgress', () => {
    const active = profileService.getActiveProfile();
    if (active) {
      challengeService.resetProgress(active.id);
      vmController.reset();
    }
  });

  // --- System ---
  ipcMain.handle('system:openExternal', (_e, targetUrl: string) => {
    // Only allow opening safe http/https URLs or local lab URLs
    if (targetUrl.startsWith('http://127.0.0.1') || targetUrl.startsWith('http://localhost') || targetUrl.startsWith('https://')) {
      shell.openExternal(targetUrl);
    }
  });

  // --- MongoDB Cloud Database ---
  ipcMain.handle('db:getMongoStatus', () => mongoManager.getStatus());

  ipcMain.handle('db:connectMongo', async (_e, uri: string) => {
    const res = await mongoManager.connect(uri);
    if (res.success) {
      loggerService.log('MONGODB_CONNECTED', 'Successfully connected to MongoDB Atlas Cloud');
      // Sync local profiles to cloud
      const profiles = profileService.getAllProfiles();
      for (const p of profiles) {
        await mongoManager.syncProfile(p);
      }
      const challenges = challengeService.getChallenges();
      await mongoManager.syncChallenges(challenges);
    }
    return res;
  });

  ipcMain.handle('db:disconnectMongo', async () => {
    await mongoManager.disconnect();
    loggerService.log('MONGODB_DISCONNECTED', 'Disconnected from MongoDB Cloud. Operating in local mode.');
    return mongoManager.getStatus();
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    title: 'CTF-Style Vulnerable Machine Lab',
    backgroundColor: '#f8fafc',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  // Prevent navigation outside isolated application window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:8888')) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });

  if (isDev && devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (vmController) {
    await vmController.stop();
  }
  if (mongoManager) {
    await mongoManager.disconnect();
  }
  if (dbManager) {
    dbManager.persist();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
