import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, buildProductsUrl, nextSortState, parseSortParams } from "@/lib/list-url";

describe("parseSortParams", () => {
  it("returns the default when sort is missing or invalid", () => {
    expect(parseSortParams(undefined, undefined)).toEqual(DEFAULT_SORT);
    expect(parseSortParams("x", "desc")).toEqual(DEFAULT_SORT);
    expect(parseSortParams("PRICE", "desc")).toEqual(DEFAULT_SORT);
    expect(parseSortParams("", "desc")).toEqual(DEFAULT_SORT);
  });

  it("uses asc when order is missing or invalid", () => {
    expect(parseSortParams("name", undefined)).toEqual({ sort: "name", order: "asc" });
    expect(parseSortParams("name", "down")).toEqual({ sort: "name", order: "asc" });
    expect(parseSortParams("name", "DESC")).toEqual({ sort: "name", order: "asc" });
  });

  it("accepts every valid column and both directions", () => {
    for (const sort of ["code", "name", "category", "price"] as const) {
      expect(parseSortParams(sort, "asc")).toEqual({ sort, order: "asc" });
      expect(parseSortParams(sort, "desc")).toEqual({ sort, order: "desc" });
    }
  });
});

describe("nextSortState", () => {
  it("flips the direction when the same column is clicked", () => {
    expect(nextSortState({ sort: "price", order: "asc" }, "price")).toEqual({ sort: "price", order: "desc" });
    expect(nextSortState({ sort: "price", order: "desc" }, "price")).toEqual({ sort: "price", order: "asc" });
  });

  it("starts ascending when a different column is clicked", () => {
    expect(nextSortState({ sort: "price", order: "desc" }, "name")).toEqual({ sort: "name", order: "asc" });
    expect(nextSortState(DEFAULT_SORT, "category")).toEqual({ sort: "category", order: "asc" });
  });
});

describe("buildProductsUrl", () => {
  it("returns /products with no params", () => {
    expect(buildProductsUrl({})).toBe("/products");
    expect(buildProductsUrl({ keyword: "" })).toBe("/products");
    expect(buildProductsUrl({ keyword: "   " })).toBe("/products");
  });

  it("adds q, sort, and order", () => {
    expect(buildProductsUrl({ keyword: "pen" })).toBe("/products?q=pen");
    expect(buildProductsUrl({ sort: { sort: "price", order: "desc" } })).toBe("/products?sort=price&order=desc");
    expect(buildProductsUrl({ keyword: "pen", sort: { sort: "name", order: "asc" } })).toBe(
      "/products?q=pen&sort=name&order=asc",
    );
  });

  it("encodes the keyword", () => {
    expect(buildProductsUrl({ keyword: "ホチキス" })).toBe("/products?q=%E3%83%9B%E3%83%81%E3%82%AD%E3%82%B9");
    expect(buildProductsUrl({ keyword: "a&b=c" })).toBe("/products?q=a%26b%3Dc");
  });
});
