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

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->
