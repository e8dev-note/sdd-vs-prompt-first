import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">商品が見つかりません</h1>
      <p className="text-sm text-gray-700">指定された商品は存在しないか、削除されています。</p>
      <Link href="/products" className="text-sm text-blue-700 underline">
        商品一覧へ戻る
      </Link>
    </section>
  );
}
