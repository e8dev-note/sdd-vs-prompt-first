# Requirements Document

## Project Description (Input)
認可(ロールベースのアクセス制御)を追加してください。

- ユーザーにロールを持たせる。ロールは admin, editor, viewer の3種類。
- 初期ユーザーのロールは username と同じ(admin=admin, editor=editor, viewer=viewer)。既存 DB のユーザーにも適用されること。
- ロールごとの権限:
  - viewer: 一覧、検索、並び替え、ブックマークのみ表示フィルタ、詳細の閲覧。
  - editor: viewer の権限 + 商品の編集 + ブックマークの ON/OFF。
  - admin: editor の権限 + 商品の削除。
- 権限のない操作のボタンやリンクは画面に表示しない。
- 画面に表示しないだけでなく、サーバ側でも権限を検査する。フォームの偽装や URL の直接指定で権限のない操作を実行しようとした場合は拒否し、実行しない。
- 共通ヘッダに username に加えてロールを表示する。
- README にロールと権限の対応表を書く。

## Introduction
ログイン(spec `auth-login`)済みのユーザーに admin / editor / viewer のロールを持たせ、操作ごとに必要なロールを定める。閲覧系(一覧・検索・並び替え・フィルタ・詳細)は全ロール、編集とブックマークの切り替えは editor 以上、削除は admin のみ。権限のない操作は画面に出さず、サーバ側でも拒否する。認証の仕組み(セッション、ログイン画面)は変更しない。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: ロールの永続化と初期ユーザーへの適用、ロールと操作の対応(権限表)、画面での表示制御、Server Action での権限検査と拒否時の応答、ヘッダのロール表示、README の対応表
- **Out of scope**: ロールの変更画面、ユーザー管理、権限の細分化(商品単位・項目単位)、閲覧の制限(全ロールが閲覧可能)、監査ログ
- **Adjacent expectations**: `auth-login` の `User` にロールが加わり、`requireUser` は従来どおりログインだけを検査する。権限検査は本 spec が提供する関数を、`product-master`(削除)、`product-edit`(編集)、`product-bookmark`(トグル)の Server Action と画面に挿入する。ログイン・ログアウト・セッションの挙動は変えない

## Requirements

### Requirement 1: ロールの永続化と初期適用
**Objective:** As a 運用者, I want 各ユーザーにロールが保存され初期ユーザーに正しく付く, so that 追加設定なしに権限の違いを確認できる

#### Acceptance Criteria
1. The Product Master App shall 各ユーザーに admin / editor / viewer のいずれか 1 つのロールを永続ストアに保存する
2. The Product Master App shall ロールに上記 3 値以外を保存できないようにする
3. When 本機能を初めて適用した(既存のユーザーが存在する), the Product Master App shall 既存ユーザー admin / editor / viewer にそれぞれ username と同じロールを付与し、それ以外の列を変更しない
4. When ユーザーが 1 件も存在しない状態で初期ユーザーを投入した, the Product Master App shall 各初期ユーザーに username と同じロールを付与する
5. If ロールが未設定または解釈できないユーザーがいる, then the Product Master App shall そのユーザーを viewer として扱う(最小権限)
6. When スキーマを変更する, the Product Master App shall 新しい番号の migration ファイルを追加し、既存の migration・商品・セッションを変更しない

### Requirement 2: 権限表
**Objective:** As a 利用者, I want ロールごとにできる操作が決まっている, so that 誤って他人の権限外の変更が起きない

#### Acceptance Criteria
1. The Product Master App shall viewer に 一覧表示、キーワード検索、並び替え、ブックマークのみ表示フィルタ、詳細の閲覧 を許可する
2. The Product Master App shall editor に viewer の全操作に加えて 商品の編集 と ブックマークの ON/OFF を許可する
3. The Product Master App shall admin に editor の全操作に加えて 商品の削除 を許可する
4. The Product Master App shall 上記以外の操作をどのロールにも許可しない(権限は列挙された操作に限る)
5. The Product Master App shall ロールと操作の対応をコード上の 1 か所で定義し、画面の表示制御とサーバ側の検査の両方がそれを参照する

