import Link from "next/link";
import { buildProductsUrl, nextSortState, type SortState } from "@/lib/list-url";
import type { SortColumn } from "@/lib/products";

type Props = {
  column: SortColumn;
  label: string;
  current: SortState;
  keyword: string;
  align?: "left" | "right";
};

/** クリックで並び替えを切り替える列ヘッダ。リンクなので JS 不要。ソート中の列にだけ印と aria-sort を付ける。 */
export function SortHeader({ column, label, current, keyword, align = "left" }: Props) {
  const active = current.sort === column;
  const href = buildProductsUrl({ keyword, sort: nextSortState(current, column) });
  const ariaSort = active ? (current.order === "asc" ? "ascending" : "descending") : undefined;
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:underline ${active ? "text-gray-900" : "text-gray-700"}`}
      >
        {label}
        {active && (
          <span aria-hidden="true" className="text-xs">
            {current.order === "asc" ? "▲" : "▼"}
          </span>
        )}
      </Link>
    </th>
  );
}
