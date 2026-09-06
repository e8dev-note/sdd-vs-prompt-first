# Research & Design Decisions

## Summary
- **Feature**: `product-master`
- **Discovery Scope**: New Feature(greenfield。scaffold 直後のため既存コードはなし)
- **Key Findings**:
  - Next.js 16.3 では `params` / `searchParams` が Promise。`PageProps<'/products/[id]'>` 型ヘルパが使える(`next dev`/`build` で型生成)
  - `notFound()` / `redirect()` は例外を投げて制御を移す。Server Action 内では `try/catch` の外で呼ぶ。`redirect` の前に `revalidatePath` を置く
  - better-sqlite3 13.0.3 はネイティブ同期 API。Node 25 でビルド・動作確認済み(SQLite 3.53.4)。Next.js からは `serverExternalPackages` でバンドル対象外にする必要がある
  - Server Action はビルド時に POST エンドポイントになるため、UI に出さない操作でもサーバ側で入力検証する(今回は認証なしのため権限検査はない)

## Research Log

### Next.js 16 の App Router API(ローカル docs: `node_modules/next/dist/docs/01-app/`)
- **Context**: steering `AGENTS.md` が「学習データと異なる可能性がある。docs を読め」と指示
- **Sources Consulted**: `03-file-conventions/page.md`、`dynamic-routes.md`、`04-functions/not-found.md`、`redirect.md`、`02-guides/server-actions.md`、`forms.md`
- **Findings**:
  - ページの `params` と `searchParams` は `Promise`。`await` して使う。`searchParams` を使うページは動的レンダリングになる(ビルド時に DB を触らない)
  - `<form action={serverAction}>` で Server Action を呼べる。JS 無効でも動く(progressive enhancement)
  - Server Action で `redirect()` を呼ぶと、JS 有効時はクライアント遷移、フォーム直送信時は 303
  - `notFound()` は `never` を返すので、呼んだ後は値が narrow される
- **Implications**: 検索フォームは GET フォームで十分(Server Action 不要)。削除は Server Action + `redirect('/products')`。詳細の 404 は `notFound()`

### better-sqlite3 と Next.js の組み合わせ
- **Context**: ネイティブモジュールを Turbopack がバンドルしようとして失敗する既知の問題
- **Sources Consulted**: `05-config/01-next-config-js/serverExternalPackages.md`、better-sqlite3 README(既知)
- **Findings**: `next.config.ts` に `serverExternalPackages: ["better-sqlite3"]` を指定すれば Node の `require` で読み込まれる。同期 API のため Server Component / Server Action から直接呼べる
- **Implications**: DB 接続は `src/lib/db.ts` のモジュールスコープ singleton にする(dev の HMR でモジュールが再評価されても `globalThis` に退避すれば接続が増えない)

### 起動時マイグレーション・シードの実行タイミング
- **Context**: steering `rules.md`「起動時に未適用分を順に適用」。Next.js には `instrumentation.ts` の `register()` があるが、テスト(Vitest)や `next build` では走らない
- **Sources Consulted**: `03-file-conventions/instrumentation.md`
- **Findings**: `register()` は Next サーバ起動時に 1 回呼ばれるが、Vitest からは呼ばれない。DB 初回アクセス時に冪等に適用する方式なら dev / build / test 全てで同じコードパスを通る
- **Implications**: 「起動時」を「DB への初回アクセス時(プロセスごとに 1 回)」と解釈し、`getDb()` 内で migrate → seed を冪等に実行する。`instrumentation.ts` は採用しない

### Vitest 4 と TypeScript パスエイリアス
- **Context**: `@/` エイリアスをテストでも解決したい
- **Sources Consulted**: Vitest 公式(既知)
- **Findings**: `vitest.config.mts` の `resolve.alias` で `@` → `./src` を指定。環境は `node`。テストは `data/app.db` を汚さないため DB パスを環境変数で差し替える
- **Implications**: `DATABASE_PATH` 環境変数(未指定時 `data/app.db`)を `db.ts` が読む。テストは一時ディレクトリのファイルを使う

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| App Router 直結(採用) | Server Component / Server Action から `lib` を直接呼ぶ。API 層なし | 最小構成、JS 不要で動く、テストは `lib` に集中できる | UI とデータ層の距離が近い。将来 API が必要になれば追加 | steering `tech.md` の方針どおり |
| Route Handler + fetch | `/api/products` を作り、ページから fetch | 疎結合、外部クライアントにも使える | 二重定義、自己 fetch のオーバーヘッド。要件に API はない | 不採用 |
| Client-side rendering | 一覧をクライアントで取得・フィルタ | 検索が即時 | URL クエリ反映やリロード保持を自前実装。SSR の利点を捨てる | 不採用 |

