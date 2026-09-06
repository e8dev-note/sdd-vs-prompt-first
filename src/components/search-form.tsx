import Link from "next/link";
import { buildProductsUrl, type SortState } from "@/lib/list-url";

type Props = {
  keyword: string;
  /** 指定時は hidden で sort / order を引き継ぐ(GET フォームは action のクエリを捨てるため) */
  sort?: SortState;
};

/** GET フォーム。送信すると ?q= が URL に付き、サーバ側で絞り込む。JS 不要。 */
export function SearchForm({ keyword, sort }: Props) {
  return (
    <form method="get" action="/products" className="flex gap-2" role="search">
      <label htmlFor="q" className="sr-only">
        キーワード
      </label>
      <input
        id="q"
        type="text"
        name="q"
        defaultValue={keyword}
        placeholder="code / name / category で検索"
        className="w-80 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
      />
      {sort && (
        <>
          <input type="hidden" name="sort" value={sort.sort} />
          <input type="hidden" name="order" value={sort.order} />
        </>
      )}
      <button
        type="submit"
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        検索
      </button>
      {keyword !== "" && (
        <Link href={buildProductsUrl({ sort })} className="self-center text-sm text-blue-700 underline">
          クリア
        </Link>
      )}
    </form>
  );
}
