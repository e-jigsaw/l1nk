import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit3, Link as LinkIcon, Share2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

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

  // ページがない（新規作成）かつタイトルが初期状態なら、スラグから推測するか空にする
  useEffect(() => {
    if (!page) {
      setTitle(slug.startsWith('untitled-') ? '' : slug)
    } else {
      setTitle(page.title)
    }
  }, [page, slug])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // リアルタイムの URL 変更を一旦停止する (フラッシングの原因になるため)
    /*
    if (!page && newTitle.trim()) {
      const newSlug = newTitle.toLowerCase().replace(/\s+/g, '-')
      if (newSlug !== slug) {
        navigate({ 
          to: '/$slug', 
          params: { slug: newSlug }, 
          replace: true 
        })
      }
    }
    */
  }

  const handleSave = async (finalTitle: string) => {
    if (!finalTitle || (page && finalTitle === page.title)) return
    
    setIsSaving(true)
    try {
      // スラグを確定させる
      const finalSlug = finalTitle.toLowerCase().replace(/\s+/g, '-')

      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle, slug: finalSlug }),
      })
      if (res.ok) {
        await router.invalidate()
        // 保存成功後に初めて、正しいスラグの URL に遷移させる
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
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

      <article>
        <input
          type="text"
          value={title}
          placeholder="New Page Title..."
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={(e) => handleSave(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave((e.target as HTMLInputElement).value)}
          className="w-full text-5xl font-black text-slate-900 mb-8 tracking-tight bg-transparent border-none outline-none placeholder:text-slate-200"
        />
        
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 min-h-[500px] prose prose-slate max-w-none">
          {page ? (
            <p className="text-xl text-slate-600 leading-relaxed">
              これは <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">[{title}]</span> に関する知識のページだ。
            </p>
          ) : (
            <p className="text-xl text-slate-400 italic leading-relaxed">
              タイトルを入力して確定（Enter またはフォーカスを外す）するとページが作成されるよ。
            </p>
          )}
          <p className="mt-4 text-slate-500 italic">
            (ここに Yjs によるリアルタイム共同編集エディタが統合される予定)
          </p>
        </div>
      </article>

      {/* Related Pages Section (Placeholder) */}
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