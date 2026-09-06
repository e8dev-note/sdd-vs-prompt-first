# Product Overview

商品マスタ管理(System of Record)の Web アプリ。ローカルで単独動作する最小構成で、商品(products)の参照・管理を行う。

## Core Capabilities

- 商品マスタの一覧・検索・詳細表示・更新・削除(段階的に機能を追加する)
- SQLite(`data/app.db`)への永続化と、SQL マイグレーションによるスキーマ管理
- 各機能に対する自動テスト(`npm test`)による回帰防止

## Target Use Cases

- ローカル単一ユーザーが商品マスタを閲覧・保守する
- 依頼文(`docs/requests/NN-*.md`)単位で機能を段階的に追加し、各段階で `build` / `lint` / `test` が通る状態を保つ

## Value Proposition

- 外部サービスに依存せず、リポジトリを clone して `npm run dev` で動く
- 商品データの列定義(`rules.md` 参照)を唯一の真実とし、画面・DB・テストがそれに従う

---
_Focus on patterns and purpose, not exhaustive feature lists_
