import { getDb } from "./db";

export type Product = {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export const SORT_COLUMNS = ["code", "name", "category", "price"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortOrder = "asc" | "desc";
export const DEFAULT_SORT: SortColumn = "code";
export const DEFAULT_ORDER: SortOrder = "asc";

export type ListOptions = {
  keyword?: string;
  sort?: SortColumn;
  order?: SortOrder;
};

export function isSortColumn(v: unknown): v is SortColumn {
  return typeof v === "string" && (SORT_COLUMNS as readonly string[]).includes(v);
}
export function isSortOrder(v: unknown): v is SortOrder {
  return v === "asc" || v === "desc";
}

/** キーワードで code, name, category を部分一致検索し、指定列で並び替える。 */
export function listProducts(options: ListOptions | string = {}): Product[] {
  const opts = typeof options === "string" ? { keyword: options } : options;
  const q = (opts.keyword ?? "").trim();
  const sort = opts.sort ?? DEFAULT_SORT;
  const order = opts.order ?? DEFAULT_ORDER;
  // sort/order はホワイトリスト検証済みの値だけを埋め込む(SQL インジェクション防止)。
  const orderBy = `ORDER BY ${sort} ${order === "desc" ? "DESC" : "ASC"}, id ASC`;
  const db = getDb();
  if (q === "") {
    return db.prepare(`SELECT * FROM products ${orderBy}`).all() as Product[];
  }
  const like = `%${escapeLike(q)}%`;
  return db
    .prepare(
      `SELECT * FROM products
       WHERE code LIKE ? ESCAPE '\\'
          OR name LIKE ? ESCAPE '\\'
          OR category LIKE ? ESCAPE '\\'
       ${orderBy}`,
    )
    .all(like, like, like) as Product[];
}

export function getProduct(id: number): Product | undefined {
  return getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Product
    | undefined;
}

export function createProduct(input: ProductInput): Product {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO products (code, name, category, price, note, created_at, updated_at)
       VALUES (@code, @name, @category, @price, @note, @now, @now)`,
    )
    .run({ ...input, note: input.note ?? null, now });
  return getProduct(Number(result.lastInsertRowid))!;
}

/** 削除した場合 true、存在しなければ false。 */
export function deleteProduct(id: number): boolean {
  return getDb().prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}

export function countProducts(): number {
  return (
    getDb().prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }
  ).c;
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
