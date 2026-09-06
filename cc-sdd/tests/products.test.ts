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
  setBookmark,
  updateProduct,
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

describe("listProducts sorting", () => {
  const columns = ["code", "name", "category", "price"] as const;

  it.each(columns)("sorts by %s ascending and descending", (sort) => {
    const asc = listProducts({ sort, order: "asc" }).map((p) => p[sort]);
    const desc = listProducts({ sort, order: "desc" }).map((p) => p[sort]);
    const sortedAsc = [...asc].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    expect(asc).toEqual(sortedAsc);
    expect(desc).toEqual([...sortedAsc].reverse());
  });

  it("orders price numerically", () => {
    const prices = listProducts({ sort: "price", order: "asc" }).map((p) => p.price);
    expect(prices[0]).toBe(0);
    expect(prices[prices.length - 1]).toBe(3480);
    expect(prices.indexOf(90)).toBeLessThan(prices.indexOf(120));
    expect(prices.indexOf(950)).toBeLessThan(prices.indexOf(1200));
  });

  it("breaks ties by id ascending in both directions", () => {
    const asc = listProducts({ sort: "price", order: "asc" }).filter((p) => p.price === 120);
    const desc = listProducts({ sort: "price", order: "desc" }).filter((p) => p.price === 120);
    expect(asc.map((p) => p.code)).toEqual(["ST-001", "ST-002"]);
    expect(desc.map((p) => p.code)).toEqual(["ST-001", "ST-002"]);
  });

  it("defaults to code ascending when sort is omitted", () => {
    expect(listProducts({ keyword: "PC" }).map((p) => p.code)).toEqual(
      listProducts({ keyword: "PC", sort: "code", order: "asc" }).map((p) => p.code),
    );
  });

  it("combines keyword and sort", () => {
    const codes = listProducts({ keyword: "PC-00", sort: "price", order: "desc" }).map((p) => p.code);
    expect(codes).toEqual(["PC-005", "PC-002", "PC-003", "PC-004", "PC-001"]);
  });
});

describe("updateProduct", () => {
  const input = { name: "新しい名前", category: "新カテゴリ", price: 999, note: null };

  it("updates the four fields and updated_at, returning the new row", async () => {
    const id = insert("U-1", "old", "cat", 1);
    const before = getProduct(id)!;
    await new Promise((r) => setTimeout(r, 5));
    const updated = updateProduct(id, { ...input, note: "メモ" });
    expect(updated).toMatchObject({ id, code: "U-1", ...input, note: "メモ" });
    expect(updated!.updated_at > before.updated_at).toBe(true);
    expect(getProduct(id)).toEqual(updated);
  });

  it("keeps id, code, and created_at unchanged", () => {
    const id = insert("U-2", "old", "cat", 1);
    const before = getProduct(id)!;
    const updated = updateProduct(id, input)!;
    expect(updated.id).toBe(id);
    expect(updated.code).toBe("U-2");
    expect(updated.created_at).toBe(before.created_at);
  });

  it("returns null when the product does not exist", () => {
    expect(updateProduct(999999, input)).toBeNull();
    const id = insert("U-3", "old", "cat", 1);
    deleteProduct(id);
    expect(updateProduct(id, input)).toBeNull();
  });

  it("is reflected in list and search", () => {
    const id = insert("U-4", "old", "cat", 1);
    updateProduct(id, { ...input, name: "ユニーク検索語" });
    expect(listProducts({ keyword: "ユニーク検索語" }).map((p) => p.id)).toEqual([id]);
    expect(listProducts({ keyword: "old" })).toHaveLength(0);
    const prices = listProducts({ sort: "price", order: "desc" }).map((p) => p.price);
    expect(prices).toContain(999);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});

describe("bookmark", () => {
  it("defaults to false for every product", () => {
    const list = listProducts();
    expect(list.every((p) => p.bookmarked === false)).toBe(true);
    expect(typeof list[0].bookmarked).toBe("boolean");
  });

  it("sets and clears the flag, returning the number of affected rows", () => {
    const id = insert("B-1", "b", "cat");
    expect(setBookmark(id, true)).toBe(1);
    expect(getProduct(id)!.bookmarked).toBe(true);
    expect(setBookmark(id, true)).toBe(1);
    expect(setBookmark(id, false)).toBe(1);
    expect(getProduct(id)!.bookmarked).toBe(false);
  });

  it("returns 0 for a missing product", () => {
    expect(setBookmark(999999, true)).toBe(0);
  });

  it("does not change updated_at", () => {
    const id = insert("B-2", "b", "cat");
    const before = getProduct(id)!.updated_at;
    setBookmark(id, true);
    expect(getProduct(id)!.updated_at).toBe(before);
  });

  it("filters with bookmarkedOnly, combined with keyword and sort", () => {
    const a = insert("B-3", "alpha", "zz", 10);
    const b = insert("B-4", "beta", "zz", 30);
    insert("B-5", "gamma", "zz", 20);
    setBookmark(a, true);
    setBookmark(b, true);
    expect(listProducts({ bookmarkedOnly: true }).map((p) => p.code)).toEqual(["B-3", "B-4"]);
    expect(listProducts({ bookmarkedOnly: true, keyword: "beta" }).map((p) => p.code)).toEqual(["B-4"]);
    expect(listProducts({ bookmarkedOnly: true, sort: "price", order: "desc" }).map((p) => p.code)).toEqual(["B-4", "B-3"]);
    expect(listProducts({ bookmarkedOnly: false, keyword: "zz" })).toHaveLength(3);
    expect(listProducts({ keyword: "zz" })).toHaveLength(3);
  });

  it("disappears with the product when deleted", () => {
    const id = insert("B-6", "b", "cat");
    setBookmark(id, true);
    deleteProduct(id);
    expect(getProduct(id)).toBeNull();
    expect(listProducts({ bookmarkedOnly: true }).some((p) => p.id === id)).toBe(false);
  });
});
