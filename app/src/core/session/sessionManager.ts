/**
 * ICONTROL_SESSION_MANAGER_V1
 * Gestion des sessions utilisateur (voir, déconnecter)
 */

export interface ActiveSession {
  id: string;
  userId: string;
  username: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  current: boolean; // Session actuelle
}

class SessionManager {
  private sessions: Map<string, ActiveSession> = new Map();
  private currentSessionId: string | null = null;

  createSession(username: string, metadata?: { ip?: string; userAgent?: string }): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const session: ActiveSession = {
      id: sessionId,
      userId: username,
      username,
      startTime: now,
      lastActivity: now,
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
      current: false
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    session.current = true;
    this.saveToStorage();
    return sessionId;
  }

  updateActivity(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.saveToStorage();
    }
  }

  getCurrentSession(): ActiveSession | null {
    if (this.currentSessionId) {
      return this.sessions.get(this.currentSessionId) || null;
    }
    return null;
  }

  getAllSessions(): ActiveSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionsForUser(username: string): ActiveSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === username);
  }

  terminateSession(sessionId: string): boolean {
    if (sessionId === this.currentSessionId) {
      return false; // Ne pas terminer la session actuelle via cette méthode
    }
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  terminateAllOtherSessions(username: string): number {
    let count = 0;
    this.sessions.forEach((session, id) => {
      if (session.userId === username && id !== this.currentSessionId) {
        this.sessions.delete(id);
        count++;
      }
    });
    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  clearExpiredSessions(maxAgeHours: number = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let count = 0;

    this.sessions.forEach((session, id) => {
      const age = now.getTime() - session.lastActivity.getTime();
      if (age > maxAge && id !== this.currentSessionId) {
        this.sessions.delete(id);
        count++;
      }
    });

    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.sessions.entries()).map(([id, session]) => ({
        ...session,
        startTime: session.startTime.toISOString(),
        lastActivity: session.lastActivity.toISOString()
      }));
      localStorage.setItem("icontrol_sessions", JSON.stringify(data));
      localStorage.setItem("icontrol_current_session_id", this.currentSessionId || "");
    } catch (e) {
      console.warn("Failed to save sessions to storage", e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("icontrol_sessions");
      const currentId = localStorage.getItem("icontrol_current_session_id");
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions.clear();
        data.forEach((s: any) => {
          this.sessions.set(s.id, {
            ...s,
            startTime: new Date(s.startTime),
            lastActivity: new Date(s.lastActivity)
          });
        });
        this.currentSessionId = currentId;
        // Marquer session actuelle
        if (currentId) {
          const current = this.sessions.get(currentId);
          if (current) {
            current.current = true;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load sessions from storage", e);
    }
  }

  // Mettre à jour l'activité périodiquement
  startActivityTracking() {
    setInterval(() => {
      if (this.currentSessionId) {
        this.updateActivity(this.currentSessionId);
      }
      // Nettoyer sessions expirées
      this.clearExpiredSessions();
    }, 60000); // Toutes les minutes
  }
}

export const sessionManager = new SessionManager();

// Initialiser au chargement
sessionManager.loadFromStorage();
sessionManager.startActivityTracking();
