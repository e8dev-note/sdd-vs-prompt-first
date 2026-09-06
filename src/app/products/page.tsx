import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { listProducts } from "@/lib/products";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function firstValue(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function ProductsPage({ searchParams }: Props) {
  const keyword = firstValue((await searchParams).q);
  const products = listProducts({ keyword });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">商品一覧</h1>
      <SearchForm keyword={keyword} />
      {products.length === 0 ? (
        <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {keyword.trim() === ""
            ? "商品は登録されていません。"
            : `「${keyword}」に該当する商品はありません。`}
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-left text-gray-700">
              <th className="px-3 py-2">code</th>
              <th className="px-3 py-2">name</th>
              <th className="px-3 py-2">category</th>
              <th className="px-3 py-2 text-right">price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono">
                  <Link href={`/products/${p.id}`} className="text-blue-700 underline">
                    {p.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.category}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-gray-500">{products.length} 件</p>
    </section>
  );
}
