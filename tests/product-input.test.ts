import { describe, expect, it } from "vitest";
import { validateProductInput, type RawProductInput } from "@/lib/product-input";

const valid: RawProductInput = { name: "ペン", category: "文房具", price: "120", note: "黒" };

describe("validateProductInput", () => {
  it("accepts a valid input and normalizes it", () => {
    const r = validateProductInput(valid);
    expect(r).toEqual({ ok: true, value: { name: "ペン", category: "文房具", price: 120, note: "黒" } });
  });

  it("trims name and category, and turns empty note into null", () => {
    const r = validateProductInput({ ...valid, name: "  ペン  ", category: "\t文房具\n", note: "   " });
    expect(r).toEqual({ ok: true, value: { name: "ペン", category: "文房具", price: 120, note: null } });
    expect(validateProductInput({ ...valid, note: "" })).toMatchObject({ ok: true, value: { note: null } });
    expect(validateProductInput({ ...valid, note: null })).toMatchObject({ ok: true, value: { note: null } });
  });

  it("requires name and category", () => {
    for (const bad of ["", "   ", null]) {
      expect(validateProductInput({ ...valid, name: bad })).toEqual({ ok: false, errors: { name: "必須です" } });
      expect(validateProductInput({ ...valid, category: bad })).toEqual({ ok: false, errors: { category: "必須です" } });
    }
  });

  it("requires price to be a non-negative integer", () => {
    for (const bad of ["", "  ", null, "1.5", "-1", "abc", "1e3", "12a", "１２", "99999999999999999999"]) {
      expect(validateProductInput({ ...valid, price: bad }), String(bad)).toEqual({
        ok: false,
        errors: { price: "0 以上の整数で入力してください" },
      });
    }
    expect(validateProductInput({ ...valid, price: "0" })).toMatchObject({ ok: true, value: { price: 0 } });
    expect(validateProductInput({ ...valid, price: "0042" })).toMatchObject({ ok: true, value: { price: 42 } });
    expect(validateProductInput({ ...valid, price: " 12 " })).toMatchObject({ ok: true, value: { price: 12 } });
  });

  it("reports all invalid fields at once", () => {
    const r = validateProductInput({ name: "", category: " ", price: "x", note: null });
    expect(r).toEqual({
      ok: false,
      errors: { name: "必須です", category: "必須です", price: "0 以上の整数で入力してください" },
    });
  });
});
