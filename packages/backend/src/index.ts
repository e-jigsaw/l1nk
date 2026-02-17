import { Hono } from 'hono'
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
}

type Variables = {
  user: any
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Middleware
app.use('*', authMiddleware)

// Routes
app.route('/auth', auth)

// API Guard
app.use('/api/*', async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

app.route('/api/pages', pagesApp)

// WebSocket for Real-time Page Sync
app.get('/api/ws/pages/:id', async (c) => {
  if (!c.get('user')) {
    return c.text('Unauthorized', 401)
  }
  const id = c.req.param('id')
  const doId = c.env.PAGE_OBJECT.idFromName(id)
  const obj = c.env.PAGE_OBJECT.get(doId)
  return obj.fetch(c.req.raw)
})

app.get('/', (c) => {
  return c.text('l1nk API')
})

export { PageObject }
export default app
