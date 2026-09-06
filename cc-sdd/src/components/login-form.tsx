"use client";

import { useActionState } from "react";
import { type LoginState, loginAction } from "@/app/login/actions";

type Props = { returnTo?: string };

const inputClass = "w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900";

export function LoginForm({ returnTo }: Props) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <div className="space-y-1">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          defaultValue={state.username ?? ""}
          autoFocus
          required
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
