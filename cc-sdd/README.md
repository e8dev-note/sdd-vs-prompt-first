# 商品マスタ管理(cc-sdd トラック)

商品マスタ(products)をローカルで閲覧・管理する Web アプリです。Next.js(App Router)+ SQLite(better-sqlite3)で動き、外部サービスには接続しません。

仕様は `.kiro/specs/` 配下(requirements / design / tasks)、プロジェクト共通ルールは `.kiro/steering/` にあります。

## 動作環境

- Node.js 20 以上(検証は Node.js 25 で実施)
- npm

## 起動手順

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開くとログイン画面(`/login`)に移動します。ログイン後は商品一覧(`/products`)へ移動します。

## ログイン

- ログイン画面: http://localhost:3000/login
- 初期ユーザー(初回起動時に自動投入。パスワードは scrypt でハッシュ化して保存):

| username | password |
|---|---|
| admin | admin1234 |
| editor | editor1234 |
| viewer | viewer1234 |

## ロールと権限

| 操作 | viewer | editor | admin |
|---|---|---|---|
| 一覧・検索・並び替え・ブックマークのみ表示フィルタ・詳細の閲覧 | ○ | ○ | ○ |
| 商品の編集 | - | ○ | ○ |
| ブックマークの ON / OFF | - | ○ | ○ |
| 商品の削除 | - | - | ○ |

- 初期ユーザーのロールは username と同じです(admin / editor / viewer)。ヘッダに username とロールが表示されます。
- 権限のない操作はボタンが表示されず、フォーム偽装や URL 直接指定で要求してもサーバ側で拒否されます(削除・ブックマークは `/forbidden` へ、編集はモーダル内にメッセージ)。

- セッションは HttpOnly Cookie で管理し、有効期限はログインから 24 時間です。画面上部のヘッダにログイン中の username とログアウトボタンがあります。
- 未ログインで `/products` 配下にアクセスすると `/login` にリダイレクトされ、ログイン後に元の画面へ戻ります。

初回起動時に `data/app.db` が作成され、`db/migrations/` の SQL が順に適用されたあと、商品が 0 件なら初期データ 20 件が投入されます。DB を初期化したい場合は `data/app.db` を削除して再起動してください。

## 機能

- ログイン / ログアウト(`/login`)。`/products` 配下と、編集・削除・ブックマークの操作はログインが必要
- 商品一覧 `/products`: code / name / category / price を表形式で表示(code 昇順)
- キーワード検索: 一覧上部の検索ボックス。code / name / category の部分一致。条件は `?q=` に反映され、リロードしても保持されます
- 商品詳細 `/products/[id]`: 全列を表示。存在しない id は 404
- 削除: 詳細画面の「削除」ボタン。確認ダイアログの後に削除し、一覧へ戻ります

## 検証コマンド

```bash
npm run build   # 本番ビルド
npm run lint    # ESLint
npm test        # Vitest(tests/ 配下。一時ディレクトリの DB を使うため data/app.db は変更しません)
```

## ディレクトリ

- `src/app/` … 画面と Server Action
- `src/components/` … UI 部品
- `src/lib/` … DB 接続、マイグレーション適用、シード、商品データアクセス、認証(パスワードハッシュ、セッション、ユーザー)
- `src/proxy.ts` … 未ログインの `/products` 配下アクセスを `/login` へ送る楽観チェック
- `db/migrations/` … スキーマ変更の SQL(連番、追記のみ)
- `data/` … SQLite ファイル(git 管理外)
- `tests/` … Vitest のテスト
