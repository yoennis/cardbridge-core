import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import InstallBanner from '../InstallBanner'
import OfflineBanner from '../OfflineBanner'
import { LogoMark } from '../Logo'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-auto md:transition-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14
          bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/60">
          <button
            type="button"
            title="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-slate-500 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <LogoMark width={44} />
            <span className="font-bold text-sm tracking-tight">CardBridge</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          <OfflineBanner />
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <InstallBanner />
    </div>
  )
}
