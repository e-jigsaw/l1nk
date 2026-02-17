import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Share2, Link as LinkIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import { BracketLinkDecoration } from '../lib/BracketLinkDecoration'
import { cn } from '../lib/utils'
import * as Y from 'yjs'

// 内部的なスラグ -> ID のマッピングキャッシュ
const slugIdMap = new Map<string, string>()

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    const knownId = slugIdMap.get(params.slug)
    if (knownId) {
      try {
        const res = await fetch(`/api/pages/id/${knownId}`)
        if (res.ok) return { page: await res.json(), slug: params.slug }
      } catch (e) {}
    }

    if (params.slug === 'new') {
      const res = await fetch('/api/pages', { method: 'POST' })
      if (res.ok) {
        const page = await res.json()
        slugIdMap.set(params.slug, page.id)
        return { page, slug: 'new' }
      }
    }

    try {
      const res = await fetch(`/api/pages/${params.slug}`)
      if (res.ok) {
        const page = await res.json()
        slugIdMap.set(params.slug, page.id)
        return { page, slug: params.slug }
      }
    } catch (e) {}
    
    return { page: null, slug: params.slug }
  },
  component: PageComponent,
})

function PageComponent() {
  const { page, slug } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)

  const [ydoc] = useState(() => new Y.Doc())
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSlugRef = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [
      // history: false の代わりに configure 内で false を指定
      StarterKit.configure({ 
        history: false 
      }),
      Collaboration.configure({ document: ydoc }),
      BracketLinkDecoration,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] text-lg leading-relaxed',
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement
        const href = target.getAttribute('data-href') || target.parentElement?.getAttribute('data-href')
        if (href) {
          event.preventDefault()
          navigate({ to: '/$slug', params: { slug: href } })
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText().trim()
      const firstLine = text.split(/[\n\r]+/)[0] || ""
      if (!firstLine) return

      const newSlug = firstLine.toLowerCase().replace(/\s+/g, '-').substring(0, 50)
      if (newSlug && newSlug !== slug) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          pendingSlugRef.current = newSlug
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'SYNC' }))
          }
        }, 1500)
      }
    }
  }, [slug, page?.id])

  useEffect(() => {
    if (!page?.id) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const isDev = window.location.hostname === 'localhost'
    const wsHost = isDev ? 'localhost:8787' : window.location.host
    const wsUrl = `${protocol}//${wsHost}/api/ws/pages/${page.id}`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    const onOpen = () => setIsConnected(true)
    const onClose = () => setIsConnected(false)
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'SYNC_COMPLETE' && pendingSlugRef.current) {
            const newSlug = pendingSlugRef.current
            pendingSlugRef.current = null
            slugIdMap.set(newSlug, page.id)
            navigate({ to: '/$slug', params: { slug: newSlug }, replace: true })
          }
        } catch (e) {}
        return
      }
      Y.applyUpdate(ydoc, new Uint8Array(event.data))
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('message', onMessage)

    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== ws && ws.readyState === WebSocket.OPEN) {
        ws.send(update)
      }
    }

    ydoc.on('update', onDocUpdate)

    return () => {
      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('message', onMessage)
      ws.close()
      ydoc.off('update', onDocUpdate)
      ydoc.destroy()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [page?.id, ydoc, navigate, page.id])

  if (!page) return <div className="p-8 text-slate-400 italic">Loading page...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <RouterLink to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </RouterLink>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
            isConnected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-slate-400"
            )} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <article className="bg-white p-10 md:p-16 rounded-3xl shadow-sm border border-slate-200 min-h-[800px]">
        <EditorContent editor={editor} />
      </article>

      <section className="pt-12 border-t border-slate-200">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <LinkIcon size={14} />
          Related Pages
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-100/50 p-4 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
            No related pages yet.
          </div>
        </div>
      </section>
    </div>
  )
}