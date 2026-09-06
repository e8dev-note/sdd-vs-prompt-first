import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    expect(tables.map((t) => t.name)).toContain("products");
    expect(appliedMigrations(db)).toEqual(["001_create_products.sql"]);
  });

  it("returns the same connection and does not re-apply migrations", () => {
    const first = getDb();
    const second = getDb();
    expect(second).toBe(first);
    expect(appliedMigrations(second)).toHaveLength(1);
  });

  it("re-opens an existing database without re-applying migrations", () => {
    const db = getDb();
    db.prepare(
      "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("X-1", "x", "c", 1, null, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    resetDbForTests();
    const reopened = getDb();
    expect(appliedMigrations(reopened)).toHaveLength(1);
    const row = reopened.prepare("SELECT code FROM products WHERE code = ?").get("X-1") as { code: string };
    expect(row.code).toBe("X-1");
  });
});
