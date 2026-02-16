import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { pages } from "../src/db/schema";

describe("Pages API", () => {
  const db = drizzle(env.DB);

  beforeAll(async () => {
    // DB初期化 (1行SQL)
    await env.DB.exec('CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, slug TEXT NOT NULL, title TEXT NOT NULL, image_url TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, views INTEGER DEFAULT 0 NOT NULL);');
  });

  it("CRUD flow", async () => {
    // 1. Create
    const payload = {
      slug: "hello-world",
      title: "Hello World",
    };
    const resPost = await SELF.fetch("http://example.com/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(resPost.status).toBe(201);

    // 2. Get
    const resGet = await SELF.fetch("http://example.com/api/pages/hello-world");
    expect(resGet.status).toBe(200);
    const dataGet = (await resGet.json()) as any;
    expect(dataGet.slug).toBe("hello-world");

    // 3. List
    const resList = await SELF.fetch("http://example.com/api/pages");
    expect(resList.status).toBe(200);
    const dataList = (await resList.json()) as any[];
    expect(dataList.length).toBeGreaterThanOrEqual(1);
  });
});
