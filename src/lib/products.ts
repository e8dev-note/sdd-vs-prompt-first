import { getDb } from "./db";

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
}

export interface ListProductsOptions {
  /** 未指定・空白のみ → 全件 */
  keyword?: string;
}

const COLUMNS = "id, code, name, category, price, note, created_at, updated_at";

/** LIKE のワイルドカード(% _)とエスケープ文字(\)を通常文字として扱えるようにする。 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** 一覧。常に code 昇順(同値は id 昇順)。keyword は code / name / category の部分一致。 */
export function listProducts(options: ListProductsOptions = {}): Product[] {
  const keyword = options.keyword?.trim() ?? "";
  const db = getDb();
  if (keyword === "") {
    return db.prepare(`SELECT ${COLUMNS} FROM products ORDER BY code ASC, id ASC`).all() as Product[];
  }
  const pattern = `%${escapeLike(keyword)}%`;
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM products
       WHERE code LIKE @p ESCAPE '\\' OR name LIKE @p ESCAPE '\\' OR category LIKE @p ESCAPE '\\'
       ORDER BY code ASC, id ASC`,
    )
    .all({ p: pattern }) as Product[];
}

export function getProduct(id: number): Product | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`).get(id) as
    | Product
    | undefined;
  return row ?? null;
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
