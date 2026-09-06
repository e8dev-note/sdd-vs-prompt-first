import { randomBytes } from "node:crypto";
import { getDb } from "./db";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface Session {
  id: string;
  userId: number;
  createdAt: string; // ISO8601 UTC
  expiresAt: string; // ISO8601 UTC
}

type SessionRow = { id: string; user_id: number; created_at: string; expires_at: string };

function rowToSession(r: SessionRow): Session {
  return { id: r.id, userId: r.user_id, createdAt: r.created_at, expiresAt: r.expires_at };
}

/** 256 ビット乱数の ID、期限は now + 24h(延長しない)。 */
export function createSession(userId: number, now: Date = new Date()): Session {
  const session: Session = {
    id: randomBytes(32).toString("base64url"),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  getDb()
    .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(session.id, session.userId, session.createdAt, session.expiresAt);
  return session;
}

/** 存在し期限内なら返す。期限切れは削除して null。不在は null。 */
export function getSession(id: string, now: Date = new Date()): Session | null {
  const row = getDb().prepare("SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ?").get(id) as
    | SessionRow
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    deleteSession(id);
    return null;
  }
  return rowToSession(row);
}

export function deleteSession(id: string): void {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
}
