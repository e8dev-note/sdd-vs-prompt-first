import Link from "next/link";
import { BookmarkFilterToggle } from "@/components/bookmark-filter-toggle";
import { BookmarkToggle } from "@/components/bookmark-toggle";
import { SearchForm } from "@/components/search-form";
import { SortHeader } from "@/components/sort-header";
import { buildProductsUrl, parseBookmarkedParam, parseSortParams } from "@/lib/list-url";
import { listProducts } from "@/lib/products";

type Query = {
  q?: string | string[];
  sort?: string | string[];
  order?: string | string[];
  bookmarked?: string | string[];
};

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
  const bookmarked = parseBookmarkedParam(firstValue(query.bookmarked));
  const products = listProducts({ keyword, sort: current.sort, order: current.order, bookmarkedOnly: bookmarked });
  // トグル操作後に戻る URL(現在の q / sort / order / bookmarked)
  const returnTo = buildProductsUrl({ keyword, sort: formSort, bookmarked });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">商品一覧</h1>
      <div className="flex flex-wrap items-center gap-3">
        <SearchForm keyword={keyword} sort={formSort} bookmarked={bookmarked} />
        <BookmarkFilterToggle active={bookmarked} keyword={keyword} sort={formSort} />
      </div>
      {products.length === 0 ? (
        <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {bookmarked
            ? keyword.trim() === ""
              ? "ブックマークした商品はありません。"
              : `「${keyword}」に該当するブックマークした商品はありません。`
            : keyword.trim() === ""
              ? "商品は登録されていません。"
              : `「${keyword}」に該当する商品はありません。`}
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-gray-700">
              <th scope="col" className="w-10 px-2 py-2">
                <span className="sr-only">ブックマーク</span>
              </th>
              <SortHeader column="code" label="code" current={current} keyword={keyword} bookmarked={bookmarked} />
              <SortHeader column="name" label="name" current={current} keyword={keyword} bookmarked={bookmarked} />
              <SortHeader column="category" label="category" current={current} keyword={keyword} bookmarked={bookmarked} />
              <SortHeader column="price" label="price" current={current} keyword={keyword} bookmarked={bookmarked} align="right" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-gray-200 ${p.bookmarked ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}`}
              >
                <td className="px-2 py-1 text-center">
                  <BookmarkToggle id={p.id} bookmarked={p.bookmarked} returnTo={returnTo} />
                </td>
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
