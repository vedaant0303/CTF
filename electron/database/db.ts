import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { SEED_CHALLENGES, SEED_BADGES } from './seed';

export class DatabaseManager {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;

  constructor(storageDir: string, dbName: string = 'ctf_training.sqlite') {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.dbPath = path.join(storageDir, dbName);
  }

  public async init(): Promise<void> {
    // Locate wasm binary
    const possibleWasmPaths = [
      path.join(__dirname, 'sql-wasm.wasm'),
      path.join(__dirname, '../dist-electron/sql-wasm.wasm'),
      path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
      path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    ];

    let wasmBinary: Buffer | undefined;
    for (const p of possibleWasmPaths) {
      if (fs.existsSync(p)) {
        wasmBinary = fs.readFileSync(p);
        break;
      }
    }

    const SQL = await initSqlJs(wasmBinary ? { wasmBinary: new Uint8Array(wasmBinary).buffer as ArrayBuffer } : {});

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
        console.log(`[Database] Loaded existing database from ${this.dbPath}`);
      } catch (err) {
        console.error('[Database] Failed to read existing db file, creating fresh database:', err);
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
      console.log(`[Database] Created fresh in-memory database, persisting to ${this.dbPath}`);
    }

    this.createSchema();
    this.seedDefaults();
    this.persist();
  }

  private createSchema(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar TEXT,
        skill_level TEXT,
        learning_path TEXT,
        total_xp INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        order_index INTEGER NOT NULL,
        track TEXT DEFAULT 'meridian',
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        estimated_time TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        description TEXT,
        learning_objectives TEXT,
        prerequisites TEXT,
        safety_notes TEXT,
        target_url TEXT,
        flag_plain TEXT NOT NULL,
        hint_1 TEXT,
        hint_2 TEXT,
        hint_3 TEXT,
        remediation_summary TEXT,
        remediation_diff TEXT,
        quiz_question TEXT,
        quiz_options TEXT,
        quiz_answer TEXT,
        unlocked INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        profile_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        status TEXT NOT NULL,
        hints_revealed INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        score_awarded INTEGER DEFAULT 0,
        time_spent_seconds INTEGER DEFAULT 0,
        completed_at TEXT,
        PRIMARY KEY (profile_id, challenge_id)
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        profile_id TEXT,
        event_type TEXT NOT NULL,
        message TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        profile_id TEXT,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlocked_at TEXT
      );
    `);
  }

  private seedDefaults(): void {
    if (!this.db) return;

    console.log('[Database] Syncing challenges (Meridian & picoCTF curriculum)...');
    try {
      this.db.exec("ALTER TABLE challenges ADD COLUMN track TEXT DEFAULT 'meridian';");
    } catch {
      // Column already exists
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO challenges (
        id, order_index, track, title, category, difficulty, estimated_time, xp_reward,
        description, learning_objectives, prerequisites, safety_notes, target_url,
        flag_plain, hint_1, hint_2, hint_3, remediation_summary, remediation_diff,
        quiz_question, quiz_options, quiz_answer, unlocked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ch of SEED_CHALLENGES) {
      stmt.run([
        ch.id,
        ch.order_index,
        ch.track || 'meridian',
        ch.title,
        ch.category,
        ch.difficulty,
        ch.estimated_time,
        ch.xp_reward,
        ch.description,
        ch.learning_objectives,
        ch.prerequisites,
        ch.safety_notes,
        ch.target_url,
        ch.flag_plain,
        ch.hint_1,
        ch.hint_2,
        ch.hint_3,
        ch.remediation_summary,
        ch.remediation_diff,
        ch.quiz_question,
        JSON.stringify(ch.quiz_options),
        ch.quiz_answer,
        1 // All challenges unlocked so anyone can immediately perform any attack
      ]);
    }
    stmt.free();

    // Ensure all existing challenges in database are also unlocked
    this.db.run('UPDATE challenges SET unlocked = 1;');
    this.persist();
  }

  public persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[Database] Failed to write database file:', err);
    }
  }

  public getDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('Database is not initialized. Call init() first.');
    }
    return this.db;
  }

  // Helper query methods
  public all<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  public get<T = any>(sql: string, params: any[] = []): T | null {
    const list = this.all<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  public run(sql: string, params: any[] = []): void {
    if (!this.db) return;
    this.db.run(sql, params);
    this.persist();
  }
}
