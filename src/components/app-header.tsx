import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { getCurrentUser } from "@/lib/auth";

/** Server Component。ログイン中は username とログアウト(フォーム、JS 不要)を表示する。 */
export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <Link href="/products" className="text-base font-semibold text-gray-900">
          商品マスタ管理
        </Link>
        {user && (
          <>
            <nav className="text-sm">
              <Link href="/products" className="text-blue-700 underline">
                商品一覧
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3 text-sm text-gray-700">
              <span>
                ログイン中: <span className="font-medium text-gray-900">{user.username}</span>
                <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{user.role}</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded border border-gray-300 px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
