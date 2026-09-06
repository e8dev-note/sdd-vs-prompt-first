import { describe, expect, it } from "vitest";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword / verifyPassword", () => {
  it("produces a self-describing scrypt string that is not the plain text", () => {
    const h = hashPassword("admin1234");
    expect(h).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    expect(h).not.toContain("admin1234");
  });

  it("round-trips and uses a different salt each time", () => {
    const a = hashPassword("secret");
    const b = hashPassword("secret");
    expect(a).not.toBe(b);
    expect(verifyPassword("secret", a)).toBe(true);
    expect(verifyPassword("secret", b)).toBe(true);
  });

  it("rejects a wrong or empty password", () => {
    const h = hashPassword("secret");
    expect(verifyPassword("Secret", h)).toBe(false);
    expect(verifyPassword("secret ", h)).toBe(false);
    expect(verifyPassword("", h)).toBe(false);
  });

  it("returns false for malformed stored values instead of throwing", () => {
    for (const bad of ["", "plain", "scrypt$x$y$z", "scrypt$16384$8$1$abc", "bcrypt$1$2$3$a$b"]) {
      expect(verifyPassword("secret", bad), bad).toBe(false);
    }
  });

  it("exposes a dummy hash that never matches but is verifiable", () => {
    expect(DUMMY_HASH).toMatch(/^scrypt\$/);
    expect(verifyPassword("anything", DUMMY_HASH)).toBe(false);
  });
});
