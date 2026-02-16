# l1nk Architecture & Schema Design

## System Architecture (Cloudflare)
- **Frontend Application**: Cloudflare Pages (Hosting Vite + React build artifacts)
- **Backend API**: Cloudflare Workers (Hono)
- **Database**: Cloudflare D1 (SQLite)
- **Real-time Sync**: Cloudflare Durable Objects (WebSocket + Yjs)
- **Asset Storage**: Cloudflare R2 (User uploaded images)

## Development Tools
- **Package Manager**: [pnpm](https://pnpm.io/) (Monorepo with pnpm workspace)
- **Tool Manager**: [mise](https://mise.jdx.dev/) (Node.js runtime and CLI tools management)

### Setup
本プロジェクトでは `mise` を使用して開発ツールを管理している。
ディレクトリに入った際に自動的に環境を有効化するには、シェルに合わせて `eval "$(mise activate bash)"` (または zsh, fish) を実行すること。

```bash
# ツール（Node.js等）のインストール
mise install

# 依存関係のインストール
pnpm install
```

## Authentication

### Strategy

シンプルかつセルフホストしやすい構成として、Honoを使ったOAuth2認証（Google / GitHub）を採用する。
セッション管理にはCloudflare KVを使用し、高速な認証チェックを実現する。

### Auth Flow

1. **Login**: ユーザーが `/api/auth/login/google` 等にアクセス -> プロバイダの認証画面へリダイレクト。
2. **Callback**: プロバイダから `/api/auth/callback/google` に戻る。
   - バックエンドでアクセストークン取得 -> ユーザー情報取得。
   - `Users` テーブルに存在すれば更新、なければ作成。
   - ランダムな `sessionId` を生成。
   - Cloudflare KV に `sessionId` -> `userId` のペアを保存（TTL設定あり、例: 30日）。
   - クライアントに `sessionId` を `HttpOnly, Secure, SameSite=Lax` なCookieとしてセット。
3. **Protection**: 保護されたAPI/WebSocket接続時に、Cookieの `sessionId` を検証。
   - ミドルウェアでKVをチェックし、有効なら `c.set('user', user)` して後続処理へ。

### API Endpoints

- `GET /api/auth/login/:provider`: OAuth開始。
- `GET /api/auth/callback/:provider`: OAuthコールバック処理。
- `GET /api/auth/me`: 現在のログインユーザー情報を返す。
- `POST /api/auth/logout`: ログアウト（Cookie削除 & KV削除）。

## Database Schema (D1 - SQLite)

Scrapboxライクな行指向データを管理する。
基本データ（Source of Truth）はDurable Objects内のYjsドキュメントになるが、一覧表示・検索・2-hop Link計算のためにD1にもデータを同期する。

### 1. Users

ユーザー管理。

- `id`: TEXT (UUID) PK
- `email`: TEXT UNIQUE (認証用)
- `authProvider`: TEXT (e.g., 'google', 'github')
- `authProviderId`: TEXT (プロバイダ側のID)
- `name`: TEXT
- `displayName`: TEXT
- `photoUrl`: TEXT
- `createdAt`: INTEGER
- `updatedAt`: INTEGER

### 2. Pages

Wikiページメタデータ。

- `id`: TEXT (UUID) PK
- `project`: TEXT (将来的なマルチプロジェクト対応)
- `slug`: TEXT (URL-safe page title)
- `title`: TEXT
- `imageUrl`: TEXT (Thumbnail)
- `createdAt`: INTEGER
- `updatedAt`: INTEGER
- `views`: INTEGER

### 3. PageSnapshots (Optional but recommended)

ページのテキスト内容の検索用キャッシュ。

- `pageId`: TEXT (FK)
- `linesJson`: TEXT (JSON array of lines text) - 全文検索用

### 4. Links

2-hop link計算用のリンクグラフ。ページ更新時にDurable ObjectからD1へ同期。

- `id`: INTEGER PK AUTOINCREMENT
- `sourcePageId`: TEXT (FK -> Pages.id)
- `targetPageSlug`: TEXT (リンク先はまだ存在しないページもあり得るためSlugで管理)
- `createdAt`: INTEGER

## Real-time Synchronization (Durable Objects)

### Sync Strategy

1. **Source of Truth**: 各ページの状態は対応するDurable Object (DO) 内のYjs Docが正。
2. **WebSocket**: クライアントは `ws://host/api/page/:slug` に接続し、DOとYjsプロトコルで通信。
3. **Data Persistence**:
   - DOは `storage.put` でYjsのUpdate（バイナリ）を保存。
   - **Debounced Sync**: DOは変更を受け取った後、一定時間（例: 数秒）操作がない場合、現在のテキスト解析結果とリンク情報をD1 (`Pages`, `Links` テーブル) に書き出す。これにより、一覧画面の更新と2-hop linkの計算が可能になる。

## API Endpoints (Hono)

### REST API

- `GET /api/pages`: ページ一覧取得 (D1から)。作成日時や更新日時でソート。
- `GET /api/pages/:slug`: ページ詳細メタデータ取得。
- `GET /api/search?q=...`: 全文検索 (D1の `PageSnapshots` or `Lines` を検索)。
- `POST /api/upload`: 画像アップロード (R2へPresigned URL発行または直接アップロード)。

### WebSocket

- `GET /api/ws/pages/:id`: WebSocket Upgrade Request -> Durable Object

## 2-hop Link Algorithm

Scrapboxの特徴である関連ページ表示ロジック。
あるページ `Page A` を表示している時：

1. **Direct Links**: `Links` テーブルから `sourcePageId = A.id` を検索 -> `targetPageSlug` のリストを得る (Outgoing)。
2. **Back Links**: `Links` テーブルから `targetPageSlug = A.slug` を検索 -> `sourcePageId` のリストを得る (Incoming)。
3. **2-hop**: Direct Linksで得た `Page B` に対して、さらに `targetPageSlug = B.slug` となる `Page C` を探す。
   - これをSQL一発、あるいはD1への数回のクエリで解決する。
