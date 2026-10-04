import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Clock3, Database, FlaskConical } from 'lucide-react'
import {
  allProblems,
  chapterOf,
  difficultyLabel,
  getProblemContent,
  problemByNum,
} from '@/lib/content'
import { Markdown } from '@/components/Markdown'
import { CodeBlock } from '@/components/CodeBlock'
import { VizSlot, hasNativeDemo } from '@/demo/registry'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/lib/types'

const diffStyle: Record<Difficulty, string> = {
  easy: 'bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  medium: 'bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]',
  hard: 'bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
}

export default function ProblemPage() {
  const { num } = useParams()
  const n = Number(num)
  const meta = problemByNum.get(n)
  const content = meta ? getProblemContent(n) : null

  useEffect(() => {
    if (meta) document.title = `${meta.num}. ${meta.title} · LeetCode 150`
    return () => {
      document.title = 'LeetCode 面试经典 150'
    }
  }, [meta])

  if (!meta || !content) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-6xl font-bold text-ink/20">404</p>
        <p className="mt-4 text-ink-soft">没有找到这道题目</p>
        <Link to="/" className="mt-6 inline-block text-sm text-[hsl(var(--amber))] hover:underline">
          返回首页
        </Link>
      </div>
    )
  }

  const chapter = chapterOf(meta)
  const idx = allProblems.findIndex((p) => p.num === n)
  const prev = idx > 0 ? allProblems[idx - 1] : null
  const next = idx < allProblems.length - 1 ? allProblems[idx + 1] : null

  const toc = [
    { id: 'description', label: '题目描述', show: !!content.description },
    { id: 'analysis', label: '思路解析', show: !!content.analysis },
    { id: 'viz', label: '交互演示', show: true },
    { id: 'code', label: 'Go 实现', show: !!content.code },
  ].filter((t) => t.show)

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-5 py-10 sm:px-8">
      <article className="min-w-0 max-w-3xl flex-1">
        {/* 面包屑 + 题头 */}
        <div className="fade-up">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <Link to="/" className="hover:text-[hsl(var(--amber))]">首页</Link>
            <span>/</span>
            <span>{chapter?.name}</span>
          </div>

          <div className="mt-5 flex items-start gap-5">
            <span className="font-display text-6xl font-bold leading-none text-ink/15 sm:text-7xl">
              {meta.num}
            </span>
            <div className="min-w-0 pt-1.5">
              <h1 className="font-display text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
                {meta.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', diffStyle[meta.difficulty])}>
                  {difficultyLabel[meta.difficulty]}
                </span>
                {content.timeComplexity && (
                  <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-code text-xs text-ink-soft">
                    <Clock3 className="h-3 w-3" /> {content.timeComplexity}
                  </span>
                )}
                {content.spaceComplexity && (
                  <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-code text-xs text-ink-soft">
                    <Database className="h-3 w-3" /> {content.spaceComplexity}
                  </span>
                )}
                {hasNativeDemo(meta.num) && (
                  <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--amber-soft))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--amber))]">
                    <FlaskConical className="h-3 w-3" /> 新版交互
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 题目描述 */}
        {content.description && (
          <Section id="description" index="01" title="题目描述">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <Markdown>{content.description}</Markdown>
            </div>
          </Section>
        )}

        {/* 思路解析 */}
        {content.analysis && (
          <Section id="analysis" index="02" title="思路解析">
            <Markdown>{content.analysis}</Markdown>
          </Section>
        )}

        {/* 交互演示 */}
        <Section id="viz" index="03" title="交互演示">
          <VizSlot num={meta.num} />
        </Section>

        {/* 代码 */}
        {content.code && (
          <Section id="code" index="04" title="Go 实现">
            <CodeBlock code={content.code} />
          </Section>
        )}

        {/* 上一题 / 下一题 */}
        <nav className="mt-14 grid grid-cols-2 gap-3">
          {prev ? (
            <PagerLink to={`/problem/${prev.num}`} dir="prev" num={prev.num} title={prev.title} />
          ) : (
            <span />
          )}
          {next && (
            <PagerLink to={`/problem/${next.num}`} dir="next" num={next.num} title={next.title} />
          )}
        </nav>
      </article>

      {/* 右侧目录 */}
      <aside className="sticky top-24 hidden h-fit w-40 shrink-0 xl:block">
        <p className="font-code text-[11px] uppercase tracking-widest text-ink-soft">本页目录</p>
        <ul className="mt-3 space-y-1.5 border-l border-border">
          {toc.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-[13px] text-ink-soft transition-colors hover:border-[hsl(var(--amber))] hover:text-ink"
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string
  index: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-code text-xs text-[hsl(var(--amber))]">{index}</span>
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  )
}

function PagerLink({
  to,
  dir,
  num,
  title,
}: {
  to: string
  dir: 'prev' | 'next'
  num: number
  title: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group rounded-xl border border-border bg-card p-4 transition-all hover:border-[hsl(var(--amber))]/40 hover:shadow-sm',
        dir === 'next' && 'text-right'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1 text-xs text-ink-soft',
          dir === 'next' && 'justify-end'
        )}
      >
        {dir === 'prev' && <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />}
        {dir === 'prev' ? '上一题' : '下一题'}
        {dir === 'next' && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />}
      </div>
      <div className="mt-1.5 truncate text-sm font-medium text-ink group-hover:text-[hsl(var(--amber))]">
        <span className="mr-1.5 font-code text-xs text-ink-soft">{num}</span>
        {title}
      </div>
    </Link>
  )
}
