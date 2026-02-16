# l1nk - Open Source Scrapbox Alternative Specification

## 1. 概要 (Overview)

Scrapbox (Cosense) のような、ページ間のリンクによるネットワーク構造を持つWikiシステム。
階層構造を持たず、リンクを通じて情報をつなげることで知識を管理する。

## 2. コア機能 (Core Features)

### 2.1 記法とリンク (Syntax & Linking)

- **ブラケットリンク (Bracket Link)**: `[Page Name]` でページ間リンクを作成。
  - リンク先が存在しない場合はNew Pageとして扱い、クリックで作成。
- **外部リンク**: `[URL Title]` または `[URL]` 形式。
- **画像埋め込み**: 画像URLをそのまま貼るとプレビュー表示。`[URL]` で画像表示。
- **ハッシュタグ**: `#Tag` は `[Tag]` と同等に扱う。

### 2.2 構造 (Structure)

- **フラット構造**: フォルダによる階層化を行わない。
- **2-hop Link**: ページ下部に、そのページへのリンクを持つ他のページや、共通のリンクを持つページを表示する（関連ページの可視化）。

### 2.3 編集体験 (Editing Experience)

- **リアルタイム共同編集**: 複数人での同時編集（WebSocket等を利用）。
- **自動保存**: 保存ボタンなし。入力と同時に保存される。

## 3. 技術スタック (Technical Stack)
- **Infrastructure**: Cloudflare (Workers, Pages, D1, R2, KV)
- **Frontend**: React (Vite)
- **Backend**: Hono (Cloudflare Workers)
- **Real-time**: Cloudflare Durable Objects + Yjs (CRDT)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (for images/assets)
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Tool Manager**: mise

## 4. 今後のステップ (Next Steps)

1. 技術スタックの決定
2. 最小構成（MVP）の実装
   - ページの作成・表示
   - `[]` リンクの機能
