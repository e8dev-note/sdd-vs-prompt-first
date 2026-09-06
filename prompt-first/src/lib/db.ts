import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

let instance: Database.Database | null = null;

/** 未適用のマイグレーション(db/migrations/NNN_*.sql)をファイル名順に適用する。 */
export function runMigrations(db: Database.Database): string[] {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL
     )`,
  );
  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((r) => (r as { name: string }).name),
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const newlyApplied: string[] = [];
  const mark = db.prepare(
    "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)",
  );
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      mark.run(file, new Date().toISOString());
    })();
    newlyApplied.push(file);
  }
  return newlyApplied;
}

/** DB を開き、マイグレーションを適用して返す。シングルトン。 */
export function getDb(): Database.Database {
  if (instance) return instance;
  if (DB_PATH !== ":memory:") {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  instance = db;
  return db;
}

/** テスト用: 接続を閉じてシングルトンを破棄する。 */
export function closeDb(): void {
  instance?.close();
  instance = null;
}