## Design Decisions

### Decision: DB 初期化はアクセス時に冪等実行
- **Context**: マイグレーションとシードを「起動時」に確実に 1 回だけ実行したい。dev / build / test で入口が異なる
- **Alternatives Considered**:
  1. `instrumentation.ts` の `register()` で実行
  2. `getDb()` 初回呼び出しで実行(プロセス内 1 回)
- **Selected Approach**: 2。`getDb()` が接続を開き、`schema_migrations` テーブルで未適用の SQL を番号順に適用し、products が 0 件ならシードする
- **Rationale**: テストと本番で同じコードパスになる。HMR 対策として接続を `globalThis` に退避する
- **Trade-offs**: 初回リクエストが数十 ms 遅い。許容
- **Follow-up**: `next build` 中に静的生成でページが DB を触らないことを確認(全ページ動的)

### Decision: ルート `/` の誘導は `next.config.ts` の `redirects()`
- **Context**: 要件 1.6。ページで `redirect()` しても良いが、静的生成時の挙動を考えなくてよい方が単純
- **Selected Approach**: `redirects()` で `/` → `/products`(非 permanent)。`src/app/page.tsx` は削除
- **Trade-offs**: 設定ファイルに URL 構造が分散する。1 件なので許容

### Decision: 検索は GET フォーム、削除は Server Action
- **Context**: 要件 2(URL に反映)と 4(確認ダイアログ、削除後に一覧へ)
- **Selected Approach**: 検索は `<form method="get">` で `?q=` を付ける(サーバ側で読んで描画)。削除は `'use client'` の `DeleteButton` が `window.confirm` の後にフォーム送信し、Server Action が削除して `redirect('/products')`
- **Rationale**: 検索は状態を URL に持つのが要件なので Server Action は不要。削除は副作用があるため Server Action
- **Trade-offs**: `window.confirm` は見た目をカスタマイズできない。要件は「確認ダイアログ」のみなので十分

### Decision: 部分一致は `LIKE ... ESCAPE '\'` でエスケープ
- **Context**: 要件 2.6(大文字小文字無視)、2.7(`%`、`_` を通常文字として扱う)
- **Selected Approach**: 検索語中の `\`、`%`、`_` を `\` でエスケープして `LIKE '%' || ? || '%' ESCAPE '\'`。SQLite の LIKE は ASCII に対して大文字小文字を区別しない
- **Trade-offs**: 非 ASCII の大文字小文字(例: 全角英字)は区別される。要件は「英字」なので許容。全件走査だが数十件規模

### Decision: 時刻は アプリ側で ISO8601 UTC を生成
- **Context**: `created_at` / `updated_at` を ISO8601 に揃える
- **Selected Approach**: `new Date().toISOString()` を `lib` が設定。SQL の DEFAULT は使わない
- **Rationale**: シード・将来の更新で同じ関数を使え、フォーマットが 1 か所に閉じる

### Decision: テスト用 DB パスは環境変数で差し替え
- **Context**: `data/app.db` を汚さずに `lib` を結合テストしたい
- **Selected Approach**: `DATABASE_PATH` が設定されていればそれを使う。テストは一時ディレクトリを `beforeEach` で用意し、`getDb()` を `resetDbForTests()` で閉じ直す
- **Trade-offs**: 環境変数が 1 つ増える。README に記載しない(内部用)

### Decision: ライトテーマのみ
- **Context**: scaffold の `globals.css` は `prefers-color-scheme: dark` で背景を黒にする。表の視認性を担保する
- **Selected Approach**: ダークモード用の CSS 変数定義を削除し、明示的な背景色・文字色で描画する

## Risks & Mitigations
- better-sqlite3 のネイティブビルドが環境依存 — `npm install` 時にビルド済みバイナリが取得できることを確認済み(Node 25)。README に Node バージョンを明記
- `next build` が静的生成で DB を開く — 全ページが `searchParams` / `params` を使う動的ページであり、`/` はリダイレクトのみ。build 後に `data/app.db` が作られないことを確認
- 削除競合(2 タブで同じ商品を削除) — 2 回目は影響行数 0 で正常終了し一覧へ戻る(要件 4.6)
- HMR で接続が多重に開く — `globalThis` に接続を退避

## References
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — Promise 型の props、`PageProps` ヘルパ
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md` — `notFound()` の挙動
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md` — Server Action 内での `redirect`
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — Server Action のセキュリティと `revalidatePath`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md` — ネイティブモジュールの除外
