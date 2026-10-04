import { Link, useParams } from 'react-router'
import { difficultyLabel, manifest } from '@/lib/content'
import type { Difficulty } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

const dotClass: Record<Difficulty, string> = {
  easy: 'bg-[hsl(var(--easy))]',
  medium: 'bg-[hsl(var(--medium))]',
  hard: 'bg-[hsl(var(--hard))]',
}

/** 左侧导航：章节分组 + 题目列表 + 过滤搜索 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { num } = useParams()
  const active = num ? Number(num) : null
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return manifest.chapters
      .flatMap((c) => c.problems)
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          String(p.num) === q ||
          p.slug.includes(q)
      )
  }, [query])

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-[hsl(var(--sidebar-background))] px-4 pb-3 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索题号或标题…"
            className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-[hsl(var(--amber))]/60"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {filtered ? (
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-ink-soft">没有匹配的题目</p>
            )}
            {filtered.map((p) => (
              <ProblemLink key={p.num} num={p.num} title={p.title} difficulty={p.difficulty} active={active === p.num} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          manifest.chapters.map((ch, ci) => (
            <details key={ch.name} open className="group mb-1">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-[hsl(var(--sidebar-accent))]">
                <span className="font-code text-[11px] text-[hsl(var(--amber))]">
                  {String(ci + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{ch.name}</span>
                <span className="font-code text-[11px] font-normal text-ink-soft">
                  {ch.problems.length}
                </span>
              </summary>
              <div className="mt-0.5 space-y-0.5 pl-2">
                {ch.problems.map((p) => (
                  <ProblemLink key={p.num} num={p.num} title={p.title} difficulty={p.difficulty} active={active === p.num} onNavigate={onNavigate} />
                ))}
              </div>
            </details>
          ))
        )}
      </nav>
    </div>
  )
}

function ProblemLink({
  num,
  title,
  difficulty,
  active,
  onNavigate,
}: {
  num: number
  title: string
  difficulty: Difficulty
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      to={`/problem/${num}`}
      onClick={onNavigate}
      title={`${num}. ${title}（${difficultyLabel[difficulty]}）`}
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors',
        active
          ? 'bg-[hsl(var(--amber))]/12 font-medium text-[hsl(var(--amber))]'
          : 'text-ink-soft hover:bg-[hsl(var(--sidebar-accent))] hover:text-ink'
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass[difficulty])} />
      <span className="w-7 shrink-0 font-code text-[11px] opacity-70">{num}</span>
      <span className="truncate">{title}</span>
    </Link>
  )
}
