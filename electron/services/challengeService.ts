import crypto from 'crypto';
import { DatabaseManager } from '../database/db';
import { LoggerService } from './loggerService';
import { ProfileService } from './profileService';
import { SEED_BADGES } from '../database/seed';
import { MongoManager } from '../database/mongo';

export interface ChallengeDto {
  id: string;
  order_index: number;
  track?: string;
  title: string;
  category: string;
  difficulty: string;
  estimated_time: string;
  xp_reward: number;
  description: string;
  learning_objectives: string;
  prerequisites: string;
  safety_notes: string;
  target_url: string;
  unlocked: boolean;
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

export class ChallengeService {
  private db: DatabaseManager;
  private logger: LoggerService;
  private profileService: ProfileService;
  private mongo: MongoManager | null = null;

  constructor(db: DatabaseManager, logger: LoggerService, profileService: ProfileService, mongo: MongoManager | null = null) {
    this.db = db;
    this.logger = logger;
    this.profileService = profileService;
    this.mongo = mongo;
  }

  public setMongoManager(mongo: MongoManager): void {
    this.mongo = mongo;
  }

  public getChallenges(profileId?: string): ChallengeDto[] {
    const challenges = this.db.all('SELECT * FROM challenges ORDER BY order_index ASC');

    const progressMap = new Map<string, any>();
    if (profileId) {
      const progressList = this.db.all('SELECT * FROM user_progress WHERE profile_id = ?', [profileId]);
      for (const p of progressList) {
        progressMap.set(p.challenge_id, p);
      }
    }

    return challenges.map((ch) => {
      const prog = progressMap.get(ch.id);
      const isCompleted = prog?.status === 'completed';
      const hintsRevealed = prog?.hints_revealed || 0;

      return {
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
        unlocked: ch.unlocked === 1,
        status: prog?.status || 'not_started',
        hints_revealed: hintsRevealed,
        attempts: prog?.attempts || 0,
        score_awarded: prog?.score_awarded || 0,
        time_spent_seconds: prog?.time_spent_seconds || 0,
        completed_at: prog?.completed_at || null,
        // Only expose hints that have been unlocked
        hint_1: hintsRevealed >= 1 ? ch.hint_1 : undefined,
        hint_2: hintsRevealed >= 2 ? ch.hint_2 : undefined,
        hint_3: hintsRevealed >= 3 ? ch.hint_3 : undefined,
      };
    });
  }

  public getChallengeById(challengeId: string, profileId?: string): ChallengeDto | null {
    const ch = this.db.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!ch) return null;

    let prog = null;
    if (profileId) {
      prog = this.db.get('SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?', [profileId, challengeId]);
    }

    const hintsRevealed = prog?.hints_revealed || 0;
    let quizOptions: string[] = [];
    try {
      quizOptions = JSON.parse(ch.quiz_options || '[]');
    } catch {
      quizOptions = [];
    }

    return {
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
      unlocked: ch.unlocked === 1,
      status: prog?.status || 'not_started',
      hints_revealed: hintsRevealed,
      attempts: prog?.attempts || 0,
      score_awarded: prog?.score_awarded || 0,
      time_spent_seconds: prog?.time_spent_seconds || 0,
      completed_at: prog?.completed_at || null,
      hint_1: hintsRevealed >= 1 ? ch.hint_1 : undefined,
      hint_2: hintsRevealed >= 2 ? ch.hint_2 : undefined,
      hint_3: hintsRevealed >= 3 ? ch.hint_3 : undefined,
      remediation_summary: ch.remediation_summary,
      remediation_diff: ch.remediation_diff,
      quiz_question: ch.quiz_question,
      quiz_options: quizOptions,
      quiz_answer: ch.quiz_answer,
    };
  }

  public startChallenge(challengeId: string, profileId: string): void {
    const existing = this.db.get(
      'SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?',
      [profileId, challengeId]
    );

    if (!existing) {
      this.db.run(
        'INSERT INTO user_progress (profile_id, challenge_id, status, hints_revealed, attempts, score_awarded, time_spent_seconds) VALUES (?, ?, ?, 0, 0, 0, 0)',
        [profileId, challengeId, 'in_progress']
      );
    } else if (existing.status === 'not_started') {
      this.db.run(
        'UPDATE user_progress SET status = ? WHERE profile_id = ? AND challenge_id = ?',
        ['in_progress', profileId, challengeId]
      );
    }

    this.logger.log('CHALLENGE_STARTED', `Started challenge ${challengeId}`, profileId);
  }

