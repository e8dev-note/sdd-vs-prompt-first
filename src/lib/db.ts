import Database from "better-sqlite3";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { seedIfEmpty } from "./seed";

const DEFAULT_DB_PATH = "data/app.db";
const MIGRATIONS_DIR = "db/migrations";

type DbGlobal = typeof globalThis & { __productMasterDb?: Database.Database };

const store = globalThis as DbGlobal;

function dbPath(): string {
  // 実行時に決まるパスなので Turbopack のファイルトレース対象から外す
  return resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_PATH ?? DEFAULT_DB_PATH);
}

/** 適用済み migration 名(昇順)。 */
export function appliedMigrations(db: Database.Database): string[] {
  const rows = db
    .prepare("SELECT name FROM schema_migrations ORDER BY name")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

function applyMigrations(db: Database.Database): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(appliedMigrations(db));
  const dir = resolve(/*turbopackIgnore: true*/ process.cwd(), MIGRATIONS_DIR);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const record = db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      record.run(file, new Date().toISOString());
    })();
    console.info(`[db] applied migration ${file}`);
  }
}

function open(): Database.Database {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  const seeded = seedIfEmpty(db);
  if (seeded > 0) console.info(`[db] seeded ${seeded} products`);
  return db;
}

/** 接続を返す。初回呼び出しで migration を適用する。 */
export function getDb(): Database.Database {
  if (!store.__productMasterDb) {
    store.__productMasterDb = open();
  }
  return store.__productMasterDb;
}

/** テスト専用: 接続を閉じ、次の getDb() で再初期化させる。 */
export function resetDbForTests(): void {
  store.__productMasterDb?.close();
  store.__productMasterDb = undefined;
}
