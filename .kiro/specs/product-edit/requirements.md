# Requirements Document

## Project Description (Input)
商品の編集機能を追加してください。編集はモーダルで行います。

- 詳細画面に「編集」ボタンを置き、押すとモーダルが開く。
- モーダル内で name, category, price, note を編集できる。code は変更不可(表示のみ)。
- バリデーション: name, category は必須、price は 0 以上の整数。エラーはモーダル内のフィールド近くに表示する。
- 保存に成功したらモーダルを閉じ、詳細画面の表示を更新する。updated_at も更新する。
- キャンセルで変更を破棄して閉じる。

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->
