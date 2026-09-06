"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const inputClass = "w-full rounded border border-zinc-300 px-3 py-1.5";
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium">
          username
        </label>
        <input id="username" name="username" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-800 px-4 py-1.5 text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
