import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb, resetDbForTests } from "@/lib/db";
import {
  deleteProduct,
  escapeLike,
  getProduct,
  listProducts,
  nowIso,
  parseProductId,
} from "@/lib/products";
import { SEED_PRODUCTS } from "@/lib/seed";

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

function insert(code: string, name: string, category: string, price = 1): number {
  const now = nowIso();
  const r = getDb()
    .prepare(
      "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)",
    )
    .run(code, name, category, price, now, now);
  return Number(r.lastInsertRowid);
}

describe("listProducts", () => {
  it("returns all seeded products ordered by code ascending", () => {
    const list = listProducts();
    expect(list).toHaveLength(SEED_PRODUCTS.length);
    const codes = list.map((p) => p.code);
    expect(codes).toEqual([...codes].sort());
  });

  it("treats undefined, empty, and whitespace-only keywords as no filter", () => {
    const all = listProducts().length;
    expect(listProducts({ keyword: "" })).toHaveLength(all);
    expect(listProducts({ keyword: "   " })).toHaveLength(all);
    expect(listProducts({})).toHaveLength(all);
  });

  it("matches partial strings in code, name, or category", () => {
    expect(listProducts({ keyword: "PC-00" }).map((p) => p.code)).toEqual([
      "PC-001",
      "PC-002",
      "PC-003",
      "PC-004",
      "PC-005",
    ]);
    expect(listProducts({ keyword: "ホチキス" })).toHaveLength(2);
    expect(listProducts({ keyword: "給湯室" })).toHaveLength(5);
    expect(listProducts({ keyword: "存在しない" })).toHaveLength(0);
  });

  it("ignores ASCII letter case", () => {
    expect(listProducts({ keyword: "pc-001" })).toHaveLength(1);
    expect(listProducts({ keyword: "usb" }).length).toBeGreaterThanOrEqual(2);
  });

  it("treats % and _ literally", () => {
    insert("SP-1", "100% cotton", "misc");
    insert("SP-2", "under_score", "misc");
    insert("SP-3", "100X cotton", "misc");
    expect(listProducts({ keyword: "100%" }).map((p) => p.code)).toEqual(["SP-1"]);
    expect(listProducts({ keyword: "r_s" }).map((p) => p.code)).toEqual(["SP-2"]);
    expect(listProducts({ keyword: "%" }).map((p) => p.code)).toEqual(["SP-1"]);
  });

  it("trims the keyword before matching", () => {
    expect(listProducts({ keyword: "  PC-001  " })).toHaveLength(1);
  });
});

describe("escapeLike", () => {
  it("escapes backslash, percent, and underscore", () => {
    expect(escapeLike("a\\b%c_d")).toBe("a\\\\b\\%c\\_d");
  });
});

describe("getProduct", () => {
  it("returns the full row for an existing id", () => {
    const id = insert("G-1", "gp", "cat", 42);
    const p = getProduct(id);
    expect(p).toMatchObject({ id, code: "G-1", name: "gp", category: "cat", price: 42, note: null });
    expect(p?.created_at).toBe(p?.updated_at);
  });

  it("returns null when the id does not exist", () => {
    expect(getProduct(999999)).toBeNull();
  });
});

describe("parseProductId", () => {
  it("accepts non-negative integers only", () => {
    expect(parseProductId("1")).toBe(1);
    expect(parseProductId("0042")).toBe(42);
    for (const bad of ["", " ", "abc", "1.5", "-1", "1e3", "1 ", "99999999999999999999"]) {
      expect(parseProductId(bad), bad).toBeNull();
    }
  });
});

describe("deleteProduct", () => {
  it("deletes an existing product and is idempotent", () => {
    const id = insert("D-1", "del", "cat");
    expect(deleteProduct(id)).toBe(1);
    expect(getProduct(id)).toBeNull();
    expect(listProducts({ keyword: "D-1" })).toHaveLength(0);
    expect(deleteProduct(id)).toBe(0);
  });

  it("returns 0 for an id that never existed", () => {
    expect(deleteProduct(999999)).toBe(0);
  });
});

describe("nowIso", () => {
  it("returns ISO8601 UTC with milliseconds", () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
