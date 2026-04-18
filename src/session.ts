import { randomUUID } from "crypto";
import { Store, Session, Exchange, HistoryEntry } from "./store.js";
import { DecisionCategory } from "./questioner.js";

export interface SessionManager {
  startSession(participant: string, decision: string, category: DecisionCategory): Session;
  getActiveSession(participant: string): Session | null;
  recordQuestion(sessionId: string, question: string, round: number): number;
  recordAnswer(exchangeId: number, answer: string): void;
  getUnansweredExchange(sessionId: string): Exchange | null;
  getSessionExchanges(sessionId: string): Exchange[];
  completeSession(sessionId: string): Exchange[];
  abandonSession(participant: string): boolean;
  getHistory(participant: string, limit?: number): HistoryEntry[];
  close(): void;
}

export class SQLiteSessionManager implements SessionManager {
  private store: Store;

  constructor() {
    this.store = new Store();
  }

  startSession(participant: string, decision: string, category: DecisionCategory): Session {
    const existingSession = this.store.getActiveSession(participant);
    if (existingSession) {
      this.store.completeSession(existingSession.id);
    }

    const sessionId = randomUUID();
    return this.store.createSession(sessionId, participant, decision, category);
  }

  getActiveSession(participant: string): Session | null {
    return this.store.getActiveSession(participant);
  }

  recordQuestion(sessionId: string, question: string, round: number): number {
    return this.store.recordQuestion(sessionId, question, round);
  }

  recordAnswer(exchangeId: number, answer: string): void {
    this.store.recordAnswer(exchangeId, answer);
  }

  getUnansweredExchange(sessionId: string): Exchange | null {
    return this.store.getUnansweredExchange(sessionId);
  }

  completeSession(sessionId: string): Exchange[] {
    this.store.completeSession(sessionId);
    return this.store.getSessionExchanges(sessionId);
  }

  getSessionExchanges(sessionId: string): Exchange[] {
    return this.store.getSessionExchanges(sessionId);
  }

  abandonSession(participant: string): boolean {
    const session = this.store.getActiveSession(participant);
    if (!session) return false;

    this.store.completeSession(session.id);
    return true;
  }

  getHistory(participant: string, limit = 10): HistoryEntry[] {
    return this.store.getHistory(participant, limit);
  }

  close(): void {
    this.store.close();
  }
}
