import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">商品が見つかりません</h1>
      <p className="mb-4 text-zinc-600">指定された商品は存在しないか、削除されています。</p>
      <Link href="/products" className="text-blue-700 underline">
        一覧に戻る
      </Link>
    </main>
  );
}
