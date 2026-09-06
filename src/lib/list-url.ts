import { isSortColumn, type SortColumn, type SortOrder } from "./products";

export interface SortState {
  sort: SortColumn;
  order: SortOrder;
}

export const DEFAULT_SORT: SortState = { sort: "code", order: "asc" };

/**
 * クエリの生値を解釈する。
 * - sort が許容値以外 / 未指定 → DEFAULT_SORT
 * - sort が有効で order が "asc" / "desc" 以外 / 未指定 → その列の asc
 */
export function parseSortParams(rawSort: string | undefined, rawOrder: string | undefined): SortState {
  if (rawSort === undefined || !isSortColumn(rawSort)) return DEFAULT_SORT;
  const order: SortOrder = rawOrder === "desc" ? "desc" : "asc";
  return { sort: rawSort, order };
}

/** ヘッダをクリックしたときの次の状態。同じ列なら反転、別の列なら asc。 */
export function nextSortState(current: SortState, column: SortColumn): SortState {
  if (current.sort !== column) return { sort: column, order: "asc" };
  return { sort: column, order: current.order === "asc" ? "desc" : "asc" };
}

export interface ProductsUrlParams {
  /** 空・空白のみなら q を付けない */
  keyword?: string;
  /** 未指定なら sort / order を付けない */
  sort?: SortState;
  /** true のときだけ bookmarked=1 を付ける */
  bookmarked?: boolean;
}

/** ?bookmarked= は "1" のときだけ有効。 */
export function parseBookmarkedParam(raw: string | undefined): boolean {
  return raw === "1";
}

/**
 * トグル操作後の戻り先。"/products" で始まる内部パスのみ許可し、それ以外は一覧へ。
 * 外部 URL やプロトコル相対(//)へのオープンリダイレクトを防ぐ。
 */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/products")) return "/products";
  if (raw.startsWith("//") || /[\\@]/.test(raw)) return "/products";
  const rest = raw.slice("/products".length);
  if (rest !== "" && !/^[/?#]/.test(rest)) return "/products";
  return raw;
}

/** "/products" または "/products?q=...&sort=...&order=..." を返す。 */
export function buildProductsUrl(params: ProductsUrlParams): string {
  const query = new URLSearchParams();
  const keyword = params.keyword?.trim() ?? "";
  if (keyword !== "") query.set("q", keyword);
  if (params.sort) {
    query.set("sort", params.sort.sort);
    query.set("order", params.sort.order);
  }
  if (params.bookmarked) query.set("bookmarked", "1");
  const qs = query.toString();
  return qs === "" ? "/products" : `/products?${qs}`;
}
