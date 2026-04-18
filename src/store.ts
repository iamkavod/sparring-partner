import { Database } from "bun:sqlite";
import { DecisionCategory } from "./questioner.js";

export interface Session {
  id: string;
  participant: string;
  decision: string;
  category: DecisionCategory;
  state: "active" | "completed";
  questionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exchange {
  id: number;
  sessionId: string;
  question: string;
  answer: string | null;
  round: number;
  createdAt: Date;
}

export interface HistoryEntry {
  decision: string;
  category: DecisionCategory;
  questionCount: number;
  createdAt: Date;
  completedAt: Date | null;
}

const DB_PATH = "./sparring-partner.db";
const SESSION_EXPIRY_HOURS = 24;

export class Store {
  private db: Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        participant TEXT NOT NULL,
        decision TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        state TEXT DEFAULT 'active',
        question_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exchanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        question TEXT NOT NULL,
        answer TEXT,
        round INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_participant ON sessions(participant);
      CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
      CREATE INDEX IF NOT EXISTS idx_exchanges_session ON exchanges(session_id);
    `);
  }

  createSession(
    id: string,
    participant: string,
    decision: string,
    category: DecisionCategory
  ): Session {
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO sessions (id, participant, decision, category, state, question_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 0, ?, ?)`,
      [id, participant, decision, category, now, now]
    );

    return {
      id,
      participant,
      decision,
      category,
      state: "active",
      questionCount: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  getActiveSession(participant: string): Session | null {
    this.deleteExpiredSessions();

    const row = this.db
      .query<
        {
          id: string;
          participant: string;
          decision: string;
          category: string;
          state: string;
          question_count: number;
          created_at: string;
          updated_at: string;
        },
        string
      >(
        `SELECT id, participant, decision, category, state, question_count, created_at, updated_at
         FROM sessions
         WHERE participant = ? AND state = 'active'
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(participant);

    if (!row) return null;

    return {
      id: row.id,
      participant: row.participant,
      decision: row.decision,
      category: row.category as DecisionCategory,
      state: row.state as "active" | "completed",
      questionCount: row.question_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  recordQuestion(sessionId: string, question: string, round: number): number {
    const info = this.db.run(
      `INSERT INTO exchanges (session_id, question, answer, round) VALUES (?, ?, NULL, ?)`,
      [sessionId, question, round]
    );

    this.db.run(
      `UPDATE sessions SET question_count = question_count + 1, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), sessionId]
    );

    return Number(info.lastInsertRowid);
  }

  recordAnswer(exchangeId: number, answer: string): void {
    this.db.run(
      `UPDATE exchanges SET answer = ? WHERE id = ?`,
      [answer, exchangeId]
    );
  }

  getUnansweredExchange(sessionId: string): Exchange | null {
    const row = this.db
      .query<
        {
          id: number;
          session_id: string;
          question: string;
          answer: string | null;
          round: number;
          created_at: string;
        },
        string
      >(
        `SELECT id, session_id, question, answer, round, created_at
         FROM exchanges
         WHERE session_id = ? AND answer IS NULL
         ORDER BY round DESC
         LIMIT 1`
      )
      .get(sessionId);

    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      question: row.question,
      answer: row.answer,
      round: row.round,
      createdAt: new Date(row.created_at),
    };
  }

  completeSession(sessionId: string): void {
    this.db.run(
      `UPDATE sessions SET state = 'completed', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), sessionId]
    );
  }

  getSessionExchanges(sessionId: string): Exchange[] {
    const rows = this.db
      .query<
        {
          id: number;
          session_id: string;
          question: string;
          answer: string | null;
          round: number;
          created_at: string;
        },
        string
      >(
        `SELECT id, session_id, question, answer, round, created_at
         FROM exchanges
         WHERE session_id = ?
         ORDER BY round ASC`
      )
      .all(sessionId);

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      question: row.question,
      answer: row.answer,
      round: row.round,
      createdAt: new Date(row.created_at),
    }));
  }

  getHistory(participant: string, limit = 10): HistoryEntry[] {
    const rows = this.db
      .query<
        {
          decision: string;
          category: string;
          question_count: number;
          created_at: string;
          updated_at: string;
          state: string;
        },
        [string, number]
      >(
        `SELECT decision, category, question_count, created_at, updated_at, state
         FROM sessions
         WHERE participant = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(participant, limit);

    return rows.map((row) => ({
      decision: row.decision,
      category: row.category as DecisionCategory,
      questionCount: row.question_count,
      createdAt: new Date(row.created_at),
      completedAt: row.state === "completed" ? new Date(row.updated_at) : null,
    }));
  }

  deleteExpiredSessions(): void {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - SESSION_EXPIRY_HOURS);

    this.db.run(
      `DELETE FROM sessions WHERE state = 'active' AND updated_at < ?`,
      [expiryTime.toISOString()]
    );
  }

  close(): void {
    this.db.close();
  }
}
