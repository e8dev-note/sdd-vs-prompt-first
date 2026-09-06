import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384;
const R = 8;
const P = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** "scrypt$N$r$p$<salt base64url>$<hash base64url>" */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const key = scryptSync(plain, salt, KEY_BYTES, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

/** 保存形式を解釈して再計算し、時間一定で比較する。形式不正は false。 */
export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(plain, salt, expected.length, { N: n, r, p });
  return timingSafeEqual(actual, expected);
}

/** 未知ユーザーのときに検証して所要時間を揃えるためのダミー(起動時に 1 回生成)。 */
export const DUMMY_HASH: string = hashPassword(randomBytes(SALT_BYTES).toString("base64url"));
