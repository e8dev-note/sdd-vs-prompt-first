# Requirements Document

## Project Description (Input)
商品のブックマーク機能を追加してください。

- 一覧の各行と詳細画面にブックマークの ON/OFF トグルを置く。
- ブックマーク状態はサーバ側(SQLite)に保存する。ユーザー概念はないので商品ごとに1つのフラグでよい。
- 一覧に「ブックマークのみ表示」フィルタを追加し、URL クエリ(?bookmarked=1)に反映する。検索・並び替えと併用できる。
- 一覧・詳細ともにブックマーク中であることが視覚的に分かるようにする。

## Introduction
商品ごとに 1 つのブックマークフラグを持たせ、一覧の各行と詳細画面から ON/OFF を切り替えられるようにする。一覧には「ブックマークのみ表示」フィルタを追加し、既存のキーワード検索(`?q=`、spec `product-master`)と並び替え(`?sort=` / `?order=`、spec `product-sort`)と独立に組み合わせられる。ローカル単一ユーザー・認証なしの前提(steering `rules.md`)は変わらない。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: ブックマークフラグの永続化、一覧・詳細のトグル、一覧のフィルタとその URL 反映、検索・並び替え・フィルタの相互保持、ブックマーク中の視覚表示
- **Out of scope**: ユーザーごとのブックマーク、ブックマークの一括操作、編集モーダルからのブックマーク変更、並び替え・検索・編集・削除の仕様変更(各 spec が所有)
- **Adjacent expectations**: 商品データ(`product-master`)にフラグ列を追加し、一覧取得にフィルタ条件を追加する。一覧 URL の組み立て(`product-sort`)にフィルタを加える。既存の一覧・詳細・検索・並び替え・編集・削除は現行どおり動作すること

## Requirements

### Requirement 1: ブックマークの切り替え
**Objective:** As a 商品マスタの利用者, I want 気になる商品に印を付けたり外したりする, so that 後で見返す商品を覚えておける

#### Acceptance Criteria
1. The Product Master App shall 一覧の各行にその商品のブックマーク ON/OFF トグルを表示する
2. The Product Master App shall 詳細画面にその商品のブックマーク ON/OFF トグルを表示する
3. When ユーザーがブックマーク OFF の商品のトグルを操作した, the Product Master App shall その商品をブックマーク ON として保存する
4. When ユーザーがブックマーク ON の商品のトグルを操作した, the Product Master App shall その商品をブックマーク OFF として保存する
5. When 一覧でトグルを操作した, the Product Master App shall 操作後も同じ検索条件・並び順・フィルタの一覧を表示し続ける
6. When 詳細画面でトグルを操作した, the Product Master App shall 操作後も同じ商品の詳細画面を表示し続ける
7. The Product Master App shall トグル操作を JavaScript が無効なブラウザでも行えるようにする
8. If トグル対象の商品が存在しない, then the Product Master App shall エラー画面を出さず一覧画面へ遷移する

### Requirement 2: ブックマーク状態の永続化
**Objective:** As a 商品マスタの利用者, I want ブックマークが再起動後も残る, so that 印を付け直さなくてよい

#### Acceptance Criteria
1. The Product Master App shall ブックマーク状態を商品ごとに 1 つのフラグとして永続ストアに保存し、アプリを再起動しても保持する
2. When 既存の永続ストアに対して本機能を初めて適用した, the Product Master App shall 既存の全商品をブックマーク OFF として扱い、他の列の値を変更しない
3. The Product Master App shall ブックマークの切り替えで商品の updated_at を変更しない
4. When 商品が削除された, the Product Master App shall その商品のブックマーク状態も一緒に消す

### Requirement 3: ブックマークのみ表示フィルタ
**Objective:** As a 商品マスタの利用者, I want ブックマークした商品だけを一覧で見る, so that 見返したい商品にすぐたどり着ける

#### Acceptance Criteria
1. The Product Master App shall 一覧画面に「ブックマークのみ表示」の切り替え操作を表示する
2. When フィルタを有効にした, the Product Master App shall ブックマーク ON の商品だけを一覧に表示し、URL クエリに `?bookmarked=1` を反映する
3. When フィルタを無効にした, the Product Master App shall 全商品を表示し、URL クエリから `bookmarked` を外す
4. When `?bookmarked=1` を含む URL でアクセスまたはリロードした, the Product Master App shall フィルタが有効な状態で一覧を表示し、切り替え操作もその状態を示す
5. If `bookmarked` に `1` 以外の値が指定された, then the Product Master App shall フィルタを無効として扱い、エラーにしない
6. While フィルタが有効である, the Product Master App shall 検索条件(`?q=`)と並び順(`?sort=` / `?order=`)をそのまま適用する(3 つの条件は独立に組み合わさる)
7. While フィルタが有効である, when ユーザーが検索を実行または並び替えを切り替えた, the Product Master App shall フィルタを保持する
8. While 検索条件または並び順が指定されている, when ユーザーがフィルタを切り替えた, the Product Master App shall 検索条件と並び順を保持する
9. While フィルタが有効である, when 一覧でブックマークを OFF にした, the Product Master App shall 操作後の一覧からその商品を除く(フィルタに従う)
10. If フィルタが有効で該当する商品が 0 件である, then the Product Master App shall ブックマークした商品がない旨を表示する

### Requirement 4: 視覚表示
**Objective:** As a 商品マスタの利用者, I want どの商品がブックマーク中か一目で分かる, so that 一覧を眺めるだけで印の有無を把握できる

#### Acceptance Criteria
1. While 商品がブックマーク ON である, the Product Master App shall 一覧のその行を、トグルの見た目と行の強調表示の両方で OFF の行と区別する
2. While 商品がブックマーク ON である, the Product Master App shall 詳細画面にブックマーク中である旨を表示する
3. The Product Master App shall トグルの現在の状態(ON / OFF)を支援技術にも伝える

### Requirement 5: 品質
**Objective:** As a 開発者, I want ブックマークの永続化とフィルタの規則が自動テストで守られる, so that 以後の変更で壊れない

#### Acceptance Criteria
1. The Product Master App shall ブックマークの切り替え・永続化(updated_at 不変、不在時の扱い)とフィルタ(検索・並び替えとの併用、URL の解釈と組み立て)に対する自動テストを持つ
2. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
