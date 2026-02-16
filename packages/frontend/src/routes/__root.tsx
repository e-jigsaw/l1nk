import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Home, Search, Plus, Hash } from 'lucide-react'

export const Route = createRootRoute({
  loader: async () => {
    try {
      const res = await fetch('/api/pages')
      if (res.ok) return { recentPages: await res.json() }
      return { recentPages: [] }
    } catch (e) {
      return { recentPages: [] }
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { recentPages } = Route.useLoaderData()
  const navigate = useNavigate()
  
  // 型定義 (簡易的)
  interface Page {
    id: string
    slug: string
    title: string
  }

  const handleCreatePage = () => {
    const tempSlug = `untitled-${Math.random().toString(36).slice(2, 7)}`
    navigate({ to: '/$slug', params: { slug: tempSlug } })
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2 text-white font-bold text-xl">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">L</div>
          l1nk
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-slate-800 [&.active]:text-white"
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Search size={18} />
            <span>Search</span>
          </button>
          <button 
            onClick={handleCreatePage}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Plus size={18} />
            <span>New Page</span>
          </button>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Pages
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[300px]">
            {recentPages.map((page: Page) => (
              <Link
                key={page.id}
                to="/$slug"
                params={{ slug: page.slug }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-sm"
              >
                <Hash size={14} className="text-slate-500" />
                <span className="truncate">{page.title}</span>
              </Link>
            ))}
            {recentPages.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-600 italic">No pages yet</div>
            )}
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-sm">
            <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px]">JD</div>
            <span>John Doe</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <Outlet />
        </div>
      </main>
      
      <TanStackRouterDevtools />
    </div>
  )
}
