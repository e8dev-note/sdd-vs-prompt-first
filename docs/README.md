# prompt-first vs cc-sdd 比較検証

同一の依頼文・同一のルール・同一のスタックで、prompt-first と cc-sdd の2トラックを別セッションで実施し、差分を比較する。

## ディレクトリ

- `docs/requests/` … 両トラック共通の依頼文。**改変せずにそのまま貼る**。
- `docs/CLAUDE.md.template` … 常時コンテキストのルールファイル。prompt-first では `CLAUDE.md`、cc-sdd では steering に同内容を入れる。
- `docs/metrics.md` … 段階ごとの計測表。両トラックで同じ表を埋める。
- `prompt-first/` … トラックA。段階ごとにコミットし、`prompt-first-stepN` タグを打つ。
- `cc-sdd/` … トラックB。別セッションで作成し subtree で取り込んだ。`cc-sdd-stepN` タグは取り込み前のコミット(ファイルがルート直下)を指す。仕様書は `cc-sdd/.kiro/specs/`、steering は `cc-sdd/.kiro/steering/`。

リポジトリはこのルート1つ(モノレポ)。prompt-first の step0〜step4 は subtree 取り込み前のコミット(ファイルがルート直下)を指し、step5 以降は `prompt-first/` 配下を指す。段階間の差分は次のように取る。

```bash
# step4 まで(どちらもルート直下)
git diff --stat prompt-first-step1 prompt-first-step2
# step4 → step5 以降(取り込み前後をまたぐ場合はサブツリーを指定)
git diff --stat prompt-first-step4 prompt-first-step5:prompt-first
# step5 以降同士
git diff --stat prompt-first-step5 prompt-first-step6 -- prompt-first

# cc-sdd は全段階が取り込み前(ルート直下)。仕様書を除くなら .kiro を外す
git diff --shortstat cc-sdd-step1 cc-sdd-step2 -- . ':!package-lock.json' ':!docs'
git diff --shortstat cc-sdd-step1 cc-sdd-step2 -- . ':!package-lock.json' ':!docs' ':!.kiro'
```

## 手順(各トラック共通)

1. `00-common.md` の内容がルールファイルに反映されていることを確認する。
2. `01-initial.md` を依頼 → 動作確認 → コミット `step1: initial`。
3. `02-sort.md` → コミット `step2: sort`。
4. `03-edit-modal.md` → コミット `step3: edit-modal`。
5. `04-bookmark.md` → コミット `step4: bookmark`。
6. `05-auth.md` → コミット `step5: auth`。**この段階でルールファイルの「認証なし」を改訂する**(改訂内容は `CLAUDE.md.template` 参照)。
7. `06-authz.md` → コミット `step6: authz`。
6. 各段階の直後に `docs/metrics.md` の該当行を埋める。

## トラック固有の手順

- **prompt-first**: `CLAUDE.md` を置き、依頼文をそのままプロンプトとして渡す。仕様書は書かない。
- **cc-sdd**: `npx cc-sdd@latest` でインストール後、steering → `/kiro:spec-init`(依頼文をそのまま入力) → requirements → design → tasks → impl の順に進める。各段階の承認は人が行う。

## 注意

両トラックとも同じモデル(Claude)が実装する。差はプロセスの差であり、モデルの差ではない。

## 進捗

- prompt-first: 2026-09-06 に step0〜step4 完了(`prompt-first/`、タグ `prompt-first-step0`〜`step4`)。
- cc-sdd: 2026-09-06〜07 に step0〜step6 完了(`cc-sdd/`、タグ `cc-sdd-step0`〜`step6`)。計測は `docs/metrics.md` の cc-sdd 表。
- 記事下書きは `docs/article/` に置く(git 管理外)。
