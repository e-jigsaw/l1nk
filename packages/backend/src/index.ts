import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { auth } from './auth'
import { pagesApp } from './pages'
import { PageObject } from './models/PageObject'
import { authMiddleware } from './middleware/auth'

type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  PAGE_OBJECT: DurableObjectNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  REDIRECT_URI_BASE: string
  FRONTEND_URL: string
  ASSETS: Fetcher // 静的ファイル配信用 (Cloudflare Pages Assets)
}

type Variables = {
  user: any
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Middleware
app.use('*', authMiddleware)

// API & Auth Routes
app.route('/auth', auth)
app.use('/api/*', async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})
app.route('/api/pages', pagesApp)

// WebSocket
app.get('/api/ws/pages/:id', async (c) => {
  if (!c.get('user')) return c.text('Unauthorized', 401)
  const id = c.req.param('id')
  const doId = c.env.PAGE_OBJECT.idFromName(id)
  const obj = c.env.PAGE_OBJECT.get(doId)
  return obj.fetch(c.req.raw)
})

// Static Assets & SPA Fallback
// 開発環境と本番環境の両方で動くように設定
app.get('/*', serveStatic({ root: './', manifest: (globalThis as any).__STATIC_CONTENT_MANIFEST }))
app.get('/*', serveStatic({ path: './index.html' }))

export { PageObject }
export default app