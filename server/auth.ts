import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User, Session } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}

export class AuthService {
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

  static async createSession(userId: number): Promise<Session> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);
    
    return storage.createSession({
      id: sessionId,
      userId,
      expiresAt,
    });
  }

  static async validateSession(sessionId: string): Promise<{ user: User; session: Session } | null> {
    const session = await storage.getSession(sessionId);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await storage.deleteSession(sessionId);
      }
      return null;
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      await storage.deleteSession(sessionId);
      return null;
    }

    return { user, session };
  }

  static async login(username: string, password: string): Promise<{ user: User; session: Session } | null> {
    const user = await storage.getUserByUsername(username);
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
    await storage.deleteSession(sessionId);
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export async function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return next();
  }

  const result = await AuthService.validateSession(sessionId);
  if (result) {
    req.user = result.user;
    req.session = result.session;
  } else {
    // Clear invalid session cookie
    res.clearCookie('sessionId');
  }

  next();
}