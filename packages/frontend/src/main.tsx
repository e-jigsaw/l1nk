import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'

// 以前に生成されたルートツリーをインポート（TanStack Router Plugin が生成する）
import { routeTree } from './routeTree.gen'

// ルーターインスタンスの作成
const router = createRouter({ routeTree })

// 型安全性のための登録
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}