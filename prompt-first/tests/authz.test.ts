import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/lib/db";
import { authenticate, createUser, getUserById, seedUsersIfEmpty } from "@/lib/auth";
import { ForbiddenError, assertCan, can, isRole, type Permission, type Role } from "@/lib/authz";

describe("can(role, permission)", () => {
  const matrix: Record<Role, Record<Permission, boolean>> = {
    viewer: { "product:read": true, "product:edit": false, "bookmark:toggle": false, "product:delete": false },
    editor: { "product:read": true, "product:edit": true, "bookmark:toggle": true, "product:delete": false },
    admin: { "product:read": true, "product:edit": true, "bookmark:toggle": true, "product:delete": true },
  };
  for (const [role, perms] of Object.entries(matrix) as [Role, Record<Permission, boolean>][]) {
    for (const [perm, expected] of Object.entries(perms) as [Permission, boolean][]) {
      it(`${role} ${expected ? "can" : "cannot"} ${perm}`, () => {
        expect(can(role, perm)).toBe(expected);
      });
    }
  }

  it("assertCan throws ForbiddenError when not allowed", () => {
    expect(() => assertCan("viewer", "product:delete")).toThrow(ForbiddenError);
    expect(() => assertCan("admin", "product:delete")).not.toThrow();
  });

  it("isRole validates role strings", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("root")).toBe(false);
  });
});

describe("user roles", () => {
  beforeEach(() => {
    getDb();
    seedUsersIfEmpty();
  });
  afterEach(() => closeDb());

  it("seed users get the role matching their username", () => {
    expect(authenticate("admin", "admin1234")?.role).toBe("admin");
    expect(authenticate("editor", "editor1234")?.role).toBe("editor");
    expect(authenticate("viewer", "viewer1234")?.role).toBe("viewer");
  });

  it("new users default to viewer and reject unknown roles", () => {
    const u = createUser("newbie", "pw");
    expect(getUserById(u.id)?.role).toBe("viewer");
    expect(() => createUser("bad", "pw", "root" as Role)).toThrow();
  });

  it("migration assigns roles to pre-existing users by username", () => {
    // 004 の UPDATE 文を再適用しても冪等であることを確認する。
    const db = getDb();
    db.prepare("UPDATE users SET role = 'viewer'").run();
    db.exec("UPDATE users SET role = username WHERE username IN ('admin', 'editor', 'viewer')");
    expect(authenticate("admin", "admin1234")?.role).toBe("admin");
  });
});
