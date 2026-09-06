# 商品マスタ管理

ローカルで動く最小の商品マスタ管理アプリ(Next.js + SQLite)。

## 起動手順

```bash
npm install
npm run dev
```

http://localhost:3000 を開くと `/products` にリダイレクトします。

初回起動時に `data/app.db` が作成され、`db/migrations/` のマイグレーションが適用された後、商品が空なら 20 件のシードが投入されます。

## 機能

- 商品一覧 `/products` … code, name, category, price を表形式で表示
- キーワード検索 … 検索ボックスの文字列で code / name / category を部分一致検索。条件は `?q=` に反映される
- 商品詳細 `/products/[id]` … 全列を表示。存在しない id は 404
- 削除 … 詳細画面の「削除」ボタン。確認ダイアログの後に削除し、一覧へ戻る

## 検証コマンド

```bash
npm run lint
npm test
npm run build
```

## DB をリセットする

```bash
rm -f data/app.db data/app.db-wal data/app.db-shm
```

次回起動時に再作成・再シードされます。