### Requirement 3: 画面での表示制御
**Objective:** As a 利用者, I want 自分にできない操作のボタンが出ない, so that 押しても拒否される操作に迷わない

#### Acceptance Criteria
1. While ログイン中のユーザーが viewer である, the Product Master App shall 詳細画面に「編集」ボタンと「削除」ボタンを表示しない
2. While ログイン中のユーザーが editor である, the Product Master App shall 詳細画面に「編集」ボタンを表示し、「削除」ボタンを表示しない
3. While ログイン中のユーザーが admin である, the Product Master App shall 詳細画面に「編集」と「削除」の両方のボタンを表示する
4. While ログイン中のユーザーが viewer である, the Product Master App shall 一覧の各行と詳細画面にブックマークの切り替え操作を表示せず、ブックマーク中かどうかの表示(印と行の強調)は残す
5. While ログイン中のユーザーが editor または admin である, the Product Master App shall 一覧の各行と詳細画面にブックマークの切り替え操作を表示する
6. The Product Master App shall 全ロールに一覧・検索・並び替え・フィルタ・詳細の閲覧 UI を従来どおり表示する

### Requirement 4: サーバ側の権限検査
**Objective:** As a 運用者, I want 画面をすり抜けた要求も拒否される, so that フォーム偽装や URL 直打ちでデータが変わらない

#### Acceptance Criteria
1. When 商品の削除が要求された, the Product Master App shall 要求者のロールが admin であることをサーバ側で検査し、そうでなければ削除を実行しない
2. When 商品の編集(保存)が要求された, the Product Master App shall 要求者のロールが editor または admin であることをサーバ側で検査し、そうでなければ保存を実行しない
3. When ブックマークの切り替えが要求された, the Product Master App shall 要求者のロールが editor または admin であることをサーバ側で検査し、そうでなければ変更を実行しない
4. If 権限のない操作が画面遷移を伴う形(削除・ブックマーク切り替え)で要求された, then the Product Master App shall 操作を実行せず、権限がない旨を示す画面(HTTP 403 相当)へ遷移する
5. If 権限のない操作が結果を画面内に表示する形(編集モーダルの保存)で要求された, then the Product Master App shall 操作を実行せず、モーダル内に権限がない旨のメッセージを表示する
6. The Product Master App shall 権限検査をログイン検査の後に、かつ対象データの変更より前に行う
7. The Product Master App shall 権限検査に、要求に含まれる値ではなくセッションから解決したユーザーのロールを用いる
8. While 未ログインである, when 上記の操作が要求された, the Product Master App shall 従来どおり `/login` へ誘導する(認証の挙動は変えない)

### Requirement 5: ヘッダと文書
**Objective:** As a 利用者, I want 今のロールが見え、権限の対応表を参照できる, so that 何ができるかを把握できる

#### Acceptance Criteria
1. While ログイン中である, the Product Master App shall 共通ヘッダに username に加えてロール名を表示する
2. The Product Master App shall README にロールと操作の対応表(viewer / editor / admin × 各操作)を記載する

### Requirement 6: 品質
**Objective:** As a 開発者, I want 権限表と初期適用がテストで守られる, so that 以後の変更で権限が緩まない

#### Acceptance Criteria
1. The Product Master App shall 権限表(全ロール × 全操作の許可 / 拒否)、ロール値の解釈(不正値は viewer)、既存ユーザーへのロール適用、初期ユーザーのロール、認証結果にロールが含まれることに対する自動テストを持つ
2. The Product Master App shall 権限のない要求がサーバ側で拒否されることを、画面を経由しない要求(フォーム偽装相当)で確認する手順を完了条件に含める
3. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
