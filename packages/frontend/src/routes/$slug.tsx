import { createFileRoute, Link as RouterLink, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit3, Link as LinkIcon, Share2, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import { BracketLinkDecoration } from '../lib/BracketLinkDecoration'
import * as Y from 'yjs'

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    try {
      const res = await fetch(`/api/pages/${params.slug}`)
      if (res.status === 404) return { page: null, slug: params.slug }
      const data = await res.json()
      return { page: data, slug: params.slug }
    } catch (e) {
      return { page: null, slug: params.slug }
    }
  },
  component: PageComponent,
})

function PageComponent() {
  const { page, slug } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [title, setTitle] = useState(page?.title || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const [ydoc] = useState(() => new Y.Doc())
  const wsRef = useRef<WebSocket | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({
        document: ydoc,
      }),
      BracketLinkDecoration,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px]',
      },
      handleClick: (view, pos, event) => {
        // Decoration から href を取得して遷移する
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
  }, [slug])

  useEffect(() => {
    if (!page?.id) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//localhost:8787/api/ws/pages/${page.id}`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    const onOpen = () => setIsConnected(true)
    const onClose = () => setIsConnected(false)
    const onMessage = (event: MessageEvent) => {
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
    }
  }, [page?.id, ydoc])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
  }

  const handleSaveTitle = async (finalTitle: string) => {
    if (!finalTitle || (page && finalTitle === page.title)) return
    
    setIsSaving(true)
    try {
      const finalSlug = finalTitle.toLowerCase().replace(/\s+/g, '-')
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle, slug: finalSlug }),
      })
      if (res.ok) {
        await router.invalidate()
        if (finalSlug !== slug) {
          navigate({ to: '/$slug', params: { slug: finalSlug }, replace: true })
        }
      }
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <RouterLink to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </RouterLink>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 size={18} className="animate-spin text-indigo-500" />}
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Edit3 size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <article>
        <input
          type="text"
          value={title}
          placeholder="New Page Title..."
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={(e) => handleSaveTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle((e.target as HTMLInputElement).value)}
          className="w-full text-5xl font-black text-slate-900 mb-8 tracking-tight bg-transparent border-none outline-none placeholder:text-slate-200"
        />
        
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <EditorContent editor={editor} />
        </div>
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
