import { getDb } from "./db";
import type { ProductInput } from "./product-input";
import { nowIso } from "./time";

export { nowIso } from "./time";

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  note: string | null;
  created_at: string; // ISO8601 UTC
  updated_at: string; // ISO8601 UTC
  bookmarked: boolean;
}

/** DB の生の行。bookmarked は 0/1。 */
type ProductRow = Omit<Product, "bookmarked"> & { bookmarked: 0 | 1 };

function rowToProduct(row: ProductRow): Product {
  return { ...row, bookmarked: row.bookmarked === 1 };
}

export const SORT_COLUMNS = ["code", "name", "category", "price"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortOrder = "asc" | "desc";

export function isSortColumn(value: string): value is SortColumn {
  return (SORT_COLUMNS as readonly string[]).includes(value);
}

export interface ListProductsOptions {
  /** 未指定・空白のみ → 全件 */
  keyword?: string;
  /** 省略時 "code" */
  sort?: SortColumn;
  /** 省略時 "asc" */
  order?: SortOrder;
  /** true なら bookmarked = 1 のみ */
  bookmarkedOnly?: boolean;
}

const COLUMNS = "id, code, name, category, price, note, created_at, updated_at, bookmarked";

/** LIKE のワイルドカード(% _)とエスケープ文字(\)を通常文字として扱えるようにする。 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** ORDER BY 句。列名はホワイトリストを通った値のみ埋め込み、同値は id 昇順で安定させる。 */
function orderBy(sort: SortColumn | undefined, order: SortOrder | undefined): string {
  const column: SortColumn = sort !== undefined && isSortColumn(sort) ? sort : "code";
  const direction = order === "desc" ? "DESC" : "ASC";
  return `ORDER BY ${column} ${direction}, id ASC`;
}

/** 一覧。既定は code 昇順(同値は id 昇順)。keyword は code / name / category の部分一致。bookmarkedOnly はブックマーク中のみ。 */
export function listProducts(options: ListProductsOptions = {}): Product[] {
  const keyword = options.keyword?.trim() ?? "";
  const conditions: string[] = [];
  const params: Record<string, string> = {};
  if (keyword !== "") {
    conditions.push("(code LIKE @p ESCAPE '\\' OR name LIKE @p ESCAPE '\\' OR category LIKE @p ESCAPE '\\')");
    params.p = `%${escapeLike(keyword)}%`;
  }
  if (options.bookmarkedOnly) {
    conditions.push("bookmarked = 1");
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(`SELECT ${COLUMNS} FROM products ${where} ${orderBy(options.sort, options.order)}`)
    .all(params) as ProductRow[];
  return rows.map(rowToProduct);
}

export function getProduct(id: number): Product | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`).get(id) as
    | ProductRow
    | undefined;
  return row ? rowToProduct(row) : null;
}

/** 4 項目と updated_at を更新し、更新後の行を返す。不在なら null。id / code / created_at は変更しない。 */
export function updateProduct(id: number, input: ProductInput): Product | null {
  const changes = getDb()
    .prepare(
      "UPDATE products SET name = ?, category = ?, price = ?, note = ?, updated_at = ? WHERE id = ?",
    )
    .run(input.name, input.category, input.price, input.note, nowIso(), id).changes;
  return changes === 0 ? null : getProduct(id);
}

/** ブックマークを設定し、影響行数(0 or 1)を返す。updated_at は変更しない。 */
export function setBookmark(id: number, bookmarked: boolean): number {
  return getDb().prepare("UPDATE products SET bookmarked = ? WHERE id = ?").run(bookmarked ? 1 : 0, id).changes;
}

/** 削除した行数(0 or 1)。存在しなくても例外にしない。 */
export function deleteProduct(id: number): number {
  return getDb().prepare("DELETE FROM products WHERE id = ?").run(id).changes;
}

/** URL 由来の id 文字列を検証する。非負整数の 10 進表記のみ受け付け、それ以外は null。 */
export function parseProductId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}
