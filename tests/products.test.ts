import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/lib/db";
import {
  countProducts,
  createProduct,
  deleteProduct,
  isSortColumn,
  isSortOrder,
  getProduct,
  listProducts,
} from "@/lib/products";
import { SEED_PRODUCTS, seedIfEmpty } from "@/lib/seed";

beforeEach(() => {
  getDb();
  seedIfEmpty();
});
afterEach(() => closeDb());

describe("migrations / seed", () => {
  it("creates products table and seeds 20 rows once", () => {
    expect(countProducts()).toBe(SEED_PRODUCTS.length);
    expect(seedIfEmpty()).toBe(0);
    expect(countProducts()).toBe(SEED_PRODUCTS.length);
  });
});

describe("listProducts", () => {
  it("returns all rows ordered by code when keyword is empty", () => {
    const rows = listProducts("");
    expect(rows).toHaveLength(SEED_PRODUCTS.length);
    expect(rows.map((r) => r.code)).toEqual([...rows.map((r) => r.code)].sort());
  });

  it("matches code, name, or category partially", () => {
    expect(listProducts("P-001").map((r) => r.code)).toEqual([
      "P-0010", "P-0011", "P-0012", "P-0013", "P-0014",
      "P-0015", "P-0016", "P-0017", "P-0018", "P-0019",
    ]);
    expect(listProducts("ボールペン")).toHaveLength(2);
    expect(listProducts("書籍")).toHaveLength(4);
    expect(listProducts("存在しない")).toHaveLength(0);
  });

  it("escapes LIKE wildcards", () => {
    createProduct({ code: "X_1", name: "wild", category: "test", price: 1, note: null });
    expect(listProducts("_1").map((r) => r.code)).toEqual(["X_1"]);
    expect(listProducts("%")).toHaveLength(0);
  });
});

describe("getProduct / deleteProduct", () => {
  it("gets by id and returns undefined for missing id", () => {
    const first = listProducts()[0];
    expect(getProduct(first.id)?.code).toBe(first.code);
    expect(getProduct(999999)).toBeUndefined();
  });

  it("deletes a row and reports whether anything was deleted", () => {
    const first = listProducts()[0];
    expect(deleteProduct(first.id)).toBe(true);
    expect(getProduct(first.id)).toBeUndefined();
    expect(deleteProduct(first.id)).toBe(false);
    expect(countProducts()).toBe(SEED_PRODUCTS.length - 1);
  });
});

describe("listProducts sorting", () => {
  it("defaults to code ascending", () => {
    const codes = listProducts({}).map((r) => r.code);
    expect(codes).toEqual([...codes].sort());
  });

  it("sorts by price descending", () => {
    const prices = listProducts({ sort: "price", order: "desc" }).map((r) => r.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("sorts by name ascending and by category descending", () => {
    const names = listProducts({ sort: "name", order: "asc" }).map((r) => r.name);
    expect(names).toEqual([...names].sort());
    const cats = listProducts({ sort: "category", order: "desc" }).map((r) => r.category);
    expect(cats).toEqual([...cats].sort().reverse());
  });

  it("combines keyword and sort", () => {
    const rows = listProducts({ keyword: "書籍", sort: "price", order: "asc" });
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.price)).toEqual([2400, 2800, 3200, 3600]);
  });

  it("validates sort column and order", () => {
    expect(isSortColumn("price")).toBe(true);
    expect(isSortColumn("id")).toBe(false);
    expect(isSortColumn("code; DROP TABLE products")).toBe(false);
    expect(isSortOrder("desc")).toBe(true);
    expect(isSortOrder("DESC")).toBe(false);
  });
});
