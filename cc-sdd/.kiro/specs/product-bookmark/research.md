# Research & Design Decisions

## Summary
- **Feature**: `product-bookmark`
- **Discovery Scope**: Extension(`product-master` のデータ層・詳細画面、`product-sort` の一覧 URL 規則への追加。light discovery)
- **Key Findings**:
  - スキーマ変更は steering `rules.md` に従い `db/migrations/002_*.sql` の追加のみ。SQLite の `ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT 0` は既存行を既定値で埋めるため、要件 2.2 を SQL だけで満たせる
  - better-sqlite3 は INTEGER 列を number で返す。`Product.bookmarked` を boolean にするには読み取り時の変換が必要で、行 → `Product` の変換を 1 か所に集約する
  - トグルを JS 不要にするには、削除と同じ「フォーム + Server Action + `redirect`」の形にする。戻り先 URL(検索・並び順・フィルタを含む)をフォームに持たせ、Server Action は内部パスのみへ `redirect` する
  - 一覧 URL の組み立て(`buildProductsUrl`)と、その利用側(`SortHeader`、`SearchForm`)に `bookmarked` を通す必要がある。既存部品の props 変更が発生する

## Research Log

### 既存コードの拡張点
- **Context**: 変更範囲と後方互換の確認
- **Sources Consulted**: `src/lib/products.ts`、`src/lib/list-url.ts`、`src/components/sort-header.tsx`、`src/components/search-form.tsx`、`src/app/products/page.tsx`、`src/app/products/[id]/page.tsx`、`src/app/products/actions.ts`、`tests/*.test.ts`
- **Findings**:
  - `listProducts` は `keyword` / `sort` / `order` を受け取り、WHERE と ORDER BY を組み立てている。`bookmarkedOnly` を WHERE に足せる
  - `Product` 型に `bookmarked` を足すと、`SELECT` 列(`COLUMNS`)と型の対応を保つ必要がある
  - `SortHeader` と `SearchForm` は `keyword` と `sort` から URL を組み立てる。`bookmarked` を追加で渡す(props 変更 = 既存コード改変)
  - `tests/db.test.ts` は適用済み migration が `["001_create_products.sql"]` であることを検証している。002 追加でこの期待値を更新する(既存テスト改変 1 件)
  - `deleteProductAction` は `redirect("/products")` 固定。ブックマークのトグルは戻り先が可変なので別の action にする
- **Implications**: 既存コードの改変は products.ts、list-url.ts、sort-header.tsx、search-form.tsx、products/page.tsx、[id]/page.tsx、actions.ts の 7 ファイル + 既存テスト 1 ファイル

### SQLite の ALTER TABLE ADD COLUMN
- **Context**: 要件 2.2(既存商品は OFF、他の列は不変)
- **Sources Consulted**: SQLite ドキュメント(既知)
- **Findings**: `ADD COLUMN` は既存行を書き換えず、読み取り時に DEFAULT を返す。`NOT NULL` には DEFAULT が必須
- **Implications**: `002_add_bookmarked_to_products.sql` は 1 文。ロールバックは列削除(SQLite 3.35+ の `DROP COLUMN`)だが、運用ルール上 migration は追加のみなので設計に含めない

### `redirect` の戻り先の安全性
- **Context**: 要件 1.5 / 1.6(操作後に同じ画面へ戻る)。戻り先をフォームの hidden で渡す
- **Findings**: `redirect` は絶対 URL も受け付けるため、外部へのオープンリダイレクトを避けるには検証が要る。`/products` で始まり `//` で始まらないパスのみ許可し、それ以外は `/products` へ戻す
- **Implications**: 検証は純粋関数 `safeReturnTo` として `list-url.ts` に置き、テストする

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| products にフラグ列(採用) | `bookmarked INTEGER NOT NULL DEFAULT 0` | 1 文の migration、JOIN 不要、削除で一緒に消える(要件 2.4) | ユーザーごとのブックマークには拡張しにくい | 依頼文が「商品ごとに 1 つのフラグでよい」と明言 |
| 別テーブル `bookmarks(product_id)` | 存在 = ON | 将来ユーザー列を足しやすい | JOIN と削除時の整合が必要。今回の要件には過剰 | 不採用。必要になれば migration で移行 |
| フォーム + Server Action + redirect(採用) | 削除と同じ形 | JS 不要、状態は URL で復元 | 操作ごとにページ遷移 | 要件 1.7 |
| client component + `useOptimistic` | 即時反映 | 体感が速い | JS 必須、要件 1.7 に反する | 不採用 |

