import Link from "next/link";
import { notFound } from "next/navigation";
import { bootstrap } from "@/lib/bootstrap";
import { getProduct } from "@/lib/products";
import { DeleteButton } from "@/components/delete-button";
import { deleteProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  bootstrap();
  const { id: rawId } = await props.params;
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
      <h1 className="mb-4 text-2xl font-semibold">商品詳細</h1>
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
      <form action={deleteProductAction} className="mt-6">
        <input type="hidden" name="id" value={product.id} />
        <DeleteButton />
      </form>
    </main>
  );
}
