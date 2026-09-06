import { countProducts, createProduct, type ProductInput } from "./products";

export const SEED_PRODUCTS: ProductInput[] = [
  { code: "P-0001", name: "ボールペン 黒", category: "文房具", price: 120, note: "0.7mm" },
  { code: "P-0002", name: "ボールペン 赤", category: "文房具", price: 120, note: null },
  { code: "P-0003", name: "ノート A4", category: "文房具", price: 250, note: "30枚" },
  { code: "P-0004", name: "消しゴム", category: "文房具", price: 80, note: null },
  { code: "P-0005", name: "電気ケトル", category: "家電", price: 3980, note: "1.2L" },
  { code: "P-0006", name: "トースター", category: "家電", price: 5480, note: null },
  { code: "P-0007", name: "扇風機", category: "家電", price: 6980, note: "リモコン付き" },
  { code: "P-0008", name: "電卓", category: "家電", price: 1280, note: null },
  { code: "P-0009", name: "コーヒー豆 200g", category: "食品", price: 980, note: "中煎り" },
  { code: "P-0010", name: "紅茶ティーバッグ", category: "食品", price: 540, note: "50袋" },
  { code: "P-0011", name: "はちみつ 500g", category: "食品", price: 1200, note: null },
  { code: "P-0012", name: "オリーブオイル", category: "食品", price: 890, note: "エクストラバージン" },
  { code: "P-0013", name: "TypeScript入門", category: "書籍", price: 2800, note: null },
  { code: "P-0014", name: "SQLite実践ガイド", category: "書籍", price: 3200, note: null },
  { code: "P-0015", name: "Reactハンドブック", category: "書籍", price: 3600, note: "第2版" },
  { code: "P-0016", name: "設計の教科書", category: "書籍", price: 2400, note: null },
  { code: "P-0017", name: "Tシャツ 白 M", category: "衣類", price: 1500, note: null },
  { code: "P-0018", name: "Tシャツ 黒 L", category: "衣類", price: 1500, note: null },
  { code: "P-0019", name: "パーカー グレー", category: "衣類", price: 4200, note: "裏起毛" },
  { code: "P-0020", name: "ソックス 3足組", category: "衣類", price: 780, note: null },
];

/** products が空のときだけシードを投入する。投入件数を返す。 */
export function seedIfEmpty(): number {
  if (countProducts() > 0) return 0;
  for (const p of SEED_PRODUCTS) createProduct(p);
  return SEED_PRODUCTS.length;
}
