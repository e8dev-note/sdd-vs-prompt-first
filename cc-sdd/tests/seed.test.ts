import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb, resetDbForTests } from "@/lib/db";
import { SEED_PRODUCTS, seedIfEmpty } from "@/lib/seed";

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

function count(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
}

describe("seed", () => {
  it("defines about 20 products with unique codes and non-negative integer prices", () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SEED_PRODUCTS.map((p) => p.code)).size).toBe(SEED_PRODUCTS.length);
    for (const p of SEED_PRODUCTS) {
      expect(Number.isInteger(p.price) && p.price >= 0).toBe(true);
    }
  });

  it("is applied automatically on first access to an empty database", () => {
    expect(count()).toBe(SEED_PRODUCTS.length);
    const row = getDb()
      .prepare("SELECT created_at, updated_at FROM products LIMIT 1")
      .get() as { created_at: string; updated_at: string };
    expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(row.updated_at).toBe(row.created_at);
  });

  it("does not insert again when products already exist", () => {
    const before = count();
    expect(seedIfEmpty(getDb())).toBe(0);
    resetDbForTests();
    expect(count()).toBe(before);
  });

  it("does not insert when the table holds user data", () => {
    const db = getDb();
    db.prepare("DELETE FROM products").run();
    db.prepare(
      "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("U-1", "user", "c", 1, null, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    expect(seedIfEmpty(db)).toBe(0);
    expect(count()).toBe(1);
  });
});
