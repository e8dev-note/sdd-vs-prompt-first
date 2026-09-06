import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, can, parseRole, type Permission, type Role } from "@/lib/authz";

// 権限表(要件 2.1〜2.4)。表の変更は必ずここに現れる。
const MATRIX: Record<Role, Record<Permission, boolean>> = {
  viewer: { "product:view": true, "product:edit": false, "bookmark:toggle": false, "product:delete": false },
  editor: { "product:view": true, "product:edit": true, "bookmark:toggle": true, "product:delete": false },
  admin: { "product:view": true, "product:edit": true, "bookmark:toggle": true, "product:delete": true },
};

describe("can", () => {
  it.each(ROLES.flatMap((role) => PERMISSIONS.map((p) => [role, p] as const)))("%s × %s", (role, permission) => {
    expect(can(role, permission)).toBe(MATRIX[role][permission]);
  });

  it("grants nothing outside the enumerated permissions", () => {
    for (const role of ROLES) {
      expect(new Set(ROLE_PERMISSIONS[role]).size).toBe(ROLE_PERMISSIONS[role].length);
      for (const p of ROLE_PERMISSIONS[role]) expect(PERMISSIONS).toContain(p);
    }
    expect(can("admin", "product:destroy" as Permission)).toBe(false);
  });
});

describe("parseRole", () => {
  it("accepts the three roles and falls back to viewer otherwise", () => {
    expect(parseRole("admin")).toBe("admin");
    expect(parseRole("editor")).toBe("editor");
    expect(parseRole("viewer")).toBe("viewer");
    for (const bad of ["ADMIN", "root", "", null, undefined, 1, " admin"]) {
      expect(parseRole(bad), String(bad)).toBe("viewer");
    }
  });
});
