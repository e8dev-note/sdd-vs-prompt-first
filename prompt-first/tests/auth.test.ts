import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/lib/db";
import {
  SEED_USERS,
  SESSION_TTL_MS,
  authenticate,
  countUsers,
  createSession,
  createUser,
  deleteSession,
  getUserBySessionToken,
  hashPassword,
  purgeExpiredSessions,
  seedUsersIfEmpty,
  verifyPassword,
} from "@/lib/auth";

beforeEach(() => {
  getDb();
  seedUsersIfEmpty();
});
afterEach(() => closeDb());

describe("password hashing", () => {
  it("does not store plaintext and verifies correctly", () => {
    const h = hashPassword("secret");
    expect(h).not.toContain("secret");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("secret", h)).toBe(true);
    expect(verifyPassword("Secret", h)).toBe(false);
    expect(verifyPassword("secret", "garbage")).toBe(false);
  });

  it("uses a random salt per hash", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });
});

describe("users / seed", () => {
  it("seeds 3 users once", () => {
    expect(countUsers()).toBe(SEED_USERS.length);
    expect(seedUsersIfEmpty()).toBe(0);
  });

  it("authenticates seed users and rejects wrong credentials", () => {
    expect(authenticate("admin", "admin1234")?.username).toBe("admin");
    expect(authenticate("editor", "editor1234")?.username).toBe("editor");
    expect(authenticate("viewer", "viewer1234")?.username).toBe("viewer");
    expect(authenticate("admin", "wrong")).toBeUndefined();
    expect(authenticate("nobody", "admin1234")).toBeUndefined();
  });

  it("rejects duplicate usernames", () => {
    expect(() => createUser("admin", "x")).toThrow();
  });
});

describe("sessions", () => {
  it("creates a session valid for 24 hours and resolves the user", () => {
    const user = authenticate("admin", "admin1234")!;
    const now = new Date("2026-09-06T00:00:00Z");
    const { token, expiresAt } = createSession(user.id, now);
    expect(expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(getUserBySessionToken(token, now)?.id).toBe(user.id);
    expect(getUserBySessionToken(token, new Date(now.getTime() + SESSION_TTL_MS - 1))?.id).toBe(user.id);
    expect(getUserBySessionToken(token, new Date(now.getTime() + SESSION_TTL_MS))).toBeUndefined();
  });

  it("returns undefined for unknown or missing token", () => {
    expect(getUserBySessionToken(undefined)).toBeUndefined();
    expect(getUserBySessionToken("nope")).toBeUndefined();
  });

  it("deletes a session on logout and purges expired ones", () => {
    const user = authenticate("editor", "editor1234")!;
    const now = new Date("2026-09-06T00:00:00Z");
    const a = createSession(user.id, now);
    const b = createSession(user.id, new Date(now.getTime() - SESSION_TTL_MS - 1000));
    deleteSession(a.token);
    expect(getUserBySessionToken(a.token, now)).toBeUndefined();
    expect(purgeExpiredSessions(now)).toBe(1);
    expect(getUserBySessionToken(b.token, now)).toBeUndefined();
  });
});
