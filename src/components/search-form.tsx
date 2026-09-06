import Link from "next/link";

type Props = {
  initialQuery: string;
  /** 「ブックマークのみ表示」の初期状態。 */
  bookmarkedOnly: boolean;
  /** 検索時に維持する追加クエリ(sort, order など)。 */
  preserved?: Record<string, string>;
};

export function SearchForm({ initialQuery, bookmarkedOnly, preserved = {} }: Props) {
  const clearParams = new URLSearchParams(preserved).toString();
  return (
    <form action="/products" method="get" className="mb-4 flex items-center gap-2">
      {Object.entries(preserved).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder="code / name / category で検索"
        aria-label="キーワード検索"
        className="w-full max-w-md rounded border border-zinc-300 px-3 py-1.5"
      />
      <button
        type="submit"
        className="rounded bg-zinc-800 px-4 py-1.5 text-white hover:bg-zinc-700"
      >
        検索
      </button>
      <label className="ml-2 flex items-center gap-1 text-sm whitespace-nowrap">
        <input type="checkbox" name="bookmarked" value="1" defaultChecked={bookmarkedOnly} />
        ブックマークのみ表示
      </label>
      {(initialQuery !== "" || bookmarkedOnly) && (
        <Link href={clearParams ? `/products?${clearParams}` : "/products"} className="text-sm text-zinc-600 underline">
          クリア
        </Link>
      )}
    </form>
  );
}
