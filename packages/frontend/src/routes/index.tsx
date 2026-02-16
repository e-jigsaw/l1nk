import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  // 暫定的なデータ
  const recentPages = [
    { id: '1', slug: 'Architecture', title: 'Architecture & Design', updatedAt: '2h ago' },
    { id: '2', slug: 'Setup-Guide', title: 'Getting Started Guide', updatedAt: '5h ago' },
    { id: '3', slug: 'Release-Notes', title: 'v1.0 Release Notes', updatedAt: '1d ago' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">My Knowledge Base</h1>
        <p className="text-slate-500">Welcome back. You have {recentPages.length} active pages.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Recently Updated
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentPages.map((page) => (
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
                  {page.updatedAt}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  12 links
                </span>
              </div>
            </Link>
          ))}
          
          <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all group">
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

function Plus({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}