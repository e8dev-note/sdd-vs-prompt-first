import Link from "next/link";
import { buildProductsUrl, type SortState } from "@/lib/list-url";

type Props = {
  active: boolean;
  keyword: string;
  sort?: SortState;
};

/** 「ブックマークのみ表示」の切り替え。リンクなので JS 不要。検索条件と並び順は保持する。 */
export function BookmarkFilterToggle({ active, keyword, sort }: Props) {
  return (
    <Link
      href={buildProductsUrl({ keyword, sort, bookmarked: !active })}
      aria-pressed={active}
      role="button"
      className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm ${
        active
          ? "border-amber-500 bg-amber-100 text-amber-900"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
      ブックマークのみ表示
    </Link>
  );
}
