import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { appliedMigrations, getDb, resetDbForTests } from "@/lib/db";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "product-master-"));
  process.env.DATABASE_PATH = join(dir, "nested", "test.db");
  resetDbForTests();
});

afterEach(() => {
  resetDbForTests();
  delete process.env.DATABASE_PATH;
  rmSync(dir, { recursive: true, force: true });
});

describe("getDb", () => {
  it("applies migrations on first access and creates the products table", () => {
    const db = getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as { name: string }[];
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(["products", "users", "sessions"]));
    expect(appliedMigrations(db)).toEqual([
      "001_create_products.sql",
      "002_add_bookmarked_to_products.sql",
      "003_create_users_and_sessions.sql",
      "004_add_role_to_users.sql",
    ]);
  });

  it("returns the same connection and does not re-apply migrations", () => {
    const first = getDb();
    const second = getDb();
    expect(second).toBe(first);
    expect(appliedMigrations(second)).toHaveLength(4);
  });

  it("re-opens an existing database without re-applying migrations", () => {
    const db = getDb();
    db.prepare(
      "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("X-1", "x", "c", 1, null, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    resetDbForTests();
    const reopened = getDb();
    expect(appliedMigrations(reopened)).toHaveLength(4);
    const row = reopened.prepare("SELECT code FROM products WHERE code = ?").get("X-1") as { code: string };
    expect(row.code).toBe("X-1");
  });
});

describe("migration 002 on an existing database", () => {
  it("adds bookmarked with default 0 to existing rows without touching other columns", () => {
    // 001 だけを手で適用したデータ入りの DB を作る
    mkdirSync(dirname(process.env.DATABASE_PATH!), { recursive: true });
    const raw = new Database(process.env.DATABASE_PATH!);
    raw.exec("CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
    raw.exec(readFileSync("db/migrations/001_create_products.sql", "utf8"));
    raw.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run("001_create_products.sql", "2026-01-01T00:00:00.000Z");
    raw.prepare(
      "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("OLD-1", "old", "c", 5, "n", "2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z");
    raw.close();

    const db = getDb();
    expect(appliedMigrations(db)).toEqual([
      "001_create_products.sql",
      "002_add_bookmarked_to_products.sql",
      "003_create_users_and_sessions.sql",
      "004_add_role_to_users.sql",
    ]);
    const row = db.prepare("SELECT * FROM products WHERE code = ?").get("OLD-1") as Record<string, unknown>;
    expect(row).toMatchObject({
      code: "OLD-1", name: "old", category: "c", price: 5, note: "n",
      created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-02T00:00:00.000Z", bookmarked: 0,
    });
  });
});

describe("migration 004 on an existing database with users", () => {
  it("assigns role = username to the seed users and leaves other columns untouched", () => {
    mkdirSync(dirname(process.env.DATABASE_PATH!), { recursive: true });
    const raw = new Database(process.env.DATABASE_PATH!);
    raw.exec("CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
    const record = raw.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");
    for (const f of ["001_create_products.sql", "002_add_bookmarked_to_products.sql", "003_create_users_and_sessions.sql"]) {
      raw.exec(readFileSync(`db/migrations/${f}`, "utf8"));
      record.run(f, "2026-01-01T00:00:00.000Z");
    }
    const ins = raw.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)");
    ins.run("admin", "scrypt$a", "2026-01-01T00:00:00.000Z");
    ins.run("editor", "scrypt$e", "2026-01-01T00:00:00.000Z");
    ins.run("viewer", "scrypt$v", "2026-01-01T00:00:00.000Z");
    ins.run("someone", "scrypt$s", "2026-01-01T00:00:00.000Z");
    raw.close();

    const db = getDb();
    expect(appliedMigrations(db)).toHaveLength(4);
    const rows = db.prepare("SELECT username, password_hash, created_at, role FROM users ORDER BY id").all();
    expect(rows).toEqual([
      { username: "admin", password_hash: "scrypt$a", created_at: "2026-01-01T00:00:00.000Z", role: "admin" },
      { username: "editor", password_hash: "scrypt$e", created_at: "2026-01-01T00:00:00.000Z", role: "editor" },
      { username: "viewer", password_hash: "scrypt$v", created_at: "2026-01-01T00:00:00.000Z", role: "viewer" },
      { username: "someone", password_hash: "scrypt$s", created_at: "2026-01-01T00:00:00.000Z", role: "viewer" },
    ]);
    expect(() => db.prepare("UPDATE users SET role = root WHERE username = someone").run()).toThrow();
  });
});
