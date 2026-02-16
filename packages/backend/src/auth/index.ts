import { Hono } from 'hono'
import { Google, GitHub } from 'arctic'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  REDIRECT_URI_BASE: string
}

export const auth = new Hono<{ Bindings: Bindings }>()

auth.get('/login/google', async (c) => {
  // 実装予定: Arcticを使ってGoogleログインURLを生成しリダイレクト
  return c.text('Google Login Not Implemented Yet')
})

auth.get('/callback/google', async (c) => {
  // 実装予定: コールバック処理
  return c.text('Google Callback Not Implemented Yet')
})

auth.get('/me', async (c) => {
  // 実装予定: セッション確認
  return c.json({ user: null })
})
