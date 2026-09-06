import { toggleBookmarkAction } from "@/app/products/actions";

type Props = {
  id: number;
  bookmarked: boolean;
  /** true ならラベル付きの大きめボタン(詳細画面用)。 */
  withLabel?: boolean;
  /** false なら操作不可の表示のみ(権限がない場合)。 */
  canToggle?: boolean;
};

/** ブックマークの ON/OFF トグル。サーバアクションで永続化する。 */
export function BookmarkToggle({ id, bookmarked, withLabel = false, canToggle = true }: Props) {
  const next = bookmarked ? "0" : "1";
  const title = bookmarked ? "ブックマークを解除" : "ブックマークに追加";
  if (!canToggle) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-lg leading-none ${
          bookmarked ? "text-amber-500" : "text-zinc-300"
        }`}
        aria-label={bookmarked ? "ブックマーク中" : "未ブックマーク"}
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
        {withLabel && (
          <span className="text-sm text-zinc-500">{bookmarked ? "ブックマーク中" : "未ブックマーク"}</span>
        )}
      </span>
    );
  }
  return (
    <form action={toggleBookmarkAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="on" value={next} />
      <button
        type="submit"
        aria-pressed={bookmarked}
        aria-label={title}
        title={title}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-lg leading-none hover:bg-zinc-100 ${
          bookmarked ? "text-amber-500" : "text-zinc-400"
        }`}
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
        {withLabel && (
          <span className="text-sm text-zinc-700">
            {bookmarked ? "ブックマーク中" : "ブックマーク"}
          </span>
        )}
      </button>
    </form>
  );
}
