# Project Structure

## Organization Philosophy

Next.js の規約(App Router)に従うレイヤ構成。ルーティングと画面は `src/app/`、再利用する UI 部品は `src/components/`、DB アクセスやドメインロジックは `src/lib/` に置く。画面から直接 SQL を書かない。

## Directory Patterns

### App Router ルート
**Location**: `src/app/`  
**Purpose**: ページ(`page.tsx`)、レイアウト(`layout.tsx`)、Server Actions(`actions.ts`)を URL 構造どおりに配置する  
**Example**: `src/app/products/page.tsx`、`src/app/products/[id]/page.tsx`

### UI コンポーネント
**Location**: `src/components/`  
**Purpose**: 複数ページで使う、またはクライアント側の状態を持つ部品。ファイル名は kebab-case  
**Example**: `src/components/search-form.tsx`

### ライブラリ / ドメイン
**Location**: `src/lib/`  
**Purpose**: DB 接続、マイグレーション適用、テーブルごとのデータアクセス関数、バリデーション  
**Example**: `src/lib/db.ts`、`src/lib/products.ts`

### マイグレーション
**Location**: `db/migrations/`  
**Purpose**: `NNN_説明.sql` の連番 SQL。追加のみ、既存ファイルは編集しない  
**Example**: `db/migrations/001_create_products.sql`

### データ
**Location**: `data/`  
**Purpose**: SQLite ファイル(`app.db`)。git 管理外

### テスト
**Location**: `tests/`(または対象の隣に `*.test.ts`)  
**Purpose**: Vitest のテスト。機能ごとに最低1つ

## Naming Conventions

- **Files**: kebab-case(`search-form.tsx`、`products.ts`)。App Router の予約名(`page.tsx` など)はそのまま
- **Components**: PascalCase の関数コンポーネント。default export はページのみ、部品は named export
- **Functions**: camelCase。DB アクセス関数は動詞+名詞(`listProducts`、`getProduct`)
- **DB 列**: snake_case(`created_at`)。TypeScript 側も列名をそのまま使う

## Import Organization

```typescript
import { listProducts } from "@/lib/products"; // Absolute(src 配下)
import { SearchForm } from "./search-form";    // Relative(同一ディレクトリ内のみ)
```

**Path Aliases**:
- `@/`: `src/`

## Code Organization Principles

- 依存の向きは `app → components → lib`。`lib` は React に依存しない
- DB アクセスは `lib` に閉じ、`app` の Server Component / Server Action から呼ぶ
- 起動時にマイグレーションとシードを適用する処理は `lib` に1か所にまとめ、複数の入口から重複実行されても安全にする

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
