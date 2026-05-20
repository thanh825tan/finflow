import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, ArrowLeftRight, Wallet, BarChart3, Target, Coins,
  CreditCard, Tags, Settings, Menu, X, Sun, Moon, LogOut, ChevronDown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'

const navItems = [
  { to: '/', icon: Home, label: 'Tổng quan' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Giao dịch' },
  { to: '/budgets', icon: Wallet, label: 'Ngân sách' },
  { to: '/reports', icon: BarChart3, label: 'Báo cáo' },
  { to: '/goals', icon: Target, label: 'Mục tiêu' },
  { to: '/debts', icon: Coins, label: 'Nợ & vay' },
  { to: '/accounts', icon: CreditCard, label: 'Tài khoản' },
  { to: '/categories', icon: Tags, label: 'Danh mục' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const currentPage = navItems.find(n => n.to === location.pathname)?.label || 'FinFlow'

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-60 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <Logo size={36} variant="horizontal" />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                ${isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-slate-800 flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <Logo size={32} variant="horizontal" />
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    ${isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title={theme === 'light' ? 'Chuyển dark mode' : 'Chuyển light mode'}
            >
              {theme === 'light'
                ? <Moon className="w-5 h-5 text-slate-600" />
                : <Sun className="w-5 h-5 text-slate-300" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-slate-700 dark:text-slate-200">
                  {profile?.full_name || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
