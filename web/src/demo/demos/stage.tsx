import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 舞台通用元件：跨可视化模式复用，统一样式来源。                        */
/* 颜色只允许引用 src/index.css 的 CSS 变量（规范 2.1）。                */
/* ------------------------------------------------------------------ */

/** 语义色：amber=当前 · teal=对照 · easy=已确定 · medium=待定 · hard=冲突 · water=区域 */
export type Tone = 'amber' | 'teal' | 'easy' | 'medium' | 'hard' | 'water' | 'ink' | 'muted'

export const TONE: Record<Tone, string> = {
  amber: 'hsl(var(--amber))',
  teal: 'hsl(var(--teal))',
  easy: 'hsl(var(--easy))',
  medium: 'hsl(var(--medium))',
  hard: 'hsl(var(--hard))',
  water: 'hsl(var(--water))',
  ink: 'hsl(var(--ink))',
  muted: 'hsl(var(--ink) / 0.18)',
}

/* ---------------- 状态条（图表下方的小徽章） ---------------- */

const BADGE: Record<Tone | 'plain', string> = {
  plain: 'border-border bg-card text-ink-soft',
  amber: 'border-[hsl(var(--amber))]/40 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
  teal: 'border-[hsl(var(--teal))]/40 bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]',
  easy: 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  medium: 'border-[hsl(var(--medium))]/40 bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]',
  hard: 'border-[hsl(var(--hard))]/40 bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
  water: 'border-[hsl(var(--water))]/40 bg-card text-[hsl(var(--water))]',
  ink: 'border-border bg-secondary text-ink',
  muted: 'border-border bg-card text-ink-soft',
}

export function Badges({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}

export function Badge({
  children,
  tone = 'plain',
  strong,
}: {
  children: ReactNode
  tone?: Tone | 'plain'
  strong?: boolean
}) {
  return (
    <span
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs',
        BADGE[tone],
        strong && 'font-medium'
      )}
    >
      {children}
    </span>
  )
}

/** 「名称 + 等宽数值」，用于当前值 / 历史最优 / 计数器 */
export function Stat({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: ReactNode
  tone?: Tone
}) {
  return (
    <Badge>
      {label}{' '}
      <b className="font-code text-sm" style={{ color: TONE[tone] }}>
        {value}
      </b>
    </Badge>
  )
}

/** 下一步动作提示 */
export function Hint({ children, tone = 'teal' }: { children: ReactNode; tone?: Tone }) {
  return (
    <Badge tone={tone}>
      下一步：<span className="font-medium">{children}</span>
    </Badge>
  )
}

/** 结论徽章，只在 done 步骤出现 */
export function Answer({ children }: { children: ReactNode }) {
  return (
    <Badge tone="easy" strong>
      ✓ 答案 {children}
    </Badge>
  )
}

/* ---------------- 单元格（数组 / DP / 网格） ---------------- */

export type CellState = 'idle' | 'active' | 'ok' | 'warn' | 'bad' | 'new' | 'dim'

const CELL: Record<CellState, string> = {
  idle: 'border-border bg-card text-ink',
  active:
    '-translate-y-[3px] border-[hsl(var(--amber))] bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))] shadow-[0_4px_10px_hsl(28_92%_45%/0.25)]',
  ok: 'border-[hsl(var(--easy))] bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  new: 'border-[hsl(var(--teal))] bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]',
  warn: 'border-[hsl(var(--medium))] bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]',
  bad: 'border-[hsl(var(--hard))] bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
  dim: 'border-border bg-[hsl(var(--ink)/0.18)] text-ink-soft',
}

const SIZE = {
  sm: 'h-9 min-w-9 px-1 text-[13px]',
  md: 'h-9 min-w-9 px-1.5 text-[13px] sm:h-11 sm:min-w-11 sm:text-[15px]',
  lg: 'h-12 min-w-12 px-2.5 text-base',
} as const

export function Cell({
  children,
  state = 'idle',
  size = 'md',
  className,
}: {
  children?: ReactNode
  state?: CellState
  size?: keyof typeof SIZE
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border-[1.5px] font-code font-semibold transition-all duration-200',
        SIZE[size],
        CELL[state],
        className
      )}
    >
      {children}
    </div>
  )
}

/** 单元格上方的指针旗标（三角旗标 + 字母），保证不靠颜色也能区分 */
export function Flag({ label, tone = 'amber' }: { label?: string; tone?: Tone }) {
  return (
    <div className="flex h-6 flex-col items-center justify-end leading-none" style={{ color: TONE[tone] }}>
      {label && <span className="font-code text-[11px] font-bold">{label}</span>}
      {label && <span className="mt-0.5 text-[8px]">▼</span>}
    </div>
  )
}

/** SVG 舞台里的指针旗标（题 28 / 题 16 等柱状图复用），几何与 Flag 一致 */
export function Pointer({
  x,
  y,
  label,
  tone = 'amber',
}: {
  x: number
  y: number
  label: string
  tone?: Tone
}) {
  return (
    <g>
      <path d={`M ${x - 7} ${y} h 14 l -7 9 z`} fill={TONE[tone]} />
      <text
        x={x}
        y={y - 6}
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        className="font-code"
        fill={TONE[tone]}
      >
        {label}
      </text>
    </g>
  )
}

/* ---------------- 链表（模式 D） ---------------- */

export function Node({
  children,
  state = 'idle',
  className,
}: {
  children?: ReactNode
  state?: 'idle' | 'active' | 'teal' | 'ok' | 'dim'
  className?: string
}) {
  const map = {
    idle: 'border-border bg-card text-ink',
    active: 'border-[hsl(var(--amber))] bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
    teal: 'border-[hsl(var(--teal))] bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]',
    ok: 'border-[hsl(var(--easy))] bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
    dim: 'border-border bg-card text-ink-soft opacity-40',
  }
  return (
    <div
      className={cn(
        'flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] px-3 font-code text-sm font-semibold transition-all duration-300',
        map[state],
        className
      )}
    >
      {children}
    </div>
  )
}

/** 节点之间的连接线；加粗 + 琥珀 = 本步新建/走过 */
export function Link({ active }: { active?: boolean }) {
  return (
    <div
      className={cn(
        '-mx-px w-6 shrink-0 rounded-full transition-all duration-300',
        active ? 'h-1 bg-[hsl(var(--amber))]' : 'h-0.5 bg-border'
      )}
    />
  )
}
