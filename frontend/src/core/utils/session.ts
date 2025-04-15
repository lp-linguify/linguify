// src/utils/session.ts
interface SessionUser {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }
  
  interface SessionData {
    user: SessionUser;
    accessToken: string;
    idToken: string;
    expiresAt: number;
  }
  
  export function createSessionCookie(data: SessionData) {
    return {
      name: 'session',
      value: JSON.stringify(data),
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor((data.expiresAt - Date.now()) / 1000),
        priority: 'high'
      }
    };
  }
  
  export function isValidSession(sessionData: SessionData): boolean {
    return (
      sessionData &&
      sessionData.user &&
      sessionData.accessToken &&
      sessionData.expiresAt &&
      Date.now() < sessionData.expiresAt
    );
  }
  
  export function parseSession(sessionStr: string): SessionData | null {
    try {
      const data = JSON.parse(sessionStr);
      return isValidSession(data) ? data : null;
    } catch {
      return null;
    }
  }