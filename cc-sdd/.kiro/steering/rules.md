# ルール(このリポジトリ固有)

- スタック: Next.js(App Router, TypeScript) + better-sqlite3 + Vitest + Tailwind。他のORM・DB・UIライブラリを追加しない。
- DB ファイルは `data/app.db`。スキーマ変更は `db/migrations/NNN_*.sql` に追記し、起動時に未適用分を順に適用する。既存のマイグレーションファイルは編集しない。
- 外部通信なし。認証・認可は依頼があった段階で追加する。認証ライブラリは追加せず node:crypto で実装し、パスワードは平文で保存しない。
- 各機能に最低1つテストを書く。完了条件は `npm run build`、`npm run lint`、`npm test` が全て通ること。
- 商品(products)の列: id, code(一意), name, category, price(0以上の整数), note(任意), created_at, updated_at(ISO8601)。
