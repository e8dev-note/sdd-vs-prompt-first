import Link from "next/link";
import { bootstrap } from "@/lib/bootstrap";
import {
  DEFAULT_ORDER,
  DEFAULT_SORT,
  isSortColumn,
  isSortOrder,
  listProducts,
} from "@/lib/products";
import { SearchForm } from "@/components/search-form";
import { SortHeader } from "@/components/sort-header";

export const dynamic = "force-dynamic";

export default async function ProductsPage(props: PageProps<"/products">) {
  bootstrap();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sort = isSortColumn(sp.sort) ? sp.sort : DEFAULT_SORT;
  const order = isSortOrder(sp.order) ? sp.order : DEFAULT_ORDER;
  const products = listProducts({ keyword: q, sort, order });
  const headerProps = { currentSort: sort, currentOrder: order, keyword: q };

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">商品一覧</h1>
      <SearchForm initialQuery={q} preserved={{ sort, order }} />
      <p className="mb-2 text-sm text-zinc-600">{products.length} 件</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-zinc-100 text-left">
              <SortHeader column="code" label="code" {...headerProps} />
              <SortHeader column="name" label="name" {...headerProps} />
              <SortHeader column="category" label="category" {...headerProps} />
              <SortHeader column="price" label="price" align="right" {...headerProps} />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  該当する商品はありません
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-zinc-50">
                  <td className="px-3 py-2 font-mono">
                    <Link href={`/products/${p.id}`} className="text-blue-700 underline">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2 text-right">{p.price.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
