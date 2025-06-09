import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import { users, sessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { User, Session, InsertUser, InsertSession } from '@shared/schema';

export class AuthStorage {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  static async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  static async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  static async createSession(userId: number): Promise<Session> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);
    
    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        expiresAt,
      })
      .returning();
    return session;
  }

  static async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.deleteSession(sessionId);
      }
      return undefined;
    }
    return session;
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, sessionId));
    return true;
  }

  static async validateSession(sessionId: string): Promise<{ user: User; session: Session } | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const user = await this.getUserById(session.userId);
    if (!user) {
      await this.deleteSession(sessionId);
      return null;
    }

    return { user, session };
  }

  static async login(username: string, password: string): Promise<{ user: User; session: Session } | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const session = await this.createSession(user.id);
    return { user, session };
  }

  static async logout(sessionId: string): Promise<void> {
    await this.deleteSession(sessionId);
  }
}