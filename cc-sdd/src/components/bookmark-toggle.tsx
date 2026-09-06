import { toggleBookmarkAction } from "@/app/products/actions";

type Props = {
  id: number;
  bookmarked: boolean;
  /** 操作後に戻る内部 URL(一覧なら現在の q / sort / order / bookmarked を含む URL、詳細なら /products/[id]) */
  returnTo: string;
  /** true なら「ブックマーク中」/「ブックマーク」の文字を添える(詳細用) */
  label?: boolean;
  /** false なら切り替え操作を出さず、状態の印だけを描く(viewer 用) */
  canToggle?: boolean;
};

/** フォーム + Server Action のトグル。JS 不要。hidden には「次の状態」を持たせる(冪等)。 */
export function BookmarkToggle({ id, bookmarked, returnTo, label = false, canToggle = true }: Props) {
  if (!canToggle) {
    return (
      <span
        aria-label={bookmarked ? "ブックマーク中" : "ブックマークなし"}
        title={bookmarked ? "ブックマーク中" : "ブックマークなし"}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-base leading-none ${bookmarked ? "text-amber-500" : "text-gray-300"}`}
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
        {label && <span className="text-sm text-gray-700">{bookmarked ? "ブックマーク中" : "ブックマークなし"}</span>}
      </span>
    );
  }
  return (
    <form action={toggleBookmarkAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="bookmarked" value={bookmarked ? "0" : "1"} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "ブックマークを外す" : "ブックマークする"}
        title={bookmarked ? "ブックマークを外す" : "ブックマークする"}
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-base leading-none hover:bg-amber-100 ${
          bookmarked ? "text-amber-500" : "text-gray-400"
        }`}
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
        {label && <span className="text-sm text-gray-700">{bookmarked ? "ブックマーク中" : "ブックマーク"}</span>}
      </button>
    </form>
  );
}
