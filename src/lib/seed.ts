import type Database from "better-sqlite3";
import type { Product } from "./products";
import { nowIso } from "./time";

export type SeedProduct = Pick<Product, "code" | "name" | "category" | "price" | "note">;

export const SEED_PRODUCTS: readonly SeedProduct[] = [
  { code: "ST-001", name: "ボールペン 黒 0.5mm", category: "文房具", price: 120, note: null },
  { code: "ST-002", name: "ボールペン 赤 0.5mm", category: "文房具", price: 120, note: null },
  { code: "ST-003", name: "ノート A4 罫線", category: "文房具", price: 250, note: "5冊パック" },
  { code: "ST-004", name: "付箋 75x75mm", category: "文房具", price: 180, note: null },
  { code: "ST-005", name: "クリアファイル A4", category: "文房具", price: 90, note: "10枚入り" },
  { code: "OF-001", name: "コピー用紙 A4 500枚", category: "オフィス用品", price: 680, note: null },
  { code: "OF-002", name: "ホチキス 中型", category: "オフィス用品", price: 950, note: null },
  { code: "OF-003", name: "ホチキス針 No.10", category: "オフィス用品", price: 150, note: "1000本入り" },
  { code: "OF-004", name: "ガムテープ 50mm", category: "オフィス用品", price: 320, note: null },
  { code: "OF-005", name: "デスクマット 透明", category: "オフィス用品", price: 1800, note: null },
  { code: "PC-001", name: "USB-C ケーブル 1m", category: "PC周辺機器", price: 1200, note: null },
  { code: "PC-002", name: "ワイヤレスマウス", category: "PC周辺機器", price: 2980, note: "単3電池 1本" },
  { code: "PC-003", name: "USB メモリ 64GB", category: "PC周辺機器", price: 1580, note: null },
  { code: "PC-004", name: "HDMI ケーブル 2m", category: "PC周辺機器", price: 1350, note: null },
  { code: "PC-005", name: "ノート PC スタンド", category: "PC周辺機器", price: 3480, note: "アルミ製" },
  { code: "KT-001", name: "ドリップコーヒー 30袋", category: "給湯室", price: 1480, note: null },
  { code: "KT-002", name: "紙コップ 7oz 100個", category: "給湯室", price: 520, note: null },
  { code: "KT-003", name: "ティーバッグ 紅茶 50袋", category: "給湯室", price: 780, note: null },
  { code: "KT-004", name: "ミネラルウォーター 2L 6本", category: "給湯室", price: 720, note: "ケース販売" },
  { code: "KT-005", name: "スティックシュガー 100本", category: "給湯室", price: 0, note: "サンプル品(無償)" },
];

/** products が 0 件なら SEED_PRODUCTS を投入して件数を返す。それ以外は 0。 */
export function seedIfEmpty(db: Database.Database): number {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  if (n > 0) return 0;
  const now = nowIso();
  const insert = db.prepare(
    "INSERT INTO products (code, name, category, price, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  db.transaction(() => {
    for (const p of SEED_PRODUCTS) {
      insert.run(p.code, p.name, p.category, p.price, p.note, now, now);
    }
  })();
  return SEED_PRODUCTS.length;
}
