export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** 3 値以外(null / 空 / 未知)は最小権限の viewer。 */
export function parseRole(raw: unknown): Role {
  return typeof raw === "string" && (ROLES as readonly string[]).includes(raw) ? (raw as Role) : "viewer";
}

export const PERMISSIONS = ["product:view", "product:edit", "product:delete", "bookmark:toggle"] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** 唯一の権限表。画面の出し分けとサーバ側の検査の両方がこれを参照する。 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ["product:view"],
  editor: ["product:view", "product:edit", "bookmark:toggle"],
  admin: ["product:view", "product:edit", "bookmark:toggle", "product:delete"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
