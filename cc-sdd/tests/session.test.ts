import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb, resetDbForTests } from "@/lib/db";
import { SESSION_TTL_MS, createSession, deleteSession, getSession } from "@/lib/session";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "product-master-"));
  process.env.DATABASE_PATH = join(dir, "test.db");
  resetDbForTests();
});

afterEach(() => {
  resetDbForTests();
  delete process.env.DATABASE_PATH;
  rmSync(dir, { recursive: true, force: true });
});

function userId(): number {
  return (getDb().prepare("SELECT id FROM users ORDER BY id LIMIT 1").get() as { id: number }).id;
}

describe("session", () => {
  it("creates a session with a 24h expiry and retrieves it", () => {
    const now = new Date("2026-09-07T00:00:00.000Z");
    const s = createSession(userId(), now);
    expect(s.id).toHaveLength(43);
    expect(s.createdAt).toBe(now.toISOString());
    expect(new Date(s.expiresAt).getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(SESSION_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(getSession(s.id, now)).toEqual(s);
    expect(getSession(s.id, new Date(now.getTime() + SESSION_TTL_MS - 1))).toEqual(s);
  });

  it("treats an expired session as missing and deletes it", () => {
    const now = new Date("2026-09-07T00:00:00.000Z");
    const s = createSession(userId(), now);
    expect(getSession(s.id, new Date(now.getTime() + SESSION_TTL_MS))).toBeNull();
    const row = getDb().prepare("SELECT id FROM sessions WHERE id = ?").get(s.id);
    expect(row).toBeUndefined();
  });

  it("returns null for unknown or deleted ids", () => {
    expect(getSession("nope")).toBeNull();
    const s = createSession(userId());
    deleteSession(s.id);
    expect(getSession(s.id)).toBeNull();
    deleteSession(s.id); // 冪等
  });

  it("allows multiple concurrent sessions per user with unique ids", () => {
    const uid = userId();
    const ids = new Set(Array.from({ length: 20 }, () => createSession(uid).id));
    expect(ids.size).toBe(20);
    for (const id of ids) expect(getSession(id)?.userId).toBe(uid);
  });
});
