# Research & Design Decisions

## Summary
- **Feature**: `auth-login`
- **Discovery Scope**: New Feature(認証は新しい横断関心。セキュリティ影響があるため full 相当。ただし Web 検索は行わず、AGENTS.md の指示どおり `node_modules/next/dist/docs/` と Node 標準 API を参照)
- **Key Findings**:
  - Next.js 16 の推奨は「Proxy(`src/proxy.ts`)で Cookie の有無だけを見る楽観チェック + データに近い層(Data Access Layer)で毎回セッションを検証」。Proxy は Node ランタイムだが、prefetch を含む全リクエストで動くため DB アクセスは避ける(`02-guides/authentication.md`)
  - `cookies().set/delete` は Server Function(Server Action)か Route Handler でのみ可能。Server Component の描画中は読み取りのみ(`04-functions/cookies.md`)
  - `middleware` は v16 で `proxy` に改名。ファイルは `src/proxy.ts`、`matcher` で対象パスを絞る(`03-file-conventions/proxy.md`)
  - `node:crypto` に `scryptSync`、`randomBytes`、`timingSafeEqual` がある(Node 25 で確認)。パスワードは scrypt + ユーザーごとの乱数ソルト、比較は `timingSafeEqual`
  - 既存の `safeReturnTo`(`product-bookmark` で追加)は「`/products` で始まる内部パスのみ許可」で、要件 2.3 と一致する。再利用する

## Research Log

### Next.js の認証ガイド
- **Context**: Cookie ベースのセッションをどこで検証するか
- **Sources Consulted**: `02-guides/authentication.md`(Session Management / Authorization / Optimistic checks with Proxy / Data Access Layer)
- **Findings**:
  - 「Proxy は最初の防衛線に過ぎず、検査はデータ源に近い場所で行う」。Proxy では Cookie の有無・内容だけを見て redirect する
  - セッションは DB セッション(ID を Cookie に持つ)とステートレス(署名付き Cookie)の 2 方式。DB セッションはサーバ側で即時失効でき、要件 5.3 / 5.4(ログアウト後の再利用無効)に直結する
  - Proxy は Node.js ランタイム。better-sqlite3 は動くはずだが、ガイドは DB アクセスを避けることを推奨
- **Implications**: Proxy は Cookie の有無で `/login?returnTo=` へ redirect するだけ。ページと Server Action は `requireUser()`(DB 照合)を必ず呼ぶ

### `cookies()` の制約
- **Context**: セッション Cookie をいつ set / delete するか
- **Sources Consulted**: `04-functions/cookies.md`
- **Findings**: set / delete は Server Action 内で行う。ログイン(set)とログアウト(delete)はどちらもフォーム → Server Action なので問題ない。Server Component は読み取りのみ(ヘッダの username 表示に使う)
- **Implications**: 期限切れセッションの Cookie を Server Component から消すことはできない。次のログイン/ログアウト時に上書きされる(未ログイン扱いになるため実害なし)

### `useActionState` の progressive enhancement
- **Context**: 要件 1.7(JS 無効でもログインできる)と 1.3 / 1.4(エラー表示と username 保持)
- **Sources Consulted**: `02-guides/forms.md`、`02-guides/server-actions.md`
- **Findings**: `<form action={serverAction}>` は JS 無効でも POST され、Server Action が実行される。成功時は `redirect`(303)で遷移。失敗時に `useActionState` の戻り値(エラーと username)が再描画に反映されるかは、実装後に JS なし(curl)で確認する
- **Implications**: 一次案は `useActionState`。JS なしでエラーが表示されなければ、失敗時に `/login?error=1&username=...` へ `redirect` する代替案に切り替える(設計の Open Questions に記載)

### `node:crypto` によるパスワードハッシュ
- **Context**: 要件 6.2 / 6.3(平文保存禁止、ライブラリ追加禁止)
- **Sources Consulted**: Node.js `crypto` ドキュメント(既知)、`scryptSync` の存在確認
- **Findings**: `scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })` が標準で使える。保存形式は自己記述的(`scrypt$N$r$p$salt$hash`)にすると将来のパラメータ変更に耐える。比較は `timingSafeEqual`
- **Implications**: `src/lib/password.ts` に閉じる。未知の username でも固定のダミーハッシュを検証して所要時間を揃える(要件 1.6)

### 既存コードの拡張点
- **Sources Consulted**: `src/app/layout.tsx`、`src/app/products/page.tsx`、`src/app/products/[id]/page.tsx`、`src/app/products/actions.ts`、`src/lib/db.ts`、`src/lib/list-url.ts`
- **Findings**:
  - レイアウトのヘッダは静的。ユーザー情報を出すには Server Component 化した `AppHeader` に置き換える(レイアウト自体は Server Component なので `cookies()` を読める)
  - 3 つの Server Action と 2 つのページに `requireUser()` を足す(既存コード改変)
  - `db.ts` の bootstrap は products のシードだけを呼ぶ。users のシードを追加する
