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

pagesApp.get('/', async (c) => {
  const db = drizzle(c.env.DB)
  try {
    const allPages = await db.select().from(pages).orderBy(desc(pages.updatedAt)).limit(50).all()
    return c.json(allPages)
  } catch (e) {
    return c.json({ error: 'Failed to fetch pages' }, 500)
  }
})

pagesApp.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = drizzle(c.env.DB)
  try {
    const page = await db.select().from(pages).where(eq(pages.slug, slug)).get()
    if (!page) return c.json({ error: 'Page not found' }, 404)
    return c.json(page)
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

pagesApp.get('/id/:id', async (c) => {
  const id = c.req.param('id')
  const db = drizzle(c.env.DB)
  try {
    const page = await db.select().from(pages).where(eq(pages.id, id)).get()
    if (!page) return c.json({ error: 'Page not found' }, 404)
    return c.json(page)
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// 新規ページ作成 (空の POST で OK)
pagesApp.post('/', async (c) => {
  const db = drizzle(c.env.DB)
  const id = crypto.randomUUID()
  const now = new Date()
  
  try {
    const inserted = await db
      .insert(pages)
      .values({
        id,
        slug: id, // 最初は ID をそのままスラグにする
        title: 'Untitled',
        createdAt: now,
        updatedAt: now,
        views: 0
      })
      .returning()
      .get()
    return c.json(inserted, 201)
  } catch (e) {
    return c.json({ error: 'Failed to create page' }, 500)
  }
})
