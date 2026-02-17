import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const authMiddleware = createMiddleware<{
  Bindings: {
    DB: D1Database
    SESSIONS: KVNamespace
  }
  Variables: {
    user: any
  }
}>(async (c, next) => {
  const sessionId = getCookie(c, "l1nk_session")
  if (!sessionId) {
    return await next()
  }

  const userId = await c.env.SESSIONS.get(`session:${sessionId}`)
  if (!userId) {
    return await next()
  }

  const db = drizzle(c.env.DB)
  const user = await db.select().from(users).where(eq(users.id, userId)).get()
  
  if (user) {
    c.set('user', user)
  }

  await next()
})
