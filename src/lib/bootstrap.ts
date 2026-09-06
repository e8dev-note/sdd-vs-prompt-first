import { getDb } from "./db";
import { seedIfEmpty } from "./seed";

/** 起動時に DB を初期化する(マイグレーション + 初回シード)。 */
export function bootstrap(): void {
  getDb();
  seedIfEmpty();
}
