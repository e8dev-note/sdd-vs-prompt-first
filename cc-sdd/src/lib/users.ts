import type Database from "better-sqlite3";
import { parseRole, type Role } from "./authz";
import { getDb } from "./db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import { nowIso } from "./time";

export interface User {
  id: number;
  username: string;
  role: Role;
}

type UserRow = { id: number; username: string; password_hash: string; role: string };

function rowToUser(row: { id: number; username: string; role: string }): User {
  return { id: row.id, username: row.username, role: parseRole(row.role) };
}

export const SEED_USERS: readonly { username: string; password: string; role: Role }[] = [
  { username: "admin", password: "admin1234", role: "admin" },
  { username: "editor", password: "editor1234", role: "editor" },
  { username: "viewer", password: "viewer1234", role: "viewer" },
];

export function getUserById(id: number): User | null {
  const row = getDb().prepare("SELECT id, username, role FROM users WHERE id = ?").get(id) as
    | { id: number; username: string; role: string }
    | undefined;
  return row ? rowToUser(row) : null;
}

/**
 * username と password を検証する。不在の username でもダミーハッシュを検証し、所要時間で存在有無が分からないようにする。
 * 空の入力は検証せず null。
 */
export function authenticate(username: string, password: string): User | null {
  if (username === "" || password === "") return null;
  const row = getDb()
    .prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
  const ok = verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return null;
  return rowToUser(row);
}

/** users が 0 件なら SEED_USERS をハッシュ化して投入し件数を返す。それ以外は 0。 */
export function seedUsersIfEmpty(db: Database.Database): number {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (n > 0) return 0;
  const insert = db.prepare("INSERT INTO users (username, password_hash, created_at, role) VALUES (?, ?, ?, ?)");
  const now = nowIso();
  db.transaction(() => {
    for (const u of SEED_USERS) insert.run(u.username, hashPassword(u.password), now, u.role);
  })();
  return SEED_USERS.length;
}
