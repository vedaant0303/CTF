import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseManager } from '../database/db';
import { MongoManager } from '../database/mongo';

export class LoggerService {
  private db: DatabaseManager;
  private mongo: MongoManager | null;
  private logFilePath: string;

  constructor(db: DatabaseManager, logDir: string, mongo: MongoManager | null = null) {
    this.db = db;
    this.mongo = mongo;
    this.logFilePath = path.join(logDir, 'ctf_activity.log');
  }

  public setMongoManager(mongo: MongoManager): void {
    this.mongo = mongo;
  }

  public log(eventType: string, message: string, profileId?: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const detailsJson = details ? JSON.stringify(details) : null;

    // 1. Insert into SQLite table
    try {
      this.db.run(
        'INSERT INTO activity_logs (id, profile_id, event_type, message, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, profileId || null, eventType, message, detailsJson, timestamp]
      );
    } catch (err) {
      console.error('[LoggerService] Failed to insert log to DB:', err);
    }

    // 2. Append to text log file
    const logLine = `[${timestamp}] [${eventType}] ${profileId ? `(User: ${profileId}) ` : ''}${message}${details ? ' ' + detailsJson : ''}\n`;
    try {
      fs.appendFileSync(this.logFilePath, logLine);
    } catch {
      // ignore
    }

    // 3. Sync to MongoDB Cloud asynchronously
    if (this.mongo) {
      this.mongo.syncActivityLog({
        id,
        profile_id: profileId || null,
        event_type: eventType,
        message,
        details_json: detailsJson,
        created_at: timestamp,
      }).catch(() => {});
    }
  }

  public getRecentLogs(limit: number = 50): any[] {
    return this.db.all('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?', [limit]);
  }
}
