# Requirements Document

## Project Description (Input)
簡易的な認証機能を追加してください。

- ユーザーは username と password でログインする。ログイン画面は /login。
- ログイン成功後はセッションを発行し、元々アクセスしようとしていた画面(なければ /products)へ移動する。
- ログイン失敗時は /login にエラーメッセージを表示する(username と password のどちらが誤りかは区別しない)。
- 未ログインの状態で /products 配下にアクセスしたら /login にリダイレクトする。
- 画面上部に共通ヘッダを置き、ログイン中の username とログアウトボタンを表示する。ログアウトでセッションを破棄し /login へ戻る。
- セッションは HttpOnly Cookie で管理し、有効期限は 24 時間とする。
- パスワードは平文で保存しない。認証ライブラリは追加せず、Node.js 標準(node:crypto)で実装する。
- ユーザーは DB(SQLite)に保存する。初期データとして次の3ユーザーをシードする。
  - admin / admin1234
  - editor / editor1234
  - viewer / viewer1234
- README にログイン方法と初期ユーザーを書く。

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->
