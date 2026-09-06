import Link from "next/link";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  return (
    <form action="/products" method="get" className="mb-4 flex items-center gap-2">
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
      {initialQuery !== "" && (
        <Link href="/products" className="text-sm text-zinc-600 underline">
          クリア
        </Link>
      )}
    </form>
  );
}
