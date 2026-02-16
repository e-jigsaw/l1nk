# l1nk - Open Source Scrapbox Alternative

l1nk は、Scrapbox (Cosense) のような「リンクによる知識のネットワーク構造」を持つ Wiki システムを目指すオープンソースプロジェクト。
Cloudflare のエッジコンピューティングスタックをフル活用し、高速でスケーラブルな基盤の上に、リアルタイム共同編集機能（Yjs）を備えたモダンな Wiki を構築している。

## プロジェクト構成

このプロジェクトは `pnpm` を使用したモノレポ構成。

- `packages/frontend`: Vite + React + Tailwind CSS によるフロントエンドアプリケーション。
- `packages/backend`: Hono + Cloudflare Workers による API バックエンド。D1, KV, Durable Objects を利用。
- `docs/current/`: アーキテクチャ、仕様、認証フロー、開発規約などの現状のドキュメント。
- `docs/plan/`: 今後のロードマップや開発プラン。

## 技術スタック

- **ランタイム/インフラ**: [Cloudflare Workers](https://workers.cloudflare.com/), [Pages](https://pages.cloudflare.com/)
- **バックエンドフレームワーク**: [Hono](https://hono.dev/)
- **フロントエンドフレームワーク**: [React](https://react.dev/), [Vite](https://vitejs.dev/)
- **データベース**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **認証**: [Arctic](https://arcticjs.dev/) (OAuth 2.0)
- **リアルタイム同期**: [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/) + [Yjs](https://yjs.dev/)
- **ストレージ**: [Cloudflare KV](https://developers.cloudflare.com/kv/) (セッション管理), [Cloudflare R2](https://developers.cloudflare.com/r2/) (アセット)
- **ツール管理**: [mise](https://mise.jdx.dev/)

## 開発の始め方

### 前提条件

- `mise` がインストールされていること。
- Cloudflare アカウントがあり、`wrangler` でログインしていること。

### セットアップ

```bash
# ツールのインストール (Node.js 等)
mise install

# 依存関係のインストール
pnpm install
```

### 開発コマンド

**バックエンド (packages/backend)**

- `pnpm --filter backend dev`: ローカル開発サーバー (wrangler) の起動。
- `pnpm --filter backend deploy`: Cloudflare Workers へのデプロイ。
- `pnpm --filter backend cf-typegen`: Cloudflare Bindings の型定義生成。

**フロントエンド (packages/frontend)**

- `pnpm --filter frontend dev`: Vite 開発サーバーの起動。
- `pnpm --filter frontend build`: ビルドの実行。

## データベース開発 (Drizzle)

`packages/backend` ディレクトリで実行：

- `npx drizzle-kit generate`: スキーマ変更からマイグレーションファイルを生成。
- `npx drizzle-kit migrate`: ローカル/リモート D1 へのマイグレーション適用（詳細は `wrangler d1 migrations` 参照）。

## 開発規約・設計方針

- **コメント**: コードコメントは最小限に留める。自明な処理には書かず、複雑なロジックや特定の設計判断（なぜそうしたか）が必要な箇所にのみ記述する。
- **エッジファースト**: Cloudflare Workers の制限（Node.js API の一部が使えない等）を考慮し、Web Standard API を優先的に使用する。
- **データ同期**:
  - **Source of Truth**: ページの内容は Durable Objects 内の Yjs ドキュメントが正。
  - **検索・リンク用**: Durable Objects から D1 にデータが非同期（Debounced）で同期され、一覧表示や 2-hop link の計算に使用される。
- **認証**:
  - Google / GitHub OAuth を使用。
  - セッション ID を KV に保存し、HttpOnly Cookie で管理する。
- **ディレクトリ構成**:
  - `packages/backend/src/db/schema.ts` に Drizzle のスキーマ定義。
  - `packages/backend/src/auth/` に認証ロジック。
  - `packages/backend/src/pages/` に Wiki ページの API ロジック。
