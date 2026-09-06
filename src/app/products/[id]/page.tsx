import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { getProduct, parseProductId } from "@/lib/products";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const id = parseProductId((await params).id);
  if (id === null) notFound();
  const product = getProduct(id);
  if (product === null) notFound();

  const rows: [string, string | number][] = [
    ["id", product.id],
    ["code", product.code],
    ["name", product.name],
    ["category", product.category],
    ["price", product.price],
    ["note", product.note ?? ""],
    ["created_at", product.created_at],
    ["updated_at", product.updated_at],
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">商品詳細</h1>
        <Link href="/products" className="text-sm text-blue-700 underline">
          一覧へ戻る
        </Link>
      </div>
      <dl className="grid grid-cols-[10rem_1fr] gap-y-2 rounded border border-gray-200 bg-white p-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-medium text-gray-600">{label}</dt>
            <dd className="text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      <DeleteButton id={product.id} />
    </section>
  );
}
