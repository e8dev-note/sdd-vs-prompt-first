import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb, resetDbForTests } from "@/lib/db";
import { SEED_USERS, authenticate, getUserById, seedUsersIfEmpty } from "@/lib/users";

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

describe("users seed", () => {
  it("seeds admin / editor / viewer on first access and stores hashed passwords", () => {
    const rows = getDb().prepare("SELECT username, password_hash FROM users ORDER BY id").all() as {
      username: string;
      password_hash: string;
    }[];
    expect(rows.map((r) => r.username)).toEqual(["admin", "editor", "viewer"]);
    for (const r of rows) {
      expect(r.password_hash).toMatch(/^scrypt\$/);
      expect(r.password_hash).not.toContain("1234");
    }
    expect(SEED_USERS.map((u) => u.username)).toEqual(["admin", "editor", "viewer"]);
  });

  it("does not seed again when users exist", () => {
    expect(seedUsersIfEmpty(getDb())).toBe(0);
    resetDbForTests();
    expect((getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n).toBe(3);
  });
});

describe("authenticate", () => {
  it("returns the user for correct credentials", () => {
    const u = authenticate("admin", "admin1234");
    expect(u).toMatchObject({ username: "admin" });
    expect(getUserById(u!.id)).toEqual(u);
    expect(authenticate("viewer", "viewer1234")?.username).toBe("viewer");
  });

  it("returns null for a wrong password, unknown user, or empty input", () => {
    expect(authenticate("admin", "admin12345")).toBeNull();
    expect(authenticate("admin", "Admin1234")).toBeNull();
    expect(authenticate("nobody", "admin1234")).toBeNull();
    expect(authenticate("", "admin1234")).toBeNull();
    expect(authenticate("admin", "")).toBeNull();
  });

  it("does not expose the password hash on the returned user", () => {
    const u = authenticate("editor", "editor1234")!;
    expect(Object.keys(u).sort()).toEqual(["id", "username"]);
  });

  it("returns null for an unknown id", () => {
    expect(getUserById(999999)).toBeNull();
  });
});