  public unlockHint(challengeId: string, profileId: string, hintLevel: number): { success: boolean; hintText: string; penaltyXp: number } {
    const ch = this.db.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!ch) return { success: false, hintText: '', penaltyXp: 0 };

    let prog = this.db.get(
      'SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?',
      [profileId, challengeId]
    );

    if (!prog) {
      this.startChallenge(challengeId, profileId);
      prog = this.db.get('SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?', [profileId, challengeId]);
    }

    const currentLevel = prog?.hints_revealed || 0;
    const newLevel = Math.max(currentLevel, Math.min(hintLevel, 3));

    this.db.run(
      'UPDATE user_progress SET hints_revealed = ? WHERE profile_id = ? AND challenge_id = ?',
      [newLevel, profileId, challengeId]
    );

    let hintText = '';
    let penaltyXp = 0;
    if (newLevel === 1) {
      hintText = ch.hint_1;
      penaltyXp = 10;
    } else if (newLevel === 2) {
      hintText = ch.hint_2;
      penaltyXp = 20;
    } else {
      hintText = ch.hint_3;
      penaltyXp = 30;
    }

    this.logger.log('HINT_UNLOCKED', `Unlocked Hint Level ${newLevel} for ${ch.title}`, profileId, { hintLevel: newLevel });

    if (this.mongo) {
      const updatedProg = this.db.get('SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?', [profileId, challengeId]);
      if (updatedProg) this.mongo.syncProgress(updatedProg).catch(() => {});
    }

