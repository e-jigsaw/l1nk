import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Clock, MessageSquare, Plus } from 'lucide-react'

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      const res = await fetch('/api/pages')
      if (res.ok) return { pages: await res.json() }
      return { pages: [] }
    } catch (e) {
      return { pages: [] }
    }
  },
  component: Index,
})

function Index() {
  const { pages } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleCreatePage = () => {
    const tempSlug = `untitled-${Math.random().toString(36).slice(2, 7)}`
    navigate({ to: '/$slug', params: { slug: tempSlug } })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">My Knowledge Base</h1>
        <p className="text-slate-500">Welcome back. You have {pages.length} active pages.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Recently Updated
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages
            .filter((page: any) => page.slug !== 'new') // 'new' は除外
            .map((page: any) => (
              <Link
                key={page.id}
              to="/$slug"
              params={{ slug: page.slug }}
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {page.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(page.updatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  view: {page.views}
                </span>
              </div>
            </Link>
          ))}
          
          <button 
            onClick={handleCreatePage}
            className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2 group-hover:bg-indigo-50 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-sm font-medium">Create New Page</span>
          </button>
        </div>
      </section>
    </div>
  )
}
