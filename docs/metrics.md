# 計測表(cc-sdd トラック)

sdd01 の `docs/metrics.md` と同じ定義。取り込み時にマージする。

定義:
- ターン数: 依頼を投げてから完了報告までの、人の発話回数(初回依頼を含む。spec 各フェーズの承認発話を含む)。
- 手戻り: 完了報告後に人が指摘して修正した回数。
- 生成ファイル数/行数: `git show --stat` の数値(node_modules, lock, .next を除く)。
- diff 行数: `git diff --shortstat <前段階タグ> <今段階タグ>`(追加+削除)。`.kiro/` を含む値と除いた値を併記する。
- 仕様ファイル: requirements/design/tasks が今段階で更新されたか。既存 spec や steering に手が入ったかも記す。
- テスト: 追加したテスト数と最終結果。
- 経過時間: フェーズごと(requirements / design / tasks / impl)と合計(分)。

## cc-sdd

| 段階 | ターン数 | 手戻り | 生成/変更ファイル数 | diff 行数(+/-) | 仕様ファイル更新 | テスト(追加/合計/結果) | 経過時間 | 備考 |
|---|---|---|---|---|---|---|---|---|
| step1 initial | | | | | | | | |
| step2 sort | | | | | | | | |
| step3 edit-modal | | | | | | | | |
| step4 bookmark | | | | | | | | |
| step5 auth | | | | | | | | |
| step6 authz | | | | | | | | |

## cc-sdd 所感(セッション内で記録)

