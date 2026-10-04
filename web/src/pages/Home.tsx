import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Search } from 'lucide-react'
import { allProblems, difficultyLabel, manifest } from '@/lib/content'
import type { Difficulty } from '@/lib/types'
import { cn } from '@/lib/utils'

const diffText: Record<Difficulty, string> = {
  easy: 'text-[hsl(var(--easy))]',
  medium: 'text-[hsl(var(--medium))]',
  hard: 'text-[hsl(var(--hard))]',
}
const diffBg: Record<Difficulty, string> = {
  easy: 'bg-[hsl(var(--easy))]',
  medium: 'bg-[hsl(var(--medium))]',
  hard: 'bg-[hsl(var(--hard))]',
}
const diffSoftBg: Record<Difficulty, string> = {
  easy: 'bg-[hsl(var(--easy-soft))]',
  medium: 'bg-[hsl(var(--medium-soft))]',
  hard: 'bg-[hsl(var(--hard-soft))]',
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [diff, setDiff] = useState<Difficulty | null>(null)

  const stats = useMemo(() => {
    const count = { easy: 0, medium: 0, hard: 0 }
    allProblems.forEach((p) => count[p.difficulty]++)
    return count
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProblems.filter(
      (p) =>
        (!diff || p.difficulty === diff) &&
        (!q || p.title.toLowerCase().includes(q) || String(p.num).includes(q))
    )
  }, [query, diff])

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {/* Hero */}
      <section className="fade-up">
        <p className="font-code text-xs uppercase tracking-[0.3em] text-[hsl(var(--amber))]">
          Top Interview 150
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          LeetCode 面试经典
          <span className="text-[hsl(var(--amber))]"> 150 题</span>
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
          每道题配有深入的思路剖析、正确性论证、复杂度分析与 Go 实现，
          并附带逐步可交互的算法可视化演示。
        </p>

        {/* 统计 */}
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Stat label="题目总数" value={manifest.total} />
          <Stat label="专题章节" value={manifest.chapters.length} />
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-4">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDiff((cur) => (cur === d ? null : d))}
                className={cn(
                  'group flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors',
                  diff === d ? diffSoftBg[d] : 'hover:bg-secondary'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', diffBg[d])} />
                <span className="text-sm text-ink-soft group-hover:text-ink">
                  {difficultyLabel[d]}
                </span>
                <span className={cn('font-code text-sm font-semibold', diffText[d])}>
                  {stats[d]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 难度分布条 */}
        <div className="mt-4 flex h-2 w-full max-w-md overflow-hidden rounded-full bg-secondary">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <div
              key={d}
              className={diffBg[d]}
              style={{ width: `${(stats[d] / manifest.total) * 100}%` }}
            />
          ))}
        </div>
      </section>

      {/* 章节卡片 */}
      <section className="mt-14">
        <SectionTitle index="01" title="专题章节" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.chapters.map((ch, i) => {
            const nums = ch.problems.map((p) => p.num)
            return (
              <Link
                key={ch.name}
                to={`/problem/${ch.problems[0].num}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--amber))]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="font-code text-xs text-[hsl(var(--amber))]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-code text-[11px] text-ink-soft">
                    {nums[0]}–{nums[nums.length - 1]}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-ink transition-colors group-hover:text-[hsl(var(--amber))]">
                  {ch.name}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    {ch.problems.map((p) => (
                      <span
                        key={p.num}
                        title={`${p.num}. ${p.title}`}
                        className={cn('h-1.5 w-1.5 rounded-full opacity-80', diffBg[p.difficulty])}
                      />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-ink-soft transition-colors group-hover:text-[hsl(var(--amber))]">
                    {ch.problems.length} 题
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 全部题目索引 */}
      <section className="mt-14">
        <SectionTitle index="02" title="题目索引" />
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索题号或标题，例如 28 / 接雨水…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-ink shadow-sm outline-none placeholder:text-ink-soft/60 focus:border-[hsl(var(--amber))]/60 focus:ring-2 focus:ring-[hsl(var(--amber))]/20"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-soft">没有匹配的题目</p>
          )}
          {filtered.map((p) => (
            <Link
              key={p.num}
              to={`/problem/${p.num}`}
              className="group flex items-center gap-4 border-b border-border/60 px-4 py-3 transition-colors last:border-none hover:bg-secondary/60"
            >
              <span className="w-8 shrink-0 font-code text-xs text-ink-soft">{p.num}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink group-hover:text-[hsl(var(--amber))]">
                {p.title}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  diffSoftBg[p.difficulty],
                  diffText[p.difficulty]
                )}
              >
                {difficultyLabel[p.difficulty]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-ink-soft">
        基于 MkDocs 内容库重构 · Go 语言实现 · 交互式算法可视化
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  )
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-code text-sm text-[hsl(var(--amber))]">{index}</span>
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
