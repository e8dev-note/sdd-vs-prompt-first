import Link from "next/link";

/** 権限のない操作の着地先(403 相当)。Proxy の対象外なのでログインなしでも表示できる。 */
export default function ForbiddenPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">この操作を行う権限がありません</h1>
      <p className="text-sm text-gray-700">
        要求された操作は現在のロールでは許可されていません。操作は実行されていません。
      </p>
      <Link href="/products" className="text-sm text-blue-700 underline">
        商品一覧へ戻る
      </Link>
    </section>
  );
}
