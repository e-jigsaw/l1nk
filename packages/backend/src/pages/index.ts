import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { pages } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

type Bindings = {
  DB: D1Database
}

export const pagesApp = new Hono<{ Bindings: Bindings }>()

// ページ一覧取得 (最新の更新順)
pagesApp.get('/', async (c) => {
  const db = drizzle(c.env.DB)
  try {
    const allPages = await db
      .select()
      .from(pages)
      .orderBy(desc(pages.updatedAt))
      .limit(50)
      .all()
    return c.json(allPages)
  } catch (e) {
    return c.json({ error: 'Failed to fetch pages', details: String(e) }, 500)
  }
})

// ページ詳細取得 (スラグ指定)
pagesApp.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = drizzle(c.env.DB)
  try {
    const page = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .get()
    
    if (!page) {
      return c.json({ error: 'Page not found' }, 404)
    }
    
    return c.json(page)
  } catch (e) {
    return c.json({ error: 'Database error', details: String(e) }, 500)
  }
})

// ページの作成またはタイトル更新 (Upsert)
const savePageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
})

pagesApp.post('/', zValidator('json', savePageSchema), async (c) => {
  const { slug, title } = c.req.valid('json')
  const db = drizzle(c.env.DB)
  const now = new Date()

  try {
    // 既存のページがあるか確認
    const existing = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .get()

    if (existing) {
      // 更新
      const updated = await db
        .update(pages)
        .set({ title, updatedAt: now })
        .where(eq(pages.id, existing.id))
        .returning()
        .get()
      return c.json(updated)
    } else {
      // 新規作成
      const id = crypto.randomUUID()
      const inserted = await db
        .insert(pages)
        .values({
          id,
          slug,
          title,
          createdAt: now,
          updatedAt: now,
          views: 0
        })
        .returning()
        .get()
      return c.json(inserted, 201)
    }
  } catch (e) {
    return c.json({ error: 'Failed to save page', details: String(e) }, 500)
  }
})