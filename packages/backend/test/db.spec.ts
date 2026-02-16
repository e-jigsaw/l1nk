import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

describe("Database Interactions", () => {
  const db = drizzle(env.DB);

  beforeAll(async () => {
    // D1のマイグレーションを適用
    await env.DB.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, auth_provider TEXT NOT NULL, auth_provider_id TEXT NOT NULL, name TEXT, display_name TEXT, photo_url TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);');
  });


  it("should be able to insert and fetch a user", async () => {
    const newUser = {
      id: "test-user-id",
      email: "test@example.com",
      authProvider: "google",
      authProviderId: "google-id-123",
      name: "Test User",
      displayName: "Tester",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values(newUser);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, "test-user-id"));

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("test@example.com");
  });
});
