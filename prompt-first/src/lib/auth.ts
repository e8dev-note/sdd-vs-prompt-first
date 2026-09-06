import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

export type User = {
  id: number;
  username: string;
  created_at: string;
};

export const SESSION_COOKIE = "session";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const SCRYPT_KEYLEN = 64;

/** scrypt でハッシュ化し "scrypt$<salt hex>$<hash hex>" 形式で返す。 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createUser(username: string, password: string): User {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
    .run(username, hashPassword(password), new Date().toISOString());
  return getUserById(Number(result.lastInsertRowid))!;
}

export function getUserById(id: number): User | undefined {
  return getDb()
    .prepare("SELECT id, username, created_at FROM users WHERE id = ?")
    .get(id) as User | undefined;
}

export function countUsers(): number {
  return (getDb().prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
}

/** username と password を検証し、一致すればユーザーを返す。 */
export function authenticate(username: string, password: string): User | undefined {
  const row = getDb()
    .prepare("SELECT id, username, password_hash, created_at FROM users WHERE username = ?")
    .get(username) as (User & { password_hash: string }) | undefined;
  if (!row) {
    // ユーザー不在でも所要時間を揃える(ユーザー名の存在を推測されにくくする)。
    verifyPassword(password, DUMMY_HASH);
    return undefined;
  }
  if (!verifyPassword(password, row.password_hash)) return undefined;
  return { id: row.id, username: row.username, created_at: row.created_at };
}
const DUMMY_HASH = hashPassword("dummy");

/** セッションを作成し、Cookie に入れるトークンと有効期限を返す。 */
export function createSession(
  userId: number,
  now: Date = new Date(),
): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, expiresAt.toISOString(), now.toISOString());
  return { token, expiresAt };
}

/** トークンから有効なセッションのユーザーを返す。期限切れ・不明なら undefined。 */
export function getUserBySessionToken(
  token: string | undefined,
  now: Date = new Date(),
): User | undefined {
  if (!token) return undefined;
  return getDb()
    .prepare(
      `SELECT u.id, u.username, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, now.toISOString()) as User | undefined;
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/** 期限切れセッションを削除する。削除件数を返す。 */
export function purgeExpiredSessions(now: Date = new Date()): number {
  return getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString())
    .changes;
}

export const SEED_USERS: { username: string; password: string }[] = [
  { username: "admin", password: "admin1234" },
  { username: "editor", password: "editor1234" },
  { username: "viewer", password: "viewer1234" },
];

/** users が空のときだけ初期ユーザーを投入する。 */
export function seedUsersIfEmpty(): number {
  if (countUsers() > 0) return 0;
  for (const u of SEED_USERS) createUser(u.username, u.password);
  return SEED_USERS.length;
}