## Design Decisions

### Decision: 行 → `Product` の変換を `rowToProduct` に集約
- **Context**: `bookmarked` を boolean で扱いたい。SQLite は 0/1
- **Selected Approach**: `products.ts` 内に `ProductRow`(DB の生の型)と `rowToProduct` を置き、`listProducts` / `getProduct` の戻り値を通す
- **Trade-offs**: 変換が 1 段増える。数十件規模で無視できる

### Decision: トグルは「次の状態」をフォームに持たせる
- **Context**: 要件 1.3 / 1.4。連打や別タブでの変更と競合しても意図どおりにしたい
- **Alternatives Considered**:
  1. Server Action で現在値を読んで反転(トグル)
  2. フォームに目標値(`bookmarked=1|0`)を持たせて SET
- **Selected Approach**: 2。画面に表示していた状態から見た「次の状態」を保存する。冪等で、二重送信しても結果が変わらない
- **Trade-offs**: 画面が古い場合、他タブの変更を上書きする。単一ユーザーなので許容

### Decision: 戻り先は `returnTo` hidden + `safeReturnTo` で検証
- **Context**: 要件 1.5 / 1.6。検索・並び順・フィルタを含む URL へ戻る
- **Selected Approach**: 一覧では `buildProductsUrl(現在の状態)`、詳細では `/products/{id}` を hidden に入れる。Server Action は `safeReturnTo` を通してから `redirect`
- **Trade-offs**: hidden の値は改ざん可能だが、内部パスに限定されるため実害はない

### Decision: フィルタは URL を切り替えるリンク
- **Context**: 要件 3.1〜3.4、3.8
- **Selected Approach**: 「ブックマークのみ表示」を `aria-pressed` 付きのリンク(見た目はトグルボタン)にし、`buildProductsUrl` で `bookmarked` を反転した URL へ遷移する。検索フォームは hidden `bookmarked=1` で保持、`SortHeader` は URL 組み立てに `bookmarked` を含める
- **Trade-offs**: `SortHeader` / `SearchForm` の props が増える(既存コード改変)

### Decision: ブックマーク切り替えは `updated_at` を変えない
- **Context**: 要件 2.3
- **Selected Approach**: `UPDATE products SET bookmarked = ? WHERE id = ?` のみ。`updateProduct` とは別関数 `setBookmark`
- **Rationale**: `updated_at` は商品マスタの属性の更新時刻。ブックマークは利用者の印であり、マスタの変更ではない

## Risks & Mitigations
- `Product` 型の変更で既存コードの型エラー — `rowToProduct` を通す箇所は `listProducts` / `getProduct` の 2 つ。`updateProduct` は `getProduct` を返すため自動的に揃う。テストは `toMatchObject` 中心で `bookmarked` 追加の影響を受けにくい
- 既存テスト(`db.test.ts`)の期待値更新 — 002 を含む配列に変更。意図的な改変として記録
- 3 条件(q / sort / bookmarked)の相互保持の漏れ — `buildProductsUrl` を唯一の URL 組み立て口とし、ヘッダ・フォーム・フィルタ・トグルの戻り先の全てをそこから作る。`list-url.test.ts` で組み合わせを検証

## References
- `.kiro/specs/product-master/design.md`、`.kiro/specs/product-sort/design.md` — 既存の境界と URL 規則
- `.kiro/steering/rules.md` — migration は追記のみ、既存ファイルは編集しない
