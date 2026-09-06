# Requirements Document

## Project Description (Input)
商品マスタ管理の Web アプリを新規に作ってください。

機能:
- 商品一覧(/products): 全件を表形式で表示する。列は code, name, category, price。
- キーワード検索: 一覧画面上部の検索ボックスに入力した文字列で code, name, category を部分一致検索する。検索条件は URL クエリ(?q=)に反映し、リロードしても保持する。
- 商品詳細(/products/[id]): 全列を表示する。存在しない id は 404。
- 削除: 詳細画面から削除できる。削除前に確認ダイアログを出す。削除後は一覧に戻る。

完了条件:
- npm run dev で起動し、上記が動作する。
- npm run build、npm run lint、npm test が通る。
- README に起動手順を書く。

## Introduction
商品マスタ(products)をローカルで閲覧・保守する Web アプリの初回リリース。商品の一覧表示、キーワード検索、詳細表示、削除を提供する。商品データはローカルに永続化され、アプリを再起動しても保持される。ユーザーはローカル単一ユーザーで、認証は行わない(steering `rules.md`)。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: 商品の一覧表示、キーワード検索、詳細表示、削除(確認付き)、初期データの投入、起動手順の文書化
- **Out of scope**: 商品の新規登録・編集、一覧の並び替え・ページング、ユーザー認証・認可、外部サービス連携
- **Adjacent expectations**: 商品の列定義(id, code, name, category, price, note, created_at, updated_at)と制約は steering `rules.md` に従う。将来の機能追加はこの一覧・詳細画面を起点に行う

## Requirements

### Requirement 1: 商品一覧表示
**Objective:** As a 商品マスタの利用者, I want 全商品を一覧で見る, so that 登録されている商品を把握できる

#### Acceptance Criteria
1. When ユーザーが `/products` にアクセスした, the Product Master App shall 登録されている全商品を表形式で表示する
2. The Product Master App shall 一覧の列として code, name, category, price を表示する
3. The Product Master App shall 一覧の各行から当該商品の詳細画面(`/products/[id]`)へ遷移できる導線を提供する
4. The Product Master App shall 一覧を code の昇順で表示する
5. If 表示対象の商品が 0 件である, then the Product Master App shall 該当する商品がない旨を一覧画面に表示する
6. When ユーザーがルート URL(`/`)にアクセスした, the Product Master App shall 商品一覧(`/products`)へ誘導する

### Requirement 2: キーワード検索
**Objective:** As a 商品マスタの利用者, I want 一覧を文字列で絞り込む, so that 目的の商品をすぐに見つけられる

#### Acceptance Criteria
1. The Product Master App shall 一覧画面の上部に検索ボックスを表示する
2. When ユーザーが検索ボックスに文字列を入力して検索を実行した, the Product Master App shall code, name, category のいずれかにその文字列を部分一致で含む商品のみを一覧に表示する
3. When 検索が実行された, the Product Master App shall 検索文字列を URL クエリ `?q=` に反映する
4. When `?q=` を含む URL でアクセスまたはリロードした, the Product Master App shall そのクエリで絞り込んだ一覧を表示し、検索ボックスにもその文字列を表示する
5. If 検索文字列が空(空白のみを含む)である, then the Product Master App shall 全商品を表示する
6. The Product Master App shall 検索文字列の英字について大文字小文字を区別せずに一致させる
7. If 検索文字列にワイルドカードとして解釈されうる記号(`%`、`_` など)が含まれる, then the Product Master App shall それらを通常の文字として扱い、文字どおりに一致させる
8. If 検索結果が 0 件である, then the Product Master App shall 該当する商品がない旨を表示し、検索文字列は保持する

### Requirement 3: 商品詳細表示
**Objective:** As a 商品マスタの利用者, I want 1件の商品の全項目を見る, so that 商品の詳細を確認できる

#### Acceptance Criteria
1. When ユーザーが存在する商品の `/products/[id]` にアクセスした, the Product Master App shall その商品の全列(id, code, name, category, price, note, created_at, updated_at)を表示する
2. If note が未設定である, then the Product Master App shall note を空として表示しエラーにしない
3. If 指定された id の商品が存在しない, then the Product Master App shall HTTP 404 を返し、見つからない旨の画面を表示する
4. If id が数値として解釈できない, then the Product Master App shall HTTP 404 を返す
5. The Product Master App shall 詳細画面から一覧画面へ戻る導線を提供する

### Requirement 4: 商品削除
**Objective:** As a 商品マスタの利用者, I want 不要な商品を削除する, so that マスタを最新の状態に保てる

#### Acceptance Criteria
1. The Product Master App shall 詳細画面に削除操作を提供する
2. When ユーザーが削除操作を行った, the Product Master App shall 削除を実行する前に確認ダイアログを表示する
3. When ユーザーが確認ダイアログで削除を承認した, the Product Master App shall その商品を永続ストアから削除し、一覧画面へ遷移する
4. When ユーザーが確認ダイアログで削除を取り消した, the Product Master App shall 商品を削除せず詳細画面に留まる
5. When 削除が完了した, the Product Master App shall 以後の一覧・検索・詳細でその商品を表示しない
6. If 削除対象の商品がすでに存在しない, then the Product Master App shall エラー画面を出さずに一覧画面へ遷移する

### Requirement 5: データの永続化と初期データ
**Objective:** As a 商品マスタの利用者, I want 起動直後から商品データが存在し再起動後も保持される, so that セットアップなしに動作を確認できる

#### Acceptance Criteria
1. The Product Master App shall 商品データをローカルファイルに永続化し、アプリを再起動しても保持する
2. When 商品データが 1 件も存在しない状態でアプリを起動した, the Product Master App shall 20 件程度の初期商品データを投入する
3. If 商品データがすでに存在する, then the Product Master App shall 初期データを再投入せず、既存データを変更しない
4. The Product Master App shall 商品の code の一意性と price が 0 以上の整数であることを保つ

### Requirement 6: 起動・品質・文書化
**Objective:** As a 開発者, I want 定められたコマンドで起動・検証できる, so that 完了条件を機械的に確認できる

#### Acceptance Criteria
1. When 開発者が `npm run dev` を実行した, the Product Master App shall 追加のセットアップなしに起動し、Requirement 1〜5 の機能が動作する
2. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
3. The Product Master App shall 一覧、検索、詳細、削除の各機能に対して最低 1 つの自動テストを持つ
4. The Product Master App shall README に起動手順(依存のインストール、起動コマンド、アクセス先 URL)を記載する
