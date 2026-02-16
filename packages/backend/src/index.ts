import { Hono } from 'hono'
import { auth } from './auth'
import { pagesApp } from './pages'
import { PageObject } from './models/PageObject'

type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  PAGE_OBJECT: DurableObjectNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.route('/auth', auth)
app.route('/api/pages', pagesApp)

// WebSocket for Real-time Page Sync
app.get('/api/ws/pages/:id', async (c) => {
  const id = c.req.param('id')
  const doId = c.env.PAGE_OBJECT.idFromName(id)
  const obj = c.env.PAGE_OBJECT.get(doId)

  // Durable Object の fetch にリクエストを転送し、そのレスポンス（101 Switching Protocols）を返す
  return obj.fetch(c.req.raw)
})

app.get('/', (c) => {
  return c.text('l1nk API')
})

export { PageObject }
export default app