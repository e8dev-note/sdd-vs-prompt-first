// lib の中で唯一 Next の request API(cookies / redirect)に依存するモジュール。
// 純粋なロジックは password.ts / session.ts / users.ts にあり、ここは薄い配線層。
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";
import { getUserById, type User } from "./users";

export const SESSION_COOKIE = "session";

/** Cookie → セッション(期限内) → ユーザー。いずれか無効なら null。同一リクエスト内は 1 回だけ DB 照合する。 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = getSession(id);
  if (!session) return null;
  return getUserById(session.userId);
});

/** 未ログインなら /login へ(returnTo があれば付けて)。ページと Server Action の先頭で呼ぶ。 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/** Server Action 専用。HttpOnly / SameSite=Lax / Path=/、期限はセッションと同じ。Secure はローカル http のため付けない。 */
export async function setSessionCookie(session: Session): Promise<void> {
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

/** Server Action 専用。 */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
