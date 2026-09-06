import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";

/** 共通ヘッダ。ログイン中は username とログアウトボタンを表示する。 */
export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b bg-zinc-50">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-2 text-sm">
        <Link href="/products" className="font-semibold">
          商品マスタ管理
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span>
              <span className="text-zinc-500">ログイン中: </span>
              <span className="font-medium">{user.username}</span>
              <span className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-700">{user.role}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100">
                ログアウト
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-blue-700 underline">
            ログイン
          </Link>
        )}
      </div>
    </header>
  );
}
