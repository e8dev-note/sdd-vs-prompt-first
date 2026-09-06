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

## Introduction
これまで認証なし(ローカル単一ユーザー)で動いていた商品マスタ管理アプリに、username / password によるログインとセッション管理を追加する。`/products` 配下の全画面と、それらから呼ばれる操作(編集・削除・ブックマーク)はログイン済みユーザーだけが使える。steering `rules.md` は本 step の直前に「認証なし」から「認証・認可は依頼があった段階で追加する。認証ライブラリは追加せず node:crypto で実装し、パスワードは平文で保存しない」へ改訂済み。既存 spec(`product-master` など)の Introduction にある「認証なし」はその時点の前提であり、本 spec が上書きする。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: ログイン画面と認証、セッションの発行・検証・失効・破棄、未ログイン時のリダイレクトと元 URL への復帰、共通ヘッダ(username とログアウト)、ユーザーの永続化と初期 3 ユーザー、既存操作(編集・削除・ブックマーク)へのログイン必須化、README
- **Out of scope**: ロール・権限による操作の制限(次 step の認可)、ユーザーの追加・変更・削除画面、パスワード変更・リセット、ログイン試行回数の制限、「ログイン状態を保持する」等の期限延長、複数端末のセッション一覧
- **Adjacent expectations**: 既存の一覧・詳細・検索・並び替え・編集・削除・ブックマークの挙動はログイン後は現行どおり。Server Action(`product-master` / `product-edit` / `product-bookmark` 所有)にログイン検査を追加するのは本 spec の責務。ロールは本 spec ではユーザーに持たせない(次 step で追加)

## Requirements

### Requirement 1: ログイン
**Objective:** As a 利用者, I want username と password でログインする, so that 自分として商品マスタを使える

#### Acceptance Criteria
1. The Product Master App shall `/login` に username と password の入力欄と送信ボタンを持つログイン画面を表示する
2. When 利用者が登録済みの username と正しい password を送信した, the Product Master App shall セッションを発行し、ログイン済み状態にする
3. If username が存在しない、password が一致しない、またはいずれかが空である, then the Product Master App shall ログインせず、`/login` に「username か password が誤っている」旨の同一のエラーメッセージを表示する
4. If ログインに失敗した, then the Product Master App shall username の入力値を保持し、password の入力値は保持しない
5. While 利用者がログイン済みである, when `/login` にアクセスした, the Product Master App shall `/products` へ移動する
6. The Product Master App shall ログイン失敗時の応答時間を、username の存在有無で見分けられないようにする(存在しない username でも同等の検証処理を行う)
7. The Product Master App shall ログイン処理を JavaScript が無効なブラウザでも行えるようにする

### Requirement 2: ログイン後の遷移(元の URL への復帰)
**Objective:** As a 利用者, I want ログイン後に見ようとしていた画面に戻る, so that 操作をやり直さなくてよい

#### Acceptance Criteria
1. When 未ログインの利用者が `/products` 配下の URL にアクセスした, the Product Master App shall `/login` へリダイレクトし、元の URL(パスとクエリ)を復帰先として引き継ぐ
2. When 復帰先付きでログインに成功した, the Product Master App shall その復帰先へ移動する
3. If 復帰先がない、または `/products` で始まる内部パスでない, then the Product Master App shall `/products` へ移動する
4. When 未ログインの利用者がルート URL(`/`)にアクセスした, the Product Master App shall 最終的に `/login` に到達する

### Requirement 3: セッション
**Objective:** As a 利用者, I want ログイン状態が一定時間保たれる, so that 画面遷移のたびにログインしなくてよい

