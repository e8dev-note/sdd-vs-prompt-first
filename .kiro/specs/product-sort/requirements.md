# Requirements Document

## Project Description (Input)
商品一覧に並び替えを追加してください。

- 列ヘッダ(code, name, category, price)をクリックすると、その列で昇順/降順を切り替えて並び替える。
- 現在のソート列と方向はヘッダ上で視覚的に分かるようにする。
- ソート状態は URL クエリ(?sort=price&order=desc)に反映し、検索条件(?q=)と併用できる。
- 既定は code の昇順。

## Introduction
既存の商品一覧(`/products`、spec `product-master`)に列ヘッダによる並び替えを追加する。並び替えの状態は URL クエリで表現し、既存のキーワード検索(`?q=`)と独立に組み合わせられる。ローカル単一ユーザー・認証なしの前提(steering `rules.md`)は変わらない。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: 一覧画面の列ヘッダによる並び替え、ソート状態の URL 反映と検索との併用、既定順の維持、ソート状態の視覚表示
- **Out of scope**: 詳細画面、削除、検索の仕様変更(`product-master` が所有)。複数列ソート、ページング、並び順の保存
- **Adjacent expectations**: `product-master` の一覧取得(code 昇順固定)を、列と方向を指定できる形に拡張する。指定がない場合の結果は現行(code 昇順)と同一であること。検索フォームと詳細への導線は現行どおり動作すること

## Requirements

### Requirement 1: 列ヘッダによる並び替え
**Objective:** As a 商品マスタの利用者, I want 一覧の列ヘッダをクリックして並び替える, so that 目的の順序で商品を見比べられる

#### Acceptance Criteria
1. The Product Master App shall 一覧の列ヘッダ code, name, category, price のそれぞれを、クリックで並び替えを切り替えられる操作要素にする
2. When ユーザーが現在ソートされていない列のヘッダをクリックした, the Product Master App shall その列の昇順で一覧を表示する
3. When ユーザーが現在ソート中の列のヘッダをクリックした, the Product Master App shall 同じ列で方向を反転(昇順⇄降順)して一覧を表示する
4. The Product Master App shall price を数値の大小で、code / name / category を文字列として並べる
5. If 並び替えの対象値が同じ商品が複数ある, then the Product Master App shall それらを id の昇順で並べ、同じ条件では常に同じ順序を返す
6. The Product Master App shall 並び替えの操作を JavaScript が無効なブラウザでも行えるようにする

### Requirement 2: ソート状態の視覚表示
**Objective:** As a 商品マスタの利用者, I want 今どの列がどちら向きに並んでいるか分かる, so that 表を読み違えない

#### Acceptance Criteria
1. While いずれかの列で並び替えが有効である, the Product Master App shall 該当する列ヘッダに方向(昇順/降順)を示す印を表示する
2. The Product Master App shall ソート中でない列ヘッダには方向の印を表示しない
3. The Product Master App shall ソート中の列と方向を支援技術にも伝える(列ヘッダの並び順属性)

### Requirement 3: URL への反映と検索との併用
**Objective:** As a 商品マスタの利用者, I want 並び替えの状態が URL に残る, so that リロードや共有で同じ表示を再現できる

#### Acceptance Criteria
1. When 並び替えが切り替えられた, the Product Master App shall ソート列を `?sort=` に、方向を `?order=`(`asc` または `desc`)に反映する
2. When `?sort=` と `?order=` を含む URL でアクセスまたはリロードした, the Product Master App shall そのソート状態で一覧を表示する
3. While 検索条件 `?q=` が指定されている, when 並び替えが切り替えられた, the Product Master App shall `?q=` を保持したまま並び替える
4. While 並び替えが指定されている, when ユーザーが検索を実行した, the Product Master App shall ソート状態を保持したまま検索結果を表示する
5. If `?sort=` に code, name, category, price 以外の値が指定された, then the Product Master App shall 既定(code の昇順)で表示し、エラーにしない
6. If `?order=` に `asc`, `desc` 以外の値が指定された, then the Product Master App shall 昇順として扱い、エラーにしない
7. If `?sort=` が指定され `?order=` が省略された, then the Product Master App shall その列の昇順で表示する

### Requirement 4: 既定の並び順
**Objective:** As a 商品マスタの利用者, I want 何も指定しなければ従来どおりの順序で表示される, so that 既存の使い方が変わらない

#### Acceptance Criteria
1. If URL に `?sort=` が指定されていない, then the Product Master App shall code の昇順で一覧を表示する
2. The Product Master App shall 既定の並び順のとき、code ヘッダに昇順の印を表示する
3. The Product Master App shall 既存の一覧・検索・詳細への導線の動作を変えない

### Requirement 5: 品質
**Objective:** As a 開発者, I want 並び替えの規則が自動テストで守られる, so that 以後の変更で壊れない

#### Acceptance Criteria
1. The Product Master App shall 並び替え(列ごとの昇順・降順、同値時の順序、不正値のフォールバック)に対する自動テストを持つ
2. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
