import { DurableObject } from "cloudflare:workers";
import * as Y from "yjs";
import { drizzle } from "drizzle-orm/d1";
import { pages } from "../db/schema";
import { eq } from "drizzle-orm";
import { extractTextFromYDoc } from "../lib/parser";

type Bindings = {
  DB: D1Database;
};

export class PageObject extends DurableObject {
  private ydoc: Y.Doc;
  private sessions: Set<WebSocket>;
  private env: Bindings;
  private pageId: string | null = null;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    this.ydoc = new Y.Doc();
    this.sessions = new Set();
    this.env = env;

    this.ctx.blockConcurrencyWhile(async () => {
      const saved = await this.ctx.storage.get<Uint8Array>("ydoc");
      if (saved) Y.applyUpdate(this.ydoc, saved);
      const storedId = await this.ctx.storage.get<string>("pageId");
      if (storedId) this.pageId = storedId;
    });

    this.ydoc.on("update", () => {
      const state = Y.encodeStateAsUpdate(this.ydoc);
      this.ctx.storage.put("ydoc", state);
      // 通常の遅延同期
      this.ctx.storage.setAlarm(Date.now() + 60000);
    });
  }

  // 強制同期メソッド
  async syncToD1() {
    if (!this.pageId) return;
    const db = drizzle(this.env.DB);
    const title = this.extractTitle();
    if (!title || title === "Untitled") return;

    let slug = title.toLowerCase().replace(/\s+/g, '-');
    if (slug === 'new') slug = 'new-page';

    try {
      await db
        .update(pages)
        .set({ title, slug, updatedAt: new Date() })
        .where(eq(pages.id, this.pageId))
        .execute();
      console.log(`Synced D1 for ${this.pageId}: ${title}`);
    } catch (e) {
      console.error(`Failed to sync to D1`, e);
    }
  }

  async alarm() {
    await this.syncToD1();
  }

  private extractTitle(): string {
    const text = extractTextFromYDoc(this.ydoc);
    const firstLine = text.trim().split(/[\n\r]+/)[0] || "";
    return firstLine.substring(0, 100).trim();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const idFromUrl = url.pathname.split("/").pop();
    if (idFromUrl && !this.pageId) {
      this.pageId = idFromUrl;
      this.ctx.storage.put("pageId", idFromUrl);
    }

    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleSession(ws: WebSocket) {
    (ws as any).accept();
    this.sessions.add(ws);
    const initialUpdate = Y.encodeStateAsUpdate(this.ydoc);
    ws.send(initialUpdate);

    ws.addEventListener("message", async (msg) => {
      // JSON メッセージ（制御用）かバイナリ（Yjs）かを判定
      if (typeof msg.data === "string") {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "SYNC") {
            await this.syncToD1();
            ws.send(JSON.stringify({ type: "SYNC_COMPLETE" }));
          }
        } catch (e) {}
        return;
      }

      try {
        const update = new Uint8Array(msg.data as ArrayBuffer);
        Y.applyUpdate(this.ydoc, update);
        for (const session of this.sessions) {
          if (session !== ws) session.send(update);
        }
      } catch (e) {
        console.error("Failed to process Yjs update", e);
      }
    });

    ws.addEventListener("close", () => {
      this.sessions.delete(ws);
    });
  }
}
