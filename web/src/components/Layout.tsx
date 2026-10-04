import { Link, Outlet, useLocation } from 'react-router'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { useTheme } from '@/hooks/useTheme'

export function Layout() {
  const { dark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-paper">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-border bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
          <button
            className="rounded-lg p-2 text-ink-soft hover:bg-secondary lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="菜单"
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              LeetCode <span className="text-[hsl(var(--amber))]">150</span>
            </span>
            <span className="hidden text-xs text-ink-soft sm:inline">面试经典题解 · Go</span>
          </Link>
          <div className="flex-1" />
          <a
            href="https://leetcode.cn/studyplan/top-interview-150/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:bg-secondary hover:text-ink sm:block"
          >
            官方题单 ↗
          </a>
          <button
            onClick={toggle}
            aria-label="切换主题"
            className="rounded-lg border border-border p-2 text-ink-soft transition-colors hover:border-[hsl(var(--amber))]/50 hover:text-[hsl(var(--amber))]"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* 桌面侧栏 */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-border bg-[hsl(var(--sidebar-background))] lg:block">
          <Sidebar />
        </aside>

        {/* 移动端抽屉 */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-14 h-[calc(100vh-3.5rem)] w-72 border-r border-border bg-[hsl(var(--sidebar-background))] shadow-xl">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* 主内容 */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
