"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  authenticate,
  createSession,
  deleteSession,
  purgeExpiredSessions,
} from "@/lib/auth";
import { bootstrap } from "@/lib/bootstrap";
import { safeReturnTo } from "@/lib/return-to";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  bootstrap();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = authenticate(username, password);
  if (!user) {
    return { error: "username または password が正しくありません" };
  }
  purgeExpiredSessions();
  const { token, expiresAt } = createSession(user.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
