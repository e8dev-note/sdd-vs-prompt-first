import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getProduct } from "@/lib/products";
import { DeleteButton } from "@/components/delete-button";
import { EditProductModal } from "@/components/edit-product-modal";
import { BookmarkToggle } from "@/components/bookmark-toggle";
import { deleteProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id: rawId } = await props.params;
  const user = await requireUser(`/products/${rawId}`);
  const id = Number(rawId);
  const product = Number.isInteger(id) ? getProduct(id) : undefined;
  if (!product) notFound();

  const rows: [string, string][] = [
    ["id", String(product.id)],
    ["code", product.code],
    ["name", product.name],
    ["category", product.category],
    ["price", product.price.toLocaleString()],
    ["note", product.note ?? ""],
    ["bookmarked", product.bookmarked ? "ブックマーク中" : "なし"],
    ["created_at", product.created_at],
    ["updated_at", product.updated_at],
  ];

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <p className="mb-4 text-sm">
        <Link href="/products" className="text-blue-700 underline">
          ← 一覧に戻る
        </Link>
      </p>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">商品詳細</h1>
        <BookmarkToggle
          id={product.id}
          bookmarked={product.bookmarked === 1}
          withLabel
          canToggle={can(user.role, "bookmark:toggle")}
        />
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b">
              <th className="w-32 bg-zinc-100 px-3 py-2 text-left font-medium">{k}</th>
              <td className="px-3 py-2 whitespace-pre-wrap">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 flex items-center gap-3">
        {can(user.role, "product:edit") && <EditProductModal product={product} />}
        {can(user.role, "product:delete") && (
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <DeleteButton />
          </form>
        )}
        {!can(user.role, "product:edit") && !can(user.role, "product:delete") && (
          <p className="text-sm text-zinc-500">閲覧のみ(編集・削除の権限がありません)</p>
        )}
      </div>
    </main>
  );
}
