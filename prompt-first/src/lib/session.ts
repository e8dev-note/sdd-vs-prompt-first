import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getUserBySessionToken, type User } from "./auth";
import { bootstrap } from "./bootstrap";

/** リクエストの Cookie からログイン中ユーザーを返す。未ログインなら null。 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  bootstrap();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token) ?? null;
});

/** ログイン必須。未ログインなら /login にリダイレクトする(returnTo 付き)。 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const q = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${q}`);
  }
  return user;
}
