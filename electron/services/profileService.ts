import crypto from 'crypto';
import { DatabaseManager } from '../database/db';
import { LoggerService } from './loggerService';
import { MongoManager } from '../database/mongo';

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

export interface AssessmentAnswers {
  cyberExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  ctfExperience: 'first_time' | 'few' | 'regular';
  learningGoal: 'pentest' | 'web_sec' | 'cert' | 'defense';
  webKnowledge: 'basic' | 'moderate' | 'strong';
}

export class ProfileService {
  private db: DatabaseManager;
  private logger: LoggerService;
  private mongo: MongoManager | null = null;

  constructor(db: DatabaseManager, logger: LoggerService, mongo: MongoManager | null = null) {
    this.db = db;
    this.logger = logger;
    this.mongo = mongo;
  }

  public setMongoManager(mongo: MongoManager): void {
    this.mongo = mongo;
  }

  public getActiveProfile(): UserProfile | null {
    const existing = this.db.get<UserProfile>('SELECT * FROM profiles ORDER BY updated_at DESC LIMIT 1');
    if (existing) return existing;
    // Auto-create default profile for smooth out-of-the-box experience
    return this.createProfile('alex', 'Alex Lee', 'Shield');
  }

  public getAllProfiles(): UserProfile[] {
    const profiles = this.db.all<UserProfile>('SELECT * FROM profiles ORDER BY updated_at DESC');
    if (profiles.length === 0) {
      const def = this.getActiveProfile();
      return def ? [def] : [];
    }
    return profiles;
  }

  public switchProfile(profileId: string): UserProfile {
    const now = new Date().toISOString();
    this.db.run('UPDATE profiles SET updated_at = ? WHERE id = ?', [now, profileId]);
    const profile = this.db.get<UserProfile>('SELECT * FROM profiles WHERE id = ?', [profileId]);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }
    this.logger.log('PROFILE_SWITCHED', `Switched active profile to ${profile.display_name}`, profileId);

    // Sync to MongoDB Cloud
    if (this.mongo) {
      this.mongo.syncProfile(profile).catch(() => {});
    }

    return profile;
  }

  public deleteProfile(profileId: string): boolean {
    const count = this.db.get<{ c: number }>('SELECT COUNT(*) as c FROM profiles');
    if (count && count.c <= 1) {
      throw new Error('Cannot delete the only existing profile');
    }
    this.db.run('DELETE FROM profiles WHERE id = ?', [profileId]);
    this.db.run('DELETE FROM user_progress WHERE profile_id = ?', [profileId]);
    this.db.run('DELETE FROM badges WHERE profile_id = ?', [profileId]);

    // Delete in MongoDB Cloud
    if (this.mongo) {
      this.mongo.deleteProfileFromCloud(profileId).catch(() => {});
    }

    return true;
  }

  public createProfile(username: string, displayName: string, avatar: string = 'Shield'): UserProfile {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const skillLevel = 'Apprentice Security Analyst';
    const learningPath = 'Web Exploitation to Host Compromise (Beginner-Friendly Chained Track)';

    const profile: UserProfile = {
      id,
      username: username.trim(),
      display_name: displayName.trim() || username.trim(),
      avatar,
      skill_level: skillLevel,
      learning_path: learningPath,
      total_xp: 0,
      created_at: now,
      updated_at: now,
    };

    this.db.run(
      'INSERT INTO profiles (id, username, display_name, avatar, skill_level, learning_path, total_xp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [profile.id, profile.username, profile.display_name, profile.avatar, profile.skill_level, profile.learning_path, profile.created_at, profile.updated_at]
    );

    this.logger.log('PROFILE_CREATED', `Profile created for ${username}`, id);

    // Sync to MongoDB Cloud
    if (this.mongo) {
      this.mongo.syncProfile(profile).catch(() => {});
    }

    return profile;
  }

  public evaluateAssessment(profileId: string, answers: AssessmentAnswers): { skillLevel: string; learningPath: string; score: number } {
    let score = 0;

    // Experience weights
    if (answers.cyberExperience === 'beginner') score += 20;
    else if (answers.cyberExperience === 'intermediate') score += 40;
    else if (answers.cyberExperience === 'advanced') score += 60;
    else score += 10;

    // CTF experience
    if (answers.ctfExperience === 'few') score += 20;
    else if (answers.ctfExperience === 'regular') score += 40;
    else score += 10;

    // Web knowledge
    if (answers.webKnowledge === 'moderate') score += 20;
    else if (answers.webKnowledge === 'strong') score += 40;
    else score += 10;

    let skillLevel = 'Apprentice Security Analyst';
    if (score >= 100) {
      skillLevel = 'Proficient Security Researcher';
    } else if (score >= 60) {
      skillLevel = 'Junior Penetration Tester';
    } else {
      skillLevel = 'Apprentice Security Analyst';
    }

    let learningPath = 'Web Exploitation to Host Compromise (Foundational Chained Track)';
    if (answers.learningGoal === 'defense') {
      learningPath = 'Offensive Tactics & Defensive Remediation Master Path';
    } else if (answers.learningGoal === 'cert') {
      learningPath = 'Practical Hands-on Security Certification Track';
    }

    const now = new Date().toISOString();
    this.db.run(
      'UPDATE profiles SET skill_level = ?, learning_path = ?, updated_at = ? WHERE id = ?',
      [skillLevel, learningPath, now, profileId]
    );

    this.logger.log('ASSESSMENT_COMPLETED', `Skill assessed: ${skillLevel} (Score: ${score})`, profileId, { score, answers });

    const updatedProfile = this.db.get<UserProfile>('SELECT * FROM profiles WHERE id = ?', [profileId]);
    if (updatedProfile && this.mongo) {
      this.mongo.syncProfile(updatedProfile).catch(() => {});
    }

    return { skillLevel, learningPath, score };
  }

  public updateXp(profileId: string, additionalXp: number): void {
    const profile = this.db.get<UserProfile>('SELECT * FROM profiles WHERE id = ?', [profileId]);
    if (!profile) return;
    const newTotal = (profile.total_xp || 0) + additionalXp;
    const now = new Date().toISOString();
    this.db.run('UPDATE profiles SET total_xp = ?, updated_at = ? WHERE id = ?', [newTotal, now, profileId]);

    const updatedProfile = this.db.get<UserProfile>('SELECT * FROM profiles WHERE id = ?', [profileId]);
    if (updatedProfile && this.mongo) {
      this.mongo.syncProfile(updatedProfile).catch(() => {});
    }
  }
}
