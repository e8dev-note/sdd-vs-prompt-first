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

/** キーワードで code, name, category を部分一致検索する。空なら全件。 */
export function listProducts(keyword = ""): Product[] {
  const db = getDb();
  const q = keyword.trim();
  if (q === "") {
    return db.prepare("SELECT * FROM products ORDER BY code").all() as Product[];
  }
  const like = `%${escapeLike(q)}%`;
  return db
    .prepare(
      `SELECT * FROM products
       WHERE code LIKE ? ESCAPE '\\'
          OR name LIKE ? ESCAPE '\\'
          OR category LIKE ? ESCAPE '\\'
       ORDER BY code`,
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
