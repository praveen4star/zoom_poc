/**
 * In-memory session store for tracking session ownership and co-host assignments
 * For production, replace with a database solution
 */

interface SessionData {
  sessionId: string;
  creatorUserId: string;
  sessionName: string;
  createdAt: number;
  coHosts: Set<string>;
}

class SessionStore {
  private sessions: Map<string, SessionData> = new Map();

  /**
   * Store session ownership when session is created
   */
  createSession(
    sessionId: string,
    creatorUserId: string,
    sessionName: string
  ): void {
    this.sessions.set(sessionId, {
      sessionId,
      creatorUserId,
      sessionName,
      createdAt: Date.now(),
      coHosts: new Set(),
    });
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if user is the session creator (host)
   */
  isHost(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.creatorUserId === userId;
  }

  /**
   * Check if user is a co-host
   */
  isCoHost(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.coHosts.has(userId) || false;
  }

  /**
   * Assign co-host role to a user (only host can do this)
   */
  assignCoHost(sessionId: string, userId: string, hostUserId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.creatorUserId !== hostUserId) {
      return false; // Only host can assign co-host
    }
    session.coHosts.add(userId);
    return true;
  }

  /**
   * Remove co-host role from a user
   */
  removeCoHost(sessionId: string, userId: string, hostUserId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.creatorUserId !== hostUserId) {
      return false; // Only host can remove co-host
    }
    return session.coHosts.delete(userId);
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions (for debugging/admin purposes)
   */
  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();
