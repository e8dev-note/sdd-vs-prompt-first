export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "product:read",
  "product:edit",
  "product:delete",
  "bookmark:toggle",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** ロールごとの権限。上位ロールは下位の権限を含む。 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ["product:read"],
  editor: ["product:read", "product:edit", "bookmark:toggle"],
  admin: ["product:read", "product:edit", "bookmark:toggle", "product:delete"],
};

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`forbidden: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** 権限がなければ ForbiddenError を投げる。サーバアクションの入口で使う。 */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
