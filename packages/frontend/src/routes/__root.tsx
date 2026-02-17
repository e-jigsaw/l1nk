import { createRootRoute, Link, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Home, Search, Plus, Hash, LogIn, LogOut, User, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

export const Route = createRootRoute({
  loader: async () => {
    try {
      const [pagesRes, authRes] = await Promise.all([
        fetch('/api/pages').catch(() => null),
        fetch('/auth/me').catch(() => null)
      ])
      
      const recentPages = (pagesRes && pagesRes.ok) ? await pagesRes.json() : []
      const authData = (authRes && authRes.ok) ? await authRes.json() : { user: null }
      
      return { recentPages, user: authData.user }
    } catch (e) {
      return { recentPages: [], user: null }
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { recentPages, user } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  
  interface Page {
    id: string
    slug: string
    title: string
  }

  const handleCreatePage = () => {
    navigate({ to: '/$slug', params: { slug: 'new' } })
  }

  const handleLogin = () => {
    window.location.href = '/auth/login/google'
  }

  const handleLogout = async () => {
    const res = await fetch('/auth/logout', { method: 'POST' })
    if (res.ok) {
      await router.invalidate()
      navigate({ to: '/' })
    }
  }

  const devtools = !import.meta.env.PROD && <TanStackRouterDevtools />

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Zap size={32} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">l1nk</h1>
            <p className="mt-3 text-slate-500 text-lg">
              Knowledge networking, simplified.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-slate-600 mb-6">
              Sign in to start creating and sharing your personal knowledge base.
            </p>
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-bold text-lg shadow-md hover:shadow-lg active:scale-95"
            >
              <LogIn size={24} />
              <span>Login with Google</span>
            </button>
          </div>
          <div className="text-xs text-slate-400">
            &copy; 2026 l1nk project. Open source and lightweight.
          </div>
        </div>
        {devtools}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2 text-white font-bold text-xl">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">L</div>
          l1nk
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-slate-800 [&.active]:text-white"
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left">
            <Search size={18} />
            <span>Search</span>
          </button>
          <button 
            onClick={handleCreatePage}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <Plus size={18} />
            <span>New Page</span>
          </button>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Pages
          </div>
          <div className="space-y-1">
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
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-white">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <User size={18} />
              )}
              <span className="truncate">{user.name || user.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-900/30 hover:text-red-400 transition-colors text-xs"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <Outlet />
        </div>
      </main>
      
      {devtools}
    </div>
  )
}