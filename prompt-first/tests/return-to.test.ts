import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/return-to";

describe("safeReturnTo", () => {
  it("allows internal paths only", () => {
    expect(safeReturnTo("/products/3?q=a")).toBe("/products/3?q=a");
    expect(safeReturnTo("https://evil.example")).toBe("/products");
    expect(safeReturnTo("//evil.example")).toBe("/products");
    expect(safeReturnTo(undefined)).toBe("/products");
  });
});
