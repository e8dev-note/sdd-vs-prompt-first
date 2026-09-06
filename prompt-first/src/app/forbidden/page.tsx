import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">権限がありません</h1>
      <p className="mb-4 text-zinc-600">この操作を行う権限がありません。管理者に確認してください。</p>
      <Link href="/products" className="text-blue-700 underline">
        一覧に戻る
      </Link>
    </main>
  );
}
