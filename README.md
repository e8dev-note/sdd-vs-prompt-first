# sdd-vs-prompt-first

同一の依頼文・同一のルール・同一の技術スタックで、**prompt-first**(AGENTS.md/CLAUDE.md + 依頼文のみ)と **cc-sdd**(spec-driven development)の2トラックで商品マスタ管理アプリを構築し、初期構築と段階的な機能追加(並び替え、編集モーダル、ブックマーク、認証、認可)の差分を比較する検証リポジトリ。

- 検証の手順と前提: [docs/README.md](docs/README.md)
- 共通の依頼文: [docs/requests/](docs/requests/)
- 計測結果: [docs/metrics.md](docs/metrics.md)
- トラックA prompt-first: [prompt-first/](prompt-first/)
- トラックB cc-sdd: [cc-sdd/](cc-sdd/)(仕様書は [cc-sdd/.kiro/specs/](cc-sdd/.kiro/specs/)、steering は [cc-sdd/.kiro/steering/](cc-sdd/.kiro/steering/))

関連記事(note): [2026年、仕様先行(spec-driven)はどこまで来たか 前編](https://note.com/sysdev_notes/n/na6cb307e46bd) / [後編](https://note.com/sysdev_notes/n/n26593ab541af)