#### Acceptance Criteria
1. The Product Master App shall セッション識別子を HttpOnly 属性付きの Cookie で保持し、スクリプトから読めないようにする
2. The Product Master App shall Cookie に SameSite=Lax と Path=/ を設定する
3. The Product Master App shall セッションの有効期限をログイン時刻から 24 時間とし、期限は延長しない
4. If セッションの期限が切れている, then the Product Master App shall 未ログインとして扱い、`/products` 配下へのアクセスを `/login` へリダイレクトする
5. If Cookie のセッション識別子がサーバに存在しない(破棄済み・偽造), then the Product Master App shall 未ログインとして扱う
6. The Product Master App shall セッションの真正性をサーバ側で毎回検証し、Cookie の有無だけでログイン済みと判断しない
7. The Product Master App shall セッション識別子を推測困難な乱数(128 ビット以上)で生成する
8. The Product Master App shall 同じユーザーの複数セッション(複数ブラウザ)を同時に有効にできる

### Requirement 4: 保護される範囲
**Objective:** As a 運用者, I want 未ログインでは商品データに触れない, so that 画面だけでなく操作も保護される

#### Acceptance Criteria
1. While 未ログインである, when `/products` 配下のいずれかの画面にアクセスした, the Product Master App shall 画面を表示せず `/login` へリダイレクトする
2. While 未ログインである, when 商品の編集・削除・ブックマーク切り替えの操作(Server Action)が呼ばれた, the Product Master App shall 操作を実行せず `/login` へ誘導する
3. The Product Master App shall `/login` とログイン処理、静的アセットはログインなしで利用できるようにする
4. While ログイン済みである, the Product Master App shall 既存の一覧・詳細・検索・並び替え・編集・削除・ブックマークを現行どおり動作させる

### Requirement 5: 共通ヘッダとログアウト
**Objective:** As a 利用者, I want 誰でログインしているか分かり、いつでもログアウトできる, so that 端末を離れるときに安全にできる

#### Acceptance Criteria
1. While ログイン済みである, the Product Master App shall 画面上部の共通ヘッダにログイン中の username とログアウトボタンを表示する
2. While 未ログインである(ログイン画面), the Product Master App shall ヘッダに username とログアウトボタンを表示しない
3. When 利用者がログアウトボタンを押した, the Product Master App shall サーバ側のセッションを破棄し、Cookie を無効化して `/login` へ移動する
4. When ログアウト後に同じ Cookie 値で `/products` にアクセスした, the Product Master App shall 未ログインとして扱う
5. The Product Master App shall ログアウトを JavaScript が無効なブラウザでも行えるようにする

### Requirement 6: ユーザーの永続化と初期ユーザー
**Objective:** As a 運用者, I want ユーザーが安全に保存され初期ユーザーで試せる, so that 追加設定なしにログインを確認できる

#### Acceptance Criteria
1. The Product Master App shall ユーザー(username、パスワードの検証情報)を永続ストア(SQLite)に保存する
2. The Product Master App shall パスワードを平文で保存せず、ユーザーごとに異なるソルトを用いた一方向ハッシュで保存する
3. The Product Master App shall パスワードのハッシュ化と検証を Node.js 標準の `node:crypto` のみで実装し、認証ライブラリを追加しない
4. When ユーザーが 1 件も存在しない状態でアプリを起動した, the Product Master App shall admin / admin1234、editor / editor1234、viewer / viewer1234 の 3 ユーザーを投入する
5. If ユーザーがすでに存在する, then the Product Master App shall 初期ユーザーを再投入しない
6. The Product Master App shall username を一意とする
7. When スキーマを変更する, the Product Master App shall 新しい番号の migration ファイルを追加し、既存の migration と既存の商品データを変更しない

### Requirement 7: 文書と品質
**Objective:** As a 開発者, I want ログイン方法が README にあり、認証の規則がテストで守られる, so that 引き継ぎと変更が安全にできる

#### Acceptance Criteria
1. The Product Master App shall README にログイン方法(URL)と初期ユーザー 3 件(username / password)を記載する
2. The Product Master App shall パスワードのハッシュ化・検証、セッションの発行・検証・期限切れ・破棄、復帰先の検証、初期ユーザー投入に対する自動テストを持つ
3. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
