# Research & Design Decisions

## Summary
- **Feature**: `product-sort`
- **Discovery Scope**: Extension(既存 `product-master` の一覧への追加。light discovery)
- **Key Findings**:
  - 拡張点は `listProducts(options)` の `ORDER BY code ASC, id ASC` 固定部分と、一覧ページの `<th>` 4 つ、検索フォームの GET パラメータ
  - 並び替え列は SQL に直接埋め込むため、ホワイトリストで検証した値以外を通さない(プレースホルダでは ORDER BY の列名を渡せない)
  - JS 不要で動かすため、ヘッダは `<a>`(Next の `Link`)でクエリ付き URL へ遷移する。検索フォームは hidden input で sort / order を引き継ぐ

## Research Log

### 既存コードの拡張点(`src/lib/products.ts`、`src/app/products/page.tsx`、`src/components/search-form.tsx`)
- **Context**: 変更範囲と後方互換の確認
- **Sources Consulted**: 上記 3 ファイル、`tests/products.test.ts`
- **Findings**:
  - `ListProductsOptions` は `keyword` のみ。ここに `sort` / `order` を追加すれば呼び出し側の互換は保てる(省略時は現行と同じ順序)
  - 既存テストは `listProducts()` が code 昇順であることを検証している。既定を変えなければそのまま通る
  - `SearchForm` は `keyword` だけを受け取る。sort / order を hidden input で持たせる拡張が必要(既存コードの改変)
  - 一覧ページの `<th>` は静的。ここをソートヘッダ部品に置き換える
- **Implications**: 既存コードの改変は 3 ファイル。新規はソートヘッダ部品と URL 組み立て関数

### SQLite の ORDER BY と照合順序
- **Context**: 要件 1.4(price は数値、他は文字列)と 1.5(同値は id 昇順)
- **Sources Consulted**: SQLite ドキュメント(既知)
- **Findings**: 列の型親和性が INTEGER の price は数値比較、TEXT 列は BINARY 照合(バイト順。ASCII の大文字が小文字より前、日本語はコードポイント順)。`ORDER BY <col> <dir>, id ASC` で安定化できる
- **Implications**: 文字列列の照合順序は BINARY のままとする(要件は「文字列として並べる」のみ)。研究ノートとして記録し、design の Open Questions に載せる

### aria-sort
- **Context**: 要件 2.3
- **Sources Consulted**: WAI-ARIA(既知)
- **Findings**: `<th aria-sort="ascending|descending|none">` で伝える。ソート中でない列は属性を省略するか `none`
- **Implications**: ソート中の列だけに `aria-sort` を付ける

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| サーバ側ソート + URL 状態(採用) | クエリを読んで SQL の ORDER BY で並べる。ヘッダはリンク | JS 不要、URL で再現可能、検索と直交 | ヘッダクリックごとにサーバ往復 | 要件 1.6 / 3.x に直結。既存パターンと同じ |
| クライアント側ソート | 取得済み配列を JS で並べ替え | 往復なし | URL 反映を別途実装、JS 必須、SSR 結果と不一致の可能性 | 不採用 |

## Design Decisions

### Decision: ソート指定の解釈は 1 か所(`parseSortParams`)に閉じる
- **Context**: 要件 3.5〜3.7、4.1 のフォールバック規則をページとテストで共有したい
- **Alternatives Considered**:
  1. ページ内で個別に判定
  2. `lib` に純粋関数として置き、ページと URL 組み立てから使う
- **Selected Approach**: 2。`{ sort, order }` を返し、不正値は既定へ
- **Rationale**: SQL の ORDER BY に渡す値の検証と、UI の表示状態の判定を同じ関数で行える
- **Trade-offs**: なし

### Decision: ヘッダ URL は常に `sort` と `order` を明示する
- **Context**: 要件 3.1。既定状態(code 昇順)を URL で省略するかどうか
- **Selected Approach**: ヘッダクリックで生成する URL は常に両方を付ける。初期表示(何も指定なし)だけがクエリなし
- **Rationale**: 「クリックしたら URL に反映される」を素直に満たす。省略ルールを増やすと検索フォームの引き継ぎ条件も複雑になる
- **Trade-offs**: 既定と同じ状態でも `?sort=code&order=asc` が付くことがある。許容

### Decision: 検索フォームは hidden input で sort / order を引き継ぐ
- **Context**: 要件 3.4。GET フォームは送信時にフォーム内の値だけを URL にする
- **Alternatives Considered**:
  1. フォームの `action` にクエリ付き URL を指定(ブラウザは GET フォームの action のクエリを捨てるため不可)
  2. hidden input
- **Selected Approach**: 2。`SearchForm` の props に `sort` / `order` を追加し、指定があるときだけ hidden を出す
- **Trade-offs**: `SearchForm` の既存コードに手が入る(既存コード改変 1 件)

### Decision: 文字列列は SQLite の既定照合(BINARY)
- **Context**: 要件 1.4
- **Selected Approach**: 照合順序は変更しない
- **Rationale**: 要件が求めるのは「文字列として並べる」ことのみ。NOCASE や日本語向け照合は要件外
- **Follow-up**: 大文字小文字を区別しない並びが必要になれば別 spec

## Risks & Mitigations
- ORDER BY への列名埋め込み — ホワイトリスト(`SORT_COLUMNS`)を通った値以外は SQL に到達しない。テストで不正値のフォールバックを確認
- 既存テストの破壊 — `listProducts()` の既定順は変更しない。既存テストがそのまま通ることを確認
- 検索フォームと URL の状態不一致 — hidden input は URL の解釈結果(`parseSortParams` の出力)から生成する

## References
- `src/lib/products.ts`、`src/app/products/page.tsx`、`src/components/search-form.tsx` — 拡張点
- `.kiro/specs/product-master/design.md` — 既存の境界と依存方向
