import { getDb } from "./db";
import { seedIfEmpty } from "./seed";
import { seedUsersIfEmpty } from "./auth";

/** 起動時に DB を初期化する(マイグレーション + 初回シード)。 */
export function bootstrap(): void {
  getDb();
  seedIfEmpty();
  seedUsersIfEmpty();
}
