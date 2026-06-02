import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, HardDrive, BarChart2, Settings, LogOut, Sun, Moon, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Logo from '../Logo'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices', icon: HardDrive, label: 'Devices' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { resolved, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-60 h-full min-h-screen
      bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/60">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-14
        border-b border-slate-200 dark:border-slate-800/60 shrink-0">
        <Logo size="sm" />
        {onClose && (
          <button
            type="button"
            title="Close menu"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-slate-400 dark:text-slate-500
              hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 select-none">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-white/[0.09] text-white dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User row */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          {/* Avatar */}
          <div className="flex items-center justify-center w-7 h-7 rounded-md shrink-0
            bg-slate-900 dark:bg-white
            text-white dark:text-slate-900 font-semibold text-[11px] select-none">
            {user ? initials(user.name) : '?'}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {user?.name.split(' ')[0]}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">{user?.email}</p>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            title={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-md text-slate-400 dark:text-slate-500
              hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300
              transition-colors shrink-0"
          >
            {resolved === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Logout */}
          <button
            type="button"
            title="Log out"
            onClick={handleLogout}
            className="p-1.5 rounded-md text-slate-400 dark:text-slate-500
              hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400
              transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
