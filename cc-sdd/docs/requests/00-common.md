# 共通前提(両トラック共通・ルールファイルに反映する)

## 題材

商品マスタ管理(SoR)。ローカルで動く最小構成。

## 技術スタック(固定)

- Next.js(App Router、TypeScript)
- SQLite(better-sqlite3)。DBファイルはリポジトリ直下の `data/app.db`
- テスト: Vitest
- スタイル: Tailwind CSS(create-next-app 既定)
- パッケージマネージャ: npm

## データ(商品 products)

| 列 | 型 | 制約 |
|---|---|---|
| id | integer | PK, autoincrement |
| code | text | 一意、必須 |
| name | text | 必須 |
| category | text | 必須 |
| price | integer | 必須、0以上 |
| note | text | 任意 |
| created_at | text | ISO8601、必須 |
| updated_at | text | ISO8601、必須 |

初期データとして 20 件程度のシードを用意する。

## 運用ルール

- step4 までは認証なし(ローカル単一ユーザー)。step5 で認証、step6 で認可を追加する(依頼文参照)。認証ライブラリは追加せず Node.js 標準で実装し、パスワードは平文で保存しない。
- 外部サービスへの通信は行わない。
- DB スキーマの変更は `db/migrations/` 配下の SQL で管理し、起動時に未適用分を順に適用する。
- 各機能に対してユニットテストまたは結合テストを最低1つ書く。
- `npm run build`、`npm run lint`、`npm test` が通る状態で完了とする。
