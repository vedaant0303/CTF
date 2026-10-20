import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env if present in root
dotenv.config();

export interface MongoStatus {
  connected: boolean;
  uri?: string;
  maskedUri?: string;
  database: string;
  error?: string | null;
}

export class MongoManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private currentUri: string = '';
  private dbName: string = 'ctf_training';
  private configPath: string;
  private lastError: string | null = null;

  constructor(userDataDir: string) {
    this.configPath = path.join(userDataDir, 'mongo_config.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.uri) this.currentUri = parsed.uri;
        if (parsed.dbName) this.dbName = parsed.dbName;
      }
    } catch (err) {
      console.warn('[MongoDB] Could not load mongo_config.json:', err);
    }

    // Fallback to process.env if not set in config file
    if (!this.currentUri && process.env.MONGODB_URI) {
      this.currentUri = process.env.MONGODB_URI.trim();
    }
    if (process.env.MONGODB_DB_NAME) {
      this.dbName = process.env.MONGODB_DB_NAME.trim();
    }
  }

  public saveConfig(uri: string, dbName: string = 'ctf_training'): void {
    this.currentUri = uri.trim();
    this.dbName = dbName.trim() || 'ctf_training';
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify({ uri: this.currentUri, dbName: this.dbName, updatedAt: new Date().toISOString() }, null, 2),
        'utf8'
      );
    } catch (err) {
      console.error('[MongoDB] Failed to save mongo_config.json:', err);
    }
  }

  public getMaskedUri(): string {
    if (!this.currentUri) return '';
    try {
      return this.currentUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:••••••••@');
    } catch {
      return 'mongodb+srv://••••••••';
    }
  }

  public getStatus(): MongoStatus {
    return {
      connected: this.isConnected,
      uri: this.currentUri,
      maskedUri: this.getMaskedUri(),
      database: this.dbName,
      error: this.lastError,
    };
  }

  public async connect(overrideUri?: string): Promise<{ success: boolean; error?: string }> {
    const uriToUse = overrideUri ? overrideUri.trim() : this.currentUri;

    if (!uriToUse) {
      this.isConnected = false;
      this.lastError = 'No MongoDB URI configured. Provide a connection string to connect to MongoDB Atlas.';
      return { success: false, error: this.lastError };
    }

    try {
      console.log(`[MongoDB] Connecting to MongoDB Atlas cluster...`);
      // Close any existing client
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore
        }
      }

      this.client = new MongoClient(uriToUse, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await this.client.connect();
      // Ping the server
      await this.client.db('admin').command({ ping: 1 });

      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      this.currentUri = uriToUse;
      this.lastError = null;

      if (overrideUri) {
        this.saveConfig(overrideUri, this.dbName);
      }

      console.log(`[MongoDB] Successfully connected to MongoDB Atlas! Database: ${this.dbName}`);

      // Initialize collections and indexes asynchronously
      this.initCollections().catch((err) => {
        console.warn('[MongoDB] Error setting up indexes:', err);
      });

      return { success: true };
    } catch (err: any) {
      console.error('[MongoDB] Connection failed:', err.message || err);
      this.isConnected = false;
      this.lastError = err.message || 'Failed to connect to MongoDB cluster';
      return { success: false, error: this.lastError || undefined };
    }
  }

  private async initCollections(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.collection('profiles').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('user_progress').createIndex({ profile_id: 1, challenge_id: 1 }, { unique: true });
      await this.db.collection('challenges').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('activity_logs').createIndex({ created_at: -1 });
      await this.db.collection('badges').createIndex({ id: 1 }, { unique: true });
      console.log('[MongoDB] Collections & indexes verified.');
    } catch (err) {
      console.warn('[MongoDB] Index creation note:', err);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // ignore
      }
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
  }

  // --- Profile Sync ---
  public async syncProfile(profile: any): Promise<void> {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('profiles').updateOne(
        { id: profile.id },
        { $set: { ...profile, synced_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[MongoDB] Failed to sync profile to cloud:', err);
    }
  }

  public async getProfilesFromCloud(): Promise<any[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      return await this.db.collection('profiles').find({}).sort({ updated_at: -1 }).toArray();
    } catch (err) {
      console.warn('[MongoDB] Failed to fetch profiles from cloud:', err);
      return [];
    }
  }

  public async deleteProfileFromCloud(profileId: string): Promise<void> {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('profiles').deleteOne({ id: profileId });
      await this.db.collection('user_progress').deleteMany({ profile_id: profileId });
      await this.db.collection('badges').deleteMany({ profile_id: profileId });
    } catch (err) {
      console.warn('[MongoDB] Failed to delete profile in cloud:', err);
    }
  }

  // --- User Progress Sync ---
  public async syncProgress(progress: any): Promise<void> {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('user_progress').updateOne(
        { profile_id: progress.profile_id, challenge_id: progress.challenge_id },
        { $set: { ...progress, synced_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[MongoDB] Failed to sync progress to cloud:', err);
    }
  }

  public async getProgressFromCloud(profileId: string): Promise<any[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      return await this.db.collection('user_progress').find({ profile_id: profileId }).toArray();
    } catch (err) {
      console.warn('[MongoDB] Failed to get progress from cloud:', err);
      return [];
    }
  }

  // --- Badges Sync ---
  public async syncBadge(badge: any): Promise<void> {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('badges').updateOne(
        { id: badge.id },
        { $set: { ...badge, synced_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[MongoDB] Failed to sync badge to cloud:', err);
    }
  }

  // --- Activity Logs Sync ---
  public async syncActivityLog(log: any): Promise<void> {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('activity_logs').insertOne({
        ...log,
        synced_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[MongoDB] Failed to sync activity log to cloud:', err);
    }
  }

  // --- Challenges Sync ---
  public async syncChallenges(challenges: any[]): Promise<void> {
    if (!this.isConnected || !this.db || challenges.length === 0) return;
    try {
      const ops = challenges.map((ch) => ({
        updateOne: {
          filter: { id: ch.id },
          update: { $set: ch },
          upsert: true,
        },
      }));
      await this.db.collection('challenges').bulkWrite(ops);
      console.log(`[MongoDB] Synced ${challenges.length} challenges to cloud MongoDB.`);
    } catch (err) {
      console.warn('[MongoDB] Failed to sync challenges to cloud:', err);
    }
  }
}