- **Implications**: 既存コード改変は layout.tsx、products/page.tsx、[id]/page.tsx、actions.ts、db.ts、README の 6 ファイル

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| DB セッション + HttpOnly Cookie(採用) | sessions テーブルに ID・期限を持ち、Cookie は ID のみ | ログアウトで即時失効、期限はサーバで判定、Cookie に秘密を置かない | 毎リクエスト 1 クエリ | 要件 3.4〜3.6、5.3、5.4 |
| 署名付き Cookie(ステートレス) | `createHmac` でユーザー ID と期限を署名 | DB 不要 | ログアウト後も期限まで有効。失効一覧が要る | 不採用 |
| Proxy で DB 照合 | Proxy 内で sessions を引く | ページ側の検査を省ける | ガイドが非推奨。prefetch ごとに DB。Proxy と app で接続が別 | 不採用 |

## Design Decisions

### Decision: 二段構え(Proxy は楽観、ページ / Server Action は `requireUser()` で DB 照合)
- **Context**: 要件 3.6、4.1、4.2
- **Selected Approach**: `src/proxy.ts` は `/products/:path*` で Cookie がなければ `/login?returnTo=` へ。`/products` のページと全 Server Action は `requireUser()` を呼び、無効・期限切れなら `/login` へ
- **Rationale**: Next.js ガイドどおり。偽造 Cookie は Proxy を通過してもページで弾かれる
- **Trade-offs**: 検査が 2 か所。Proxy を外しても安全性は変わらない(利便性のみ)

### Decision: パスワードは scrypt、保存形式は `scrypt$N$r$p$<salt b64url>$<hash b64url>`
- **Context**: 要件 6.2 / 6.3
- **Selected Approach**: 上記。検証は同じパラメータで再計算し `timingSafeEqual`
- **Trade-offs**: bcrypt 等は使えない(ライブラリ禁止)。scrypt は Node 標準で十分

### Decision: 未知の username でもダミーハッシュを検証する
- **Context**: 要件 1.6
- **Selected Approach**: 起動時に固定文字列から作ったダミーハッシュを 1 つ保持し、ユーザー不在時はそれに対して `verifyPassword` を実行してから `null` を返す

### Decision: セッション ID は `randomBytes(32)` の base64url、期限は作成時刻 + 24h(固定)
- **Context**: 要件 3.3、3.7
- **Selected Approach**: 上記。期限判定は `expires_at`(ISO8601)と現在時刻の文字列比較ではなく `Date` 比較。期限切れは読んだときに削除(遅延クリーンアップ)
- **Trade-offs**: 期限延長なし(要件どおり)

### Decision: 復帰先は既存の `safeReturnTo` を再利用
- **Context**: 要件 2.1〜2.3
- **Selected Approach**: Proxy が `returnTo=<pathname + search>` を付け、ログイン成功時に `safeReturnTo(returnTo)` へ `redirect`。`/products` 以外や外部 URL は `/products`
- **Trade-offs**: 復帰先は `/products` 配下に限定される(現状 それ以外の保護ページはない)

### Decision: Cookie 属性は HttpOnly、SameSite=Lax、Path=/、Secure なし
- **Context**: 要件 3.1 / 3.2。ローカル http で動かす
- **Selected Approach**: `secure` は付けない。https 配備時は有効化が必要(Open Question として記録)

### Decision: `lib/auth.ts` は Next の request API に依存する唯一の lib モジュール
- **Context**: steering `structure.md` は「`lib` は React に依存しない」。`cookies()` / `redirect()` は Next の API
- **Selected Approach**: 純粋な部分(`password.ts`、`session.ts`、`users.ts`)と、Next 依存の薄い層(`auth.ts`: `getCurrentUser` / `requireUser` / Cookie の set・clear)を分け、後者だけが `next/headers` と `next/navigation` を import する
- **Rationale**: テストは純粋な部分に集中でき、Next 依存はページ・action から呼ぶ 1 ファイルに閉じる

## Risks & Mitigations
- Proxy が静的アセットや `/login` をブロックする — `matcher` を `/products/:path*` に限定(要件 4.3)
- JS なしでログイン失敗のエラーが出ない — 実装後に curl で確認。出なければクエリ方式に切り替え(Open Question)
- `updateProductAction` は状態を返す action だが `requireUser()` は `redirect` を投げる — Server Action 内の `redirect` は許容される(`try/catch` の外で呼ぶ)
- 既存 DB(001/002 適用済み)への 003 適用 — `db.test.ts` の既存 DB 昇格テストと同じ方式で確認。users / sessions は新規テーブルなので products に影響しない
- ヘッダの `cookies()` 読み取りで全ページが動的になる — 既に全ページ動的(`searchParams` / `params` 使用)。`/login` も動的で問題ない

## References
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — Proxy は楽観チェック、DAL で検証
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — set / delete は Server Function のみ
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — `proxy.ts`、`matcher`、Node ランタイム
- Node.js `crypto`: `scryptSync`、`randomBytes`、`timingSafeEqual`
- `.kiro/specs/product-bookmark/design.md` — `safeReturnTo`
