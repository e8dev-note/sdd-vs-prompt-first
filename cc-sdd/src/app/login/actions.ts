"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { safeReturnTo } from "@/lib/list-url";
import { createSession, deleteSession } from "@/lib/session";
import { authenticate } from "@/lib/users";

export type LoginState = { error?: string; username?: string };

const LOGIN_ERROR = "username か password が正しくありません";

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/** useActionState 用。成功時は redirect するので戻らない。失敗時は同一メッセージと username(password は返さない)。 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = text(formData, "username").trim();
  const password = text(formData, "password");
  const user = authenticate(username, password);
  if (!user) {
    return { error: LOGIN_ERROR, username };
  }
  const session = createSession(user.id);
  await setSessionCookie(session);
  redirect(safeReturnTo(text(formData, "returnTo")));
}

/** サーバ側のセッションを破棄し、Cookie を無効化して /login へ。JS 不要。 */
export async function logoutAction(): Promise<void> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (id) deleteSession(id);
  await clearSessionCookie();
  redirect("/login");
}
