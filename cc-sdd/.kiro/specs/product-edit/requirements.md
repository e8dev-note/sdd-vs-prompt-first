# Requirements Document

## Project Description (Input)
商品の編集機能を追加してください。編集はモーダルで行います。

- 詳細画面に「編集」ボタンを置き、押すとモーダルが開く。
- モーダル内で name, category, price, note を編集できる。code は変更不可(表示のみ)。
- バリデーション: name, category は必須、price は 0 以上の整数。エラーはモーダル内のフィールド近くに表示する。
- 保存に成功したらモーダルを閉じ、詳細画面の表示を更新する。updated_at も更新する。
- キャンセルで変更を破棄して閉じる。

## Introduction
既存の商品詳細画面(`/products/[id]`、spec `product-master`)に、モーダルで商品を編集する機能を追加する。編集対象は name, category, price, note の 4 項目で、code と id、created_at は変更しない。入力の検証はモーダル内でフィールドごとに表示し、保存が成功すれば詳細画面の表示が更新される。ローカル単一ユーザー・認証なしの前提(steering `rules.md`)は変わらない。

以下、EARS の主語 "Product Master App" は本アプリ全体を指す。

## Boundary Context
- **In scope**: 詳細画面の編集ボタンと編集モーダル、4 項目の入力検証と保存、保存後の詳細表示更新、キャンセル
- **Out of scope**: 商品の新規登録、code の変更、一覧画面での編集、削除・検索・並び替えの変更(`product-master` / `product-sort` が所有)、編集履歴
- **Adjacent expectations**: `product-master` の商品データアクセスに「更新」を追加する。列定義と制約(code 一意、price は 0 以上の整数、note 任意、updated_at は ISO8601)は steering `rules.md` に従う。詳細画面の既存要素(全列表示、一覧へ戻る、削除)は現行どおり動作すること

## Requirements

### Requirement 1: 編集モーダルの表示
**Objective:** As a 商品マスタの利用者, I want 詳細画面から編集画面を開く, so that 画面を移動せずに商品を修正できる

#### Acceptance Criteria
1. The Product Master App shall 詳細画面に「編集」ボタンを表示する
2. When ユーザーが「編集」ボタンを押した, the Product Master App shall 同じ画面上にモーダルを開く
3. When モーダルが開いた, the Product Master App shall name, category, price, note の入力欄にその商品の現在の値を初期表示する
4. The Product Master App shall モーダル内で code を変更不可の表示のみとして示す
5. While モーダルが開いている, the Product Master App shall 背後の詳細画面を操作できないようにする
6. When モーダルが開いた, the Product Master App shall 最初の入力欄にキーボードフォーカスを移す

### Requirement 2: 入力の検証
**Objective:** As a 商品マスタの利用者, I want 誤った入力をその場で指摘してもらう, so that 不正なデータを保存せずに済む

#### Acceptance Criteria
1. If name が空(前後の空白を除いて空)である, then the Product Master App shall name の入力欄の近くに必須である旨のエラーを表示し保存しない
2. If category が空(前後の空白を除いて空)である, then the Product Master App shall category の入力欄の近くに必須である旨のエラーを表示し保存しない
3. If price が空、整数以外(小数・文字列)、または負の値である, then the Product Master App shall price の入力欄の近くに「0 以上の整数」である旨のエラーを表示し保存しない
4. If 複数の項目にエラーがある, then the Product Master App shall 該当する全ての項目にエラーを同時に表示する
5. While エラーが表示されている, the Product Master App shall ユーザーが入力した値を消さずに保持し、モーダルを開いたままにする
6. The Product Master App shall 検証をサーバ側で行い、画面側の補助的な検証の有無にかかわらず不正な値を保存しない
7. The Product Master App shall note を任意項目とし、空の場合は未設定として扱う

### Requirement 3: 保存
**Objective:** As a 商品マスタの利用者, I want 修正内容を保存して結果をすぐ確認する, so that 変更が反映されたことが分かる

#### Acceptance Criteria
1. When ユーザーが保存を実行し検証に通った, the Product Master App shall name, category, price, note を永続ストアに保存し、updated_at を保存時刻(ISO8601 UTC)に更新する
2. When 保存が成功した, the Product Master App shall モーダルを閉じ、詳細画面にページ全体の再読み込みなしで新しい値と updated_at を表示する
3. The Product Master App shall 保存時に name, category の前後の空白を除いて保存する
4. The Product Master App shall 保存時に id, code, created_at を変更しない
5. If 保存対象の商品がすでに存在しない, then the Product Master App shall 保存せず、見つからない旨をユーザーに示す
6. While 保存処理中である, the Product Master App shall 保存ボタンを無効化し二重送信を防ぐ
7. When 保存が成功した, the Product Master App shall 以後の一覧・検索・並び替えで新しい値を用いる

### Requirement 4: キャンセル
**Objective:** As a 商品マスタの利用者, I want 途中でやめても元の値が残る, so that 誤操作でデータを壊さない

#### Acceptance Criteria
1. When ユーザーがキャンセルを押した, the Product Master App shall 入力内容を保存せずモーダルを閉じる
2. When ユーザーが Esc キーを押した, the Product Master App shall キャンセルと同じ動作をする
3. When キャンセル後に再度モーダルを開いた, the Product Master App shall 保存済みの値(破棄した入力ではなく)を初期表示する
4. When キャンセルした, the Product Master App shall 詳細画面の表示と updated_at を変更しない

### Requirement 5: 品質
**Objective:** As a 開発者, I want 検証と更新の規則が自動テストで守られる, so that 以後の変更で壊れない

#### Acceptance Criteria
1. The Product Master App shall 入力検証(必須、整数、負数、空白の扱い、note の空)と更新(値と updated_at の更新、不変列、不在商品)に対する自動テストを持つ
2. The Product Master App shall `npm run build`、`npm run lint`、`npm test` を全てエラーなく通過する
