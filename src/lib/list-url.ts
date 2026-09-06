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
  const qs = query.toString();
  return qs === "" ? "/products" : `/products?${qs}`;
}
