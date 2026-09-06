# Implementation Plan

- [ ] 1. 基盤: スキーマと純粋ロジック
- [x] 1.1 users / sessions のマイグレーションを追加する
  - 連番 003 として users(username 一意、パスワード検証情報、作成時刻)と sessions(ID、ユーザー参照 ON DELETE CASCADE、作成・期限時刻)を作る。既存ファイルは編集しない
  - 既存の migration テストの期待値を 3 件に更新する
  - 完了状態: テストが通り、既存 DB を開くと 003 が適用され products は不変
  - _Requirements: 6.1, 6.6, 6.7_

- [x] 1.2 (P) パスワードのハッシュ化と検証を実装する
  - `node:crypto` の scrypt で、ユーザーごとの乱数ソルト付きの自己記述的な文字列を生成する。検証は同じパラメータで再計算し、時間一定の比較を使う
  - 所要時間の均一化に使うダミーハッシュを用意する
  - テスト: 形式、往復、同じ平文でも毎回異なる、誤パスワード、空文字、壊れた形式は false
  - 完了状態: 上記テストが通り、モジュールは DB・Next に依存しない
  - _Requirements: 6.2, 6.3, 1.6_
  - _Boundary: Password_

- [x] 1.3 (P) セッションの発行・検証・破棄を実装する
  - 256 ビット乱数の ID、作成時刻 + 24 時間の期限で保存する。取得時に期限切れなら削除して未検出扱い。破棄は行削除
  - テスト: 作成と取得、24 時間後に未検出かつ削除済み、不在、破棄後に未検出、同一ユーザーの 2 セッション、ID の長さと一意性
  - 完了状態: 上記テストが通る
  - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8, 5.3, 5.4_
  - _Boundary: Session_

- [x] 1.4 ユーザーの取得・認証・初期投入を実装する
  - ID による取得、username と password による認証(不在でもダミーハッシュを検証してから未認証を返す。空は未認証)
  - 初期 3 ユーザーを、users が 0 件のときだけハッシュ化して投入する。DB 初期化の最後(商品シードの後)に呼ぶ
  - テスト: 空 DB で 3 件、再投入なし、認証の成功 / 誤パスワード / 不在 / 空、保存値が平文でない
  - 完了状態: 上記テストが通る
  - _Depends: 1.2_
  - _Requirements: 1.2, 1.6, 6.2, 6.4, 6.5_

- [ ] 2. コア: 現在ユーザーの取得と保護、ログイン / ログアウト
- [x] 2.1 現在ユーザーの取得・保護・Cookie 操作をまとめる
  - Cookie のセッション ID → セッション → ユーザーの順に解決して現在ユーザーを返す(同一リクエスト内は 1 回だけ DB 照合)
  - 未ログインなら `/login`(復帰先があれば付けて)へ遷移させる保護関数
  - Server Action から呼ぶ Cookie の設定(HttpOnly、SameSite=Lax、Path=/、期限 = セッション期限)と無効化
  - 完了状態: 保護関数を呼ぶページ / action が、Cookie なし・偽造・期限切れのいずれでも `/login` へ遷移する
  - _Requirements: 3.1, 3.2, 3.5, 3.6, 4.1, 4.2_

- [ ] 2.2 ログイン / ログアウトの Server Action とログイン画面を実装する
  - ログイン: username / password / 復帰先を受け取り、認証 → セッション発行 → Cookie 設定 → 検証済みの復帰先(既定 `/products`)へ遷移。失敗は同一メッセージと username を状態で返す(password は返さない)
  - ログアウト: Cookie のセッションを破棄し Cookie を無効化して `/login` へ
  - ログイン画面: ログイン済みなら `/products` へ。フォームは username / password / hidden の復帰先 / 送信。エラーは alert 領域に表示し、username を保持
  - 完了状態: 誤入力で同一エラー、正しい入力で復帰先へ遷移し Cookie が設定される
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.2, 2.3, 5.3, 5.5_

- [ ] 2.3 (P) Proxy で未ログインの `/products` 配下を `/login` へ送る
  - `/products/:path*` のみ対象。Cookie がなければ元のパスとクエリを復帰先に付けて `/login` へ。あれば素通し(検証はしない)
  - 完了状態: Cookie なしで `/products?q=x` にアクセスすると `/login?returnTo=%2Fproducts%3Fq%3Dx` へ、`/login` と静的アセットは影響なし
  - _Requirements: 2.1, 2.4, 4.1, 4.3_
  - _Boundary: Proxy_

- [ ] 2.4 (P) 共通ヘッダを Server Component にして username とログアウトを表示する
  - ログイン中はアプリ名・一覧リンク・username・ログアウトボタン(フォーム)を表示。未ログイン(ログイン画面)はアプリ名のみ
  - レイアウトの静的ヘッダを置き換える
  - 完了状態: ログイン後の全画面に username とログアウトが出て、ログイン画面には出ない
  - _Depends: 2.1, 2.2_
  - _Requirements: 5.1, 5.2, 5.5_
  - _Boundary: AppHeader_

- [ ] 3. 統合と完了条件
- [ ] 3.1 既存のページと Server Action をログイン必須にする
  - 一覧・詳細ページの先頭で保護関数を呼ぶ(復帰先は現在の URL)。詳細は id 解析より前に呼ぶ
  - 編集・削除・ブックマークの 3 つの action の先頭で保護関数を呼ぶ
  - steering の structure.md に、`lib/auth.ts` だけが Next の request API に依存する旨を追記する
  - 完了状態: 未ログインで各ページは `/login?returnTo=` へ、各 action は `/login` へ。ログイン後は既存テストと既存機能が現行どおり
  - _Depends: 2.1_
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 3.2 完了条件を検証し README を更新する
  - README にログイン方法(`/login`)と初期ユーザー 3 件を記載する
  - `npm run build`、`npm run lint`、`npm test` を全て通す
  - ブラウザ / curl で: 未ログインで `/products?q=ST` → `/login?returnTo=` → 誤パスワードで同一エラー・username 保持 → 正しいパスワードで `/products?q=ST` に戻る → ヘッダに username → ログアウト → 同じ Cookie 値で再アクセスすると `/login` → 偽 Cookie は `/login` → curl で JS なしログイン(303 + Set-Cookie の属性)と JS なしのエラー表示 → 未ログインで Server Action POST → `/login` → `/` → `/login`
  - Open Question の判定: JS なしでエラーが描画されなければ代替案(クエリ方式)に切り替え、design.md を更新する
  - 完了状態: 3 コマンドが成功し、上記の流れが動く
  - _Requirements: 1.3, 1.4, 1.7, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5, 4.1, 4.2, 5.4, 7.1, 7.2, 7.3_
