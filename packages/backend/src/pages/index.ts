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

// ページ一覧取得
pagesApp.get('/', async (c) => {
  const db = drizzle(c.env.DB)
  const allPages = await db.select().from(pages).orderBy(desc(pages.updatedAt)).all()
  return c.json(allPages)
})

// ページ詳細取得
pagesApp.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = drizzle(c.env.DB)
  const page = await db.select().from(pages).where(eq(pages.slug, slug)).get()
  
  if (!page) {
    return c.json({ error: 'Page not found' }, 404)
  }
  
  return c.json(page)
})

// ページ作成 (暫定: D1に直接作成)
const createPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
})

pagesApp.post('/', zValidator('json', createPageSchema), async (c) => {
  const { slug, title } = c.req.valid('json')
  const db = drizzle(c.env.DB)
  
  const id = crypto.randomUUID()
  const now = new Date()
  
  try {
    const newPage = {
      id,
      slug,
      title,
      createdAt: now,
      updatedAt: now,
      views: 0
    }
    
    await db.insert(pages).values(newPage).execute()
    return c.json(newPage, 201)
  } catch (e) {
    return c.json({ error: 'Failed to create page', details: String(e) }, 500)
  }
})
