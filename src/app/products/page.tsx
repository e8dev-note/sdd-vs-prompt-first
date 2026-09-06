import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { SortHeader } from "@/components/sort-header";
import { parseSortParams } from "@/lib/list-url";
import { listProducts } from "@/lib/products";

type Query = { q?: string | string[]; sort?: string | string[]; order?: string | string[] };

type Props = {
  searchParams: Promise<Query>;
};

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = await searchParams;
  const keyword = firstValue(query.q) ?? "";
  const rawSort = firstValue(query.sort);
  const current = parseSortParams(rawSort, firstValue(query.order));
  // URL に sort があるときだけ検索フォームに引き継がせる(初期表示では hidden を出さない)
  const formSort = rawSort !== undefined ? current : undefined;
  const products = listProducts({ keyword, sort: current.sort, order: current.order });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">商品一覧</h1>
      <SearchForm keyword={keyword} sort={formSort} />
      {products.length === 0 ? (
        <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {keyword.trim() === ""
            ? "商品は登録されていません。"
            : `「${keyword}」に該当する商品はありません。`}
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-gray-700">
              <SortHeader column="code" label="code" current={current} keyword={keyword} />
              <SortHeader column="name" label="name" current={current} keyword={keyword} />
              <SortHeader column="category" label="category" current={current} keyword={keyword} />
              <SortHeader column="price" label="price" current={current} keyword={keyword} align="right" />
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
