# Research & Design Decisions

## Summary
- **Feature**: `product-edit`
- **Discovery Scope**: Extension(既存 `product-master` の詳細画面と商品データアクセスへの追加。light discovery)
- **Key Findings**:
  - 拡張点は詳細画面(`src/app/products/[id]/page.tsx`)のボタン配置、Server Action(`actions.ts`)、リポジトリ(`products.ts`)の 3 つ。モーダルとフォームは新規の client component
  - React 19 はフォームの action 完了後に非制御の入力欄を初期値へリセットする。検証エラー時に入力値を保持する(要件 2.5)には制御コンポーネントにする
  - ネイティブ `<dialog>` の `showModal()` は背後の操作不可(inert)、Esc で閉じる、フォーカスの閉じ込めを標準で提供する。要件 1.5 / 1.6 / 4.2 を追加ライブラリなしで満たせる
  - Server Action が `revalidatePath` を呼ぶと、同じレスポンスで現在ルートが再描画される(step1 の research 参照)。保存成功後の詳細更新(要件 3.2)はこれで足り、`router.refresh()` は不要

## Research Log

### 既存コードの拡張点
- **Context**: 変更範囲の確認
- **Sources Consulted**: `src/app/products/[id]/page.tsx`、`src/app/products/actions.ts`、`src/lib/products.ts`、`tests/products.test.ts`
- **Findings**:
  - 詳細ページは Server Component。`DeleteButton`(client)を子として置いており、同じ位置に編集モーダル(client)を追加できる
  - `actions.ts` は `deleteProductAction` のみ。`updateProductAction` を追加する
  - `products.ts` には `updateProduct` がない。`nowIso()` は既にある
- **Implications**: 既存コードの改変は 3 ファイル、いずれも追加のみ(既存関数の変更なし)

### React 19 のフォームリセットと `useActionState`
- **Context**: 要件 2.5(エラー表示中に入力値を保持)
- **Sources Consulted**: `node_modules/next/dist/docs/01-app/02-guides/forms.md`(Validation errors / Pending states)、React 19 の form action の挙動(既知)
- **Findings**:
  - `useActionState(action, initialState)` で `[state, formAction, pending]` が得られ、`pending` で保存ボタンを無効化できる(要件 3.6)
  - action 完了後、React は非制御 `<input>` を `defaultValue` に戻す。`state` に入力値を入れて `defaultValue` に流す方法もあるが、リセットと再描画の順序に依存する
- **Implications**: 入力欄は `useState` で制御する。action には `FormData` からサーバ側で値を読む(制御でも `name` 属性があれば FormData に載る)。エラー時は `state.errors` を表示し、入力値は client の state がそのまま残る

### ネイティブ `<dialog>`
- **Context**: 要件 1.2 / 1.5 / 1.6 / 4.2
- **Sources Consulted**: HTML Living Standard の dialog 要素(既知)
- **Findings**:
  - `dialog.showModal()` で開くと背後が inert になり、Esc で `cancel` → `close` イベントが発火する
  - `autofocus` 属性を付けた要素、なければ最初のフォーカス可能要素にフォーカスが移る
  - `::backdrop` 擬似要素でオーバーレイを描ける
- **Implications**: モーダルライブラリは追加しない(steering: 他の UI ライブラリを追加しない)。Esc による close をキャンセルとして扱い、client state を保存済みの値へ戻す

### 保存成功後の閉じ方
- **Context**: 要件 3.2(モーダルを閉じて詳細を更新)
- **Findings**: action の戻り値 `{ status: "success", savedAt }` を `useEffect` で監視して `dialog.close()` を呼ぶ。`savedAt` を毎回変えることで、連続して保存したときも効果が発火する。詳細の値は `revalidatePath` により同じレスポンスで再描画される
- **Implications**: モーダルの `product` prop は保存後に新しい値になる。次に開くときは prop から state を初期化し直す(要件 4.3 も同じ経路で満たす)

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| `<dialog>` + Server Action + `useActionState`(採用) | ネイティブモーダル、サーバ側検証、状態は action の戻り値 | 追加ライブラリなし、検証が 1 か所、JS 有効時のみで要件を満たせる | client component が 1 つ増える | steering に適合 |
| 別ページ `/products/[id]/edit` | ページ遷移で編集 | JS 不要 | 依頼は「モーダル」 | 不採用 |
| クライアント側のみで検証 | fetch で API を呼ぶ | 即時 | サーバ側検証が別途必要、API 層がない | 不採用 |

## Design Decisions

### Decision: 入力検証は純粋関数 `validateProductInput` に集約
- **Context**: 要件 2.1〜2.7、5.1。Server Action とテストで同じ規則を使いたい
- **Selected Approach**: `src/lib/product-input.ts` に `FormData` 由来の生値(文字列)を受け取り、`{ ok: true, value }` または `{ ok: false, errors }` を返す関数を置く。DB・React に依存しない
- **Rationale**: 検証規則(trim、整数判定、note の空 → null)がコードの 1 か所に閉じ、Vitest で網羅できる
- **Trade-offs**: 画面側の即時検証は行わない(送信して初めてエラーが出る)。要件は「フィールド近くに表示」のみで即時性は求めていない

### Decision: price は `type="text" inputMode="numeric"`
- **Context**: `type="number"` はブラウザにより小数や `e` の扱いが異なり、空文字と不正値の区別がつかない
- **Selected Approach**: テキスト入力にし、サーバ側で `/^\d+$/` かつ安全な整数であることを検証する
- **Trade-offs**: ブラウザのスピンボタンは出ない。許容

### Decision: 更新は `updateProduct(id, input): Product | null`
- **Context**: 要件 3.1 / 3.4 / 3.5
- **Selected Approach**: `UPDATE products SET name, category, price, note, updated_at WHERE id = ?`。影響行数 0 なら `null`。成功時は更新後の行を返す
- **Rationale**: 不在判定と更新を 1 文で行い、競合(編集中に削除)も影響行数で検出できる

### Decision: 成功時は `revalidatePath` で詳細と一覧を再検証し、`redirect` はしない
- **Context**: 要件 3.2 / 3.7
- **Selected Approach**: `revalidatePath("/products/[id]", "page")` と `revalidatePath("/products")` を呼び、`{ status: "success", savedAt }` を返す。モーダルは戻り値を見て閉じる
- **Trade-offs**: `redirect` を使わないため、action は値を返せる(エラーと成功を同じ型で扱える)

## Risks & Mitigations
- 制御コンポーネントと FormData の二重管理 — `name` 属性を付けた制御 `<input>` は FormData にも載る。サーバは FormData だけを信頼する
- `useEffect` で `dialog.close()` を呼ぶタイミング — `savedAt` を依存にし、初期値 `null` では呼ばない
- 保存直後に prop が更新される前にモーダルを再度開く — 開くときに prop から state を初期化するため、古い値が一瞬見えても次の描画で揃う。実害なし

## References
- `node_modules/next/dist/docs/01-app/02-guides/forms.md` — `useActionState`、検証エラー、pending
- `.kiro/specs/product-master/research.md` — Server Action と `revalidatePath` の同一レスポンス再描画
- `src/app/products/[id]/page.tsx`、`src/app/products/actions.ts`、`src/lib/products.ts` — 拡張点
