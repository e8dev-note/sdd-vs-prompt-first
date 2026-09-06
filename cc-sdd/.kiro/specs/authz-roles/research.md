# Research & Design Decisions

## Summary
- **Feature**: `authz-roles`
- **Discovery Scope**: Extension(`auth-login` の User とヘッダ、`product-master` / `product-edit` / `product-bookmark` の Server Action と画面への追加。light discovery)
- **Key Findings**:
  - Next.js 16 の `forbidden()` / `forbidden.js` は experimental(`authInterrupts` フラグが必要)。安定機能だけで済ませるため、通常のページ `/forbidden` へ `redirect` する
  - SQLite 3.37 以降は `ALTER TABLE ... ADD COLUMN ... CHECK(...)` が既存行に対しても検査される(検証環境は 3.53)。`NOT NULL DEFAULT 'viewer'` と `CHECK (role IN (...))` を 1 文で追加し、続く `UPDATE` で初期ユーザーにロールを付ける
  - 権限検査の挿入点は 3 つの Server Action(削除・更新・トグル)。`requireUser()` の直後に置く。更新 action は状態を返すため `redirect` ではなくメッセージを返す
  - 画面の出し分けは Server Component 内で `can(user.role, permission)` を評価するだけで済む。`requireUser()` の戻り値に `role` を載せれば、ページ側の追加クエリは不要

## Research Log

### `forbidden()` の扱い
- **Context**: 要件 4.4(403 相当の画面)
- **Sources Consulted**: `03-api-reference/04-functions/forbidden.md`(version: experimental、`experimental.authInterrupts` が必要)
- **Findings**: experimental 機能に依存すると Next のマイナーアップデートで挙動が変わり得る。要件は「権限がない旨を示す画面」であり、HTTP ステータスの厳密さは求めていない
- **Implications**: `src/app/forbidden/page.tsx` を通常ページとして置き、拒否時は `redirect("/forbidden")`。ページは 200 で描画されるが、内容で 403 相当であることを示す。将来 `authInterrupts` が安定したら置き換え可能

### SQLite の ADD COLUMN と CHECK
- **Context**: 要件 1.2 / 1.3 / 1.6
- **Sources Consulted**: SQLite ALTER TABLE ドキュメント(既知)
- **Findings**: `ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer'))` は既存行を既定値 viewer で埋め、以後の INSERT / UPDATE で 3 値以外を拒否する。同じ migration 内で `UPDATE users SET role = username WHERE username IN ('admin','editor','viewer')` を実行すれば既存の初期ユーザーにロールが付く
- **Implications**: 004 は 2 文。既定値 viewer は要件 1.5(最小権限)とも整合する

### 既存コードの拡張点
- **Sources Consulted**: `src/lib/users.ts`、`src/lib/auth.ts`、`src/app/products/actions.ts`、`src/app/products/page.tsx`、`src/app/products/[id]/page.tsx`、`src/components/app-header.tsx`、`src/components/bookmark-toggle.tsx`、`tests/users.test.ts`、`tests/db.test.ts`
- **Findings**:
  - `User` は `{ id, username }`。`getUserById` / `authenticate` の SELECT に `role` を足し、`parseRole` で 3 値に丸める
  - `requireUser()` は `User` を返す。ページはすでにこれを `await` しているので、戻り値を変数に受けて `can()` に渡すだけ
  - `BookmarkToggle` はフォームを描画する。viewer 用に「印だけ」を出す分岐を同じ部品に足す(props に `canToggle`)
  - `tests/users.test.ts` の `Object.keys(u)` が `["id","username"]` を期待している → `role` 追加で更新(既存テスト改変)。`tests/db.test.ts` の migration 件数も 4 に更新
- **Implications**: 既存コード改変は users.ts、auth.ts、actions.ts、products/page.tsx、[id]/page.tsx、app-header.tsx、bookmark-toggle.tsx、db.ts(なし)、README + 既存テスト 2 ファイル

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| ロール → 権限(操作)の静的表(採用) | `ROLE_PERMISSIONS: Record<Role, Permission[]>` と `can(role, permission)` | 1 か所で定義(要件 2.5)、テストで全組み合わせを固定できる、画面とサーバで同じ関数 | 商品単位の権限には拡張しにくい | 要件は操作単位のみ |
| ロールの大小比較(viewer < editor < admin) | 数値の序列で判定 | 短い | 「editor はできるが admin はできない」操作が将来出ると破綻。権限表が暗黙になる | 不採用 |
| ロール名を直接 `if` で比較 | 各所で `user.role === "admin"` | 追加コードなし | 権限表が散らばり、要件 2.5 に反する | 不採用 |

## Design Decisions

### Decision: 権限は操作名の文字列、ロールごとの許可集合を 1 か所に置く
- **Context**: 要件 2.1〜2.5
- **Selected Approach**: `Permission = "product:view" | "product:edit" | "product:delete" | "bookmark:toggle"`。`ROLE_PERMISSIONS` で viewer は view のみ、editor は + edit + bookmark:toggle、admin は + delete。`can(role, permission)` を画面とサーバの両方で使う
- **Trade-offs**: `product:view` は現状全ロール許可で判定に使われないが、権限表を完全にするために置く

### Decision: 拒否時の応答は action の形で分ける
- **Context**: 要件 4.4 / 4.5
- **Selected Approach**: `redirect` 型の action(削除・トグル)は `requirePermission()` が `redirect("/forbidden")`。状態を返す action(更新)は `can()` で判定し `formError: "この操作を行う権限がありません"` を返す
- **Rationale**: 更新 action で `redirect` するとモーダルごと画面が遷移し、入力が失われる。モーダル内表示のほうが利用者に分かりやすい

### Decision: ロールは `users.role` 列、既定 viewer、CHECK 制約
- **Context**: 要件 1.1 / 1.2 / 1.5
- **Selected Approach**: 上記 migration 004。読み取り時も `parseRole` で 3 値以外を viewer に丸める(二重の防御)
- **Trade-offs**: 別テーブル(user_roles)にすれば複数ロールに拡張できるが、要件は 1 ユーザー 1 ロール

### Decision: viewer にはブックマークの印だけを出す
- **Context**: 要件 3.4(切り替え操作は出さず、状態表示は残す)
- **Selected Approach**: `BookmarkToggle` に `canToggle` を追加し、false ならフォームなしの `<span aria-label>` で ★/☆ を描く。行の強調は従来どおり
- **Rationale**: 部品を分けるより、呼び出し側の分岐が 1 つで済む

### Decision: 権限検査はセッション由来のロールのみを使う
- **Context**: 要件 4.7
- **Selected Approach**: `requirePermission` は `requireUser()` の戻り値(DB から解決した `User`)の `role` を使う。FormData や URL のロール値は読まない

## Risks & Mitigations
- 権限表の変更漏れ — `tests/authz.test.ts` で全ロール × 全操作の期待値を明示し、表の変更がテスト差分に必ず現れるようにする
- `User` 型の変更で既存テストが落ちる — `users.test.ts` の期待キーに `role` を追加(意図的な改変)
- 未ログインと権限なしの順序 — `requirePermission` は内部で `requireUser` を先に呼ぶ(要件 4.6 / 4.8)
- ヘッダの表示だけでロールを判断しない — 表示はセッションから解決した `User.role`。判定も同じ値

## References
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/forbidden.md` — experimental
- `.kiro/specs/auth-login/design.md` — `requireUser`、`User`
- `src/app/products/actions.ts`、`src/components/bookmark-toggle.tsx` — 挿入点
