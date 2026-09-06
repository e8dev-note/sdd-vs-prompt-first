import Link from "next/link";
import type { SortColumn, SortOrder } from "@/lib/products";

type Props = {
  column: SortColumn;
  label: string;
  currentSort: SortColumn;
  currentOrder: SortOrder;
  /** 並び替えリンクに引き継ぐクエリ(q, bookmarked など)。 */
  preserved: Record<string, string>;
  align?: "left" | "right";
};

/** クリックで並び替えを切り替える列ヘッダ。検索・フィルタ条件は維持する。 */
export function SortHeader({ column, label, currentSort, currentOrder, preserved, align = "left" }: Props) {
  const active = column === currentSort;
  const nextOrder: SortOrder = active && currentOrder === "asc" ? "desc" : "asc";
  const params = new URLSearchParams(preserved);
  params.set("sort", column);
  params.set("order", nextOrder);
  const indicator = active ? (currentOrder === "asc" ? "▲" : "▼") : "";

  return (
    <th
      scope="col"
      aria-sort={active ? (currentOrder === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={`/products?${params.toString()}`}
        className={`inline-flex items-center gap-1 hover:underline ${active ? "font-semibold text-blue-700" : ""}`}
      >
        {label}
        <span aria-hidden="true" className="w-3 text-xs">
          {indicator}
        </span>
      </Link>
    </th>
  );
}
