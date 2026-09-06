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

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->
