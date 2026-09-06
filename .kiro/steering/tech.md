# Technology Stack

## Architecture

Next.js App Router のモノリス。Server Components / Server Actions でサーバ側処理を行い、DB はプロセス内の SQLite(better-sqlite3、同期 API)に直接アクセスする。API サーバや ORM は置かない。

## Core Technologies

- **Language**: TypeScript(`strict: true`)
- **Framework**: Next.js 16.3(App Router、React 19.2)
- **Runtime**: Node.js 20 以上(`@types/node` は 20 系)
- **Package manager**: npm

## Key Libraries

- **better-sqlite3**: DB アクセス。同期 API なので Server Component / Server Action から直接呼ぶ
- **Tailwind CSS 4**: スタイリング(`@tailwindcss/postcss` 経由、create-next-app 既定構成)
- **Vitest 4**: テストランナー

上記以外の ORM・DB・UI ライブラリ・認証ライブラリは追加しない(`rules.md`)。

## Development Standards

### Type Safety
- `tsconfig.json` は `strict: true`。`any` を避け、DB 行は型を定義して受ける

### Code Quality
- ESLint(`eslint-config-next` の core-web-vitals + typescript)。`npm run lint` を警告なしで通す

### Testing
- Vitest。各機能に最低1つのユニットテストまたは結合テストを書く
- DB を使うテストは本番の `data/app.db` を汚さない(テスト用 DB を使う)

## Development Environment

### Required Tools
- Node.js 20+、npm

### Common Commands
```bash
npm run dev    # 開発サーバ
npm run build  # 本番ビルド(完了条件)
npm run lint   # ESLint(完了条件)
npm test       # Vitest(完了条件)
```

## Key Technical Decisions

- **SQLite ファイルは `data/app.db` 固定**: ローカル単一ユーザー前提のため。DB ファイルは git 管理しない
- **スキーマは `db/migrations/NNN_*.sql` で管理し、起動時に未適用分を順に適用する**: 既存のマイグレーションファイルは編集せず、変更は新しい番号のファイルを追加する
- **認証なし・外部通信なし**: 現時点の運用ルール(`rules.md`)。依頼があるまで追加しない
- **完了条件**: `npm run build`、`npm run lint`、`npm test` が全て通ること

---
_Document standards and patterns, not every dependency_
