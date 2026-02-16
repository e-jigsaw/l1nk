import { Hono } from 'hono'
import { auth } from './auth'
import { pagesApp } from './pages'

type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.route('/auth', auth)
app.route('/api/pages', pagesApp)

app.get('/', (c) => {
  return c.text('l1nk API')
})

export default app