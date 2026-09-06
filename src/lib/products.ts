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

export type ProductUpdate = Pick<Product, "name" | "category" | "price" | "note">;
export type FieldErrors = Partial<Record<keyof ProductUpdate, string>>;

/**
 * フォーム入力(文字列)を検証して更新値に変換する。
 * 成功時は { value }、失敗時は { errors } を返す。
 */
export function validateProductUpdate(raw: {
  name?: unknown;
  category?: unknown;
  price?: unknown;
  note?: unknown;
}): { value: ProductUpdate; errors?: undefined } | { value?: undefined; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const category = typeof raw.category === "string" ? raw.category.trim() : "";
  const priceStr = typeof raw.price === "string" ? raw.price.trim() : String(raw.price ?? "");
  const noteRaw = typeof raw.note === "string" ? raw.note.trim() : "";

  if (name === "") errors.name = "name は必須です";
  if (category === "") errors.category = "category は必須です";
  if (!/^\d+$/.test(priceStr)) {
    errors.price = "price は 0 以上の整数で入力してください";
  }
  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: { name, category, price: Number(priceStr), note: noteRaw === "" ? null : noteRaw },
  };
}

/** name, category, price, note を更新する。code は変更しない。存在しなければ undefined。 */
export function updateProduct(id: number, update: ProductUpdate): Product | undefined {
  const result = getDb()
    .prepare(
      `UPDATE products
       SET name = @name, category = @category, price = @price, note = @note, updated_at = @now
       WHERE id = @id`,
    )
    .run({ ...update, id, now: new Date().toISOString() });
  return result.changes > 0 ? getProduct(id) : undefined;
}