    return { success: true, hintText, penaltyXp };
  }

  public submitFlag(challengeId: string, profileId: string, submittedFlag: string, timeSpentSeconds: number = 0): {
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
  } {
    const ch = this.db.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!ch) return { success: false, message: 'Challenge not found.' };

    let prog = this.db.get(
      'SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?',
      [profileId, challengeId]
    );

    if (!prog) {
      this.startChallenge(challengeId, profileId);
      prog = this.db.get('SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?', [profileId, challengeId]);
    }

    const currentAttempts = (prog?.attempts || 0) + 1;
    const trimmedInput = (submittedFlag || '').trim();
    const correctFlag = (ch.flag_plain || '').trim();

    // Constant-time timing safe check
    const isMatch = this.timingSafeCheck(trimmedInput, correctFlag);

    if (!isMatch) {
      this.db.run(
        'UPDATE user_progress SET attempts = ?, time_spent_seconds = time_spent_seconds + ? WHERE profile_id = ? AND challenge_id = ?',
        [currentAttempts, timeSpentSeconds, profileId, challengeId]
      );

      this.logger.log('FLAG_SUBMITTED_INCORRECT', `Incorrect flag submitted for ${ch.title} (Attempt ${currentAttempts})`, profileId);

      return {
        success: false,
        message: 'Incorrect flag. Check your syntax, verify output, or reveal a progressive hint.',
        attempts: currentAttempts,
      };
    }

    // Correct flag captured!
    const hintsUsed = prog?.hints_revealed || 0;
    let xpDeduction = 0;
    if (hintsUsed === 1) xpDeduction = 10;
    else if (hintsUsed === 2) xpDeduction = 30; // 10 + 20
    else if (hintsUsed >= 3) xpDeduction = 60; // 10 + 20 + 30

    // Ensure user receives at least 40% base XP
    const minXp = Math.floor(ch.xp_reward * 0.4);
    const xpEarned = Math.max(minXp, ch.xp_reward - xpDeduction);

    const now = new Date().toISOString();
    this.db.run(
      'UPDATE user_progress SET status = ?, score_awarded = ?, attempts = ?, time_spent_seconds = time_spent_seconds + ?, completed_at = ? WHERE profile_id = ? AND challenge_id = ?',
      ['completed', xpEarned, currentAttempts, timeSpentSeconds, now, profileId, challengeId]
    );

    // Update Profile total XP
    this.profileService.updateXp(profileId, xpEarned);

    // Sync progress to MongoDB Cloud
    if (this.mongo) {
      const updatedProg = this.db.get('SELECT * FROM user_progress WHERE profile_id = ? AND challenge_id = ?', [profileId, challengeId]);
      if (updatedProg) this.mongo.syncProgress(updatedProg).catch(() => {});
    }

    // Unlock next challenge in the chain!
    const nextOrder = ch.order_index + 1;
    const nextChallenge = this.db.get('SELECT * FROM challenges WHERE order_index = ?', [nextOrder]);
    if (nextChallenge) {
      this.db.run('UPDATE challenges SET unlocked = 1 WHERE id = ?', [nextChallenge.id]);
    }

    // Check Badges
    this.checkAndAwardBadges(profileId, ch, hintsUsed);

    this.logger.log('FLAG_CAPTURED_SUCCESS', `FLAG CAPTURED! ${ch.title} completed. +${xpEarned} XP awarded.`, profileId, {
      xpEarned,
      hintsUsed,
      attempts: currentAttempts,
    });

    let quizOptions: string[] = [];
    try {
      quizOptions = JSON.parse(ch.quiz_options || '[]');
    } catch {
      quizOptions = [];
    }

    return {
      success: true,
      message: 'Congratulations! Flag captured successfully.',
      xpEarned,
      hintsUsed,
      attempts: currentAttempts,
      nextChallengeId: nextChallenge ? nextChallenge.id : null,
      remediationSummary: ch.remediation_summary,
      remediationDiff: ch.remediation_diff,
      quizQuestion: ch.quiz_question,
      quizOptions,
    };
  }

  private timingSafeCheck(a: string, b: string): boolean {
    const normA = (a || '').trim().toLowerCase();
    const normB = (b || '').trim().toLowerCase();
    if (normA.length !== normB.length) return false;
    const bufA = Buffer.from(normA, 'utf-8');
    const bufB = Buffer.from(normB, 'utf-8');
    return crypto.timingSafeEqual(bufA, bufB);
  }

  private checkAndAwardBadges(profileId: string, challenge: any, hintsUsed: number): void {
    const completedList = this.db.all(
      'SELECT * FROM user_progress WHERE profile_id = ? AND status = "completed"',
      [profileId]
    );
    const completedCount = completedList.length;

    // 1. FIRST_FLAG
    this.awardBadge(profileId, 'FIRST_FLAG');

    // 2. Specific challenges
    if (challenge.id === 'ch-sqli-01') {
      this.awardBadge(profileId, 'SQL_MASTER');
    }
    if (challenge.id === 'ch-auth-03') {
      this.awardBadge(profileId, 'AUTH_CRACKER');
    }

    // 3. CLEAN_RUN
    if (hintsUsed === 0) {
      this.awardBadge(profileId, 'CLEAN_RUN');
    }

    // 4. CHAIN_COMPLETE
    if (completedCount >= 7) {
      this.awardBadge(profileId, 'CHAIN_COMPLETE');
    }
  }

  private awardBadge(profileId: string, code: string): void {
    const existing = this.db.get('SELECT * FROM badges WHERE profile_id = ? AND code = ?', [profileId, code]);
    if (existing) return;

    const seed = SEED_BADGES.find((b) => b.code === code);
    if (!seed) return;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.run(
      'INSERT INTO badges (id, profile_id, code, title, description, icon, unlocked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, profileId, seed.code, seed.title, seed.description, seed.icon, now]
    );

    this.logger.log('BADGE_AWARDED', `Earned Badge: ${seed.title} (${seed.description})`, profileId);

    if (this.mongo) {
      this.mongo.syncBadge({ id, profile_id: profileId, code: seed.code, title: seed.title, description: seed.description, icon: seed.icon, unlocked_at: now }).catch(() => {});
    }
  }

  public getBadges(profileId: string): any[] {
    const awarded = this.db.all('SELECT * FROM badges WHERE profile_id = ?', [profileId]);
    const map = new Map<string, any>();
    for (const b of awarded) {
      map.set(b.code, b);
    }

    return SEED_BADGES.map((b) => {
      const isUnlocked = map.has(b.code);
      return {
        ...b,
        unlocked: isUnlocked,
        unlocked_at: isUnlocked ? map.get(b.code).unlocked_at : null,
      };
    });
  }

  public getDashboardStats(profileId: string) {
    const profile = this.profileService.getActiveProfile();
    const challenges = this.getChallenges(profileId);
    const completedChallenges = challenges.filter((c) => c.status === 'completed');
    const badges = this.getBadges(profileId);
    const unlockedBadges = badges.filter((b) => b.unlocked);

    let totalSeconds = 0;
    for (const c of challenges) {
      totalSeconds += c.time_spent_seconds || 0;
    }

    return {
      totalXp: profile?.total_xp || 0,
      challengesCompleted: completedChallenges.length,
      totalChallenges: challenges.length,
      completionPercentage: Math.round((completedChallenges.length / challenges.length) * 100),
      badgesEarned: unlockedBadges.length,
      totalBadges: badges.length,
      totalTimeSpentMinutes: Math.round(totalSeconds / 60),
      rank: profile?.skill_level || 'Apprentice Security Analyst',
      learningPath: profile?.learning_path || 'Web Exploitation to Host Compromise',
    };
  }

  public resetProgress(profileId: string): void {
    this.db.run('DELETE FROM user_progress WHERE profile_id = ?', [profileId]);
    this.db.run('DELETE FROM badges WHERE profile_id = ?', [profileId]);
    this.db.run('UPDATE profiles SET total_xp = 0 WHERE id = ?', [profileId]);
    this.db.run('UPDATE challenges SET unlocked = 1');
    this.logger.log('PROGRESS_RESET', 'User reset all lab progress to initial clean state', profileId);
  }

  public importChallenges(items: any[]): { count: number; imported: ChallengeDto[] } {
    if (!Array.isArray(items)) {
      items = [items];
    }

    const maxOrder = this.db.get<{ max_idx: number }>('SELECT MAX(order_index) as max_idx FROM challenges');
    let nextOrder = (maxOrder?.max_idx || 30) + 1;

    const importedIds: string[] = [];

    const stmt = this.db.getDb().prepare(`
      INSERT OR REPLACE INTO challenges (
        id, order_index, track, title, category, difficulty, estimated_time, xp_reward,
        description, learning_objectives, prerequisites, safety_notes, target_url,
        flag_plain, hint_1, hint_2, hint_3, remediation_summary, remediation_diff,
        quiz_question, quiz_options, quiz_answer, unlocked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const raw of items) {
      if (!raw || (!raw.title && !raw.name)) continue;

      const title = raw.title || raw.name || 'Imported Challenge';
      const id = raw.id || ('pico-imported-' + crypto.randomUUID().slice(0, 8));
      const track = raw.track || 'picoctf';
      const category = raw.category || 'Web Exploitation';
      const difficulty = raw.difficulty || 'Medium';
      const estimatedTime = raw.estimated_time || raw.time || '15 min';
      const xpReward = raw.xp_reward || raw.points || raw.xp || 150;
      const description = raw.description || 'Open-source community challenge imported from external source.';
      const learningObjectives = raw.learning_objectives || raw.objectives || 'Practice security analysis and methodology.';
      const prerequisites = raw.prerequisites || 'Basic understanding.';
      const safetyNotes = raw.safety_notes || 'Run in isolated local environment.';
      const targetUrl = raw.target_url || raw.url || 'http://127.0.0.1:8888/pico/inspector';
      const flagPlain = raw.flag_plain || raw.flag || 'picoCTF{community_flag_solved}';

      const hints = Array.isArray(raw.hints) ? raw.hints : [];
      const hint1 = raw.hint_1 || hints[0] || 'Carefully inspect the challenge details.';
      const hint2 = raw.hint_2 || hints[1] || 'Analyze inputs and examine data flows.';
      const hint3 = raw.hint_3 || hints[2] || 'Flags generally follow picoCTF{...} or flag{...}.';

      const remediationSummary = raw.remediation_summary || 'Sanitize input and enforce defensive controls.';
      const remediationDiff = raw.remediation_diff || '// Secure defensive coding implementation';
      const quizQuestion = raw.quiz_question || `What core security principle is tested in ${title}?`;
      const quizOptions = raw.quiz_options || ['Input Validation & Defensive Boundaries', 'Encryption Strength', 'Access Control', 'Traffic Isolation'];
      const quizAnswer = raw.quiz_answer || quizOptions[0];

      stmt.run([
        id,
        nextOrder++,
        track,
        title,
        category,
        difficulty,
        estimatedTime,
        xpReward,
        description,
        learningObjectives,
        prerequisites,
        safetyNotes,
        targetUrl,
        flagPlain,
        hint1,
        hint2,
        hint3,
        remediationSummary,
        remediationDiff,
        quizQuestion,
        JSON.stringify(quizOptions),
        quizAnswer
      ]);

      importedIds.push(id);
    }

    stmt.free();
    this.db.persist();

    const activeProfile = this.profileService.getActiveProfile();
    const importedChallenges = importedIds
      .map(id => this.getChallengeById(id, activeProfile?.id))
      .filter((c): c is ChallengeDto => c !== null);

    this.logger.log('CHALLENGES_IMPORTED', `Imported ${importedChallenges.length} challenges via open-source importer`);

    return {
      count: importedChallenges.length,
      imported: importedChallenges
    };
  }
}
