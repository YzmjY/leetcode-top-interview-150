import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DemoLegendItem {
  color: string
  label: string
}

export interface DemoShellProps<T> {
  title: string
  /** 静态或随步骤变化的信息条（可含 HTML，见 html 选项） */
  info?: string | ((step: T, index: number) => string)
  steps: T[]
  /** 每步的舞台渲染 */
  renderStep: (step: T, index: number) => ReactNode
  /** 每步的解说文字 */
  describe: (step: T, index: number) => string
  /** 解说 / 信息条按 HTML 渲染（用于迁移的 legacy 演示） */
  html?: boolean
  legend?: DemoLegendItem[]
  autoMs?: number
  /** 舞台最小高度（px） */
  stageMinHeight?: number
}

/**
 * 交互演示统一运行时（React 版）
 * 负责外壳与交互：步骤徽章、播放控制、解说、进度、图例、键盘快捷键。
 * 各题目演示只需提供「步骤数据 + 舞台渲染」。
 */
export function DemoShell<T>({
  title,
  info,
  steps,
  renderStep,
  describe,
  html = false,
  legend,
  autoMs = 1100,
  stageMinHeight,
}: DemoShellProps<T>) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = steps.length
  const last = total - 1

  const stop = useCallback(() => {
    setPlaying(false)
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => stop, [stop])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= last) {
          stop()
          return i
        }
        return i + 1
      })
    }, autoMs)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, autoMs, last, stop])

  const go = useCallback(
    (i: number) => {
      stop()
      setIndex(Math.max(0, Math.min(last, i)))
    },
    [last, stop]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(index + 1)
    } else if (e.key === ' ') {
      e.preventDefault()
      setPlaying((p) => (index >= last ? p : !p))
    }
  }

  const step = steps[index]
  const note = useMemo(() => describe(step, index), [step, index, describe])
  const infoText = useMemo(
    () => (typeof info === 'function' ? info(step, index) : info),
    [info, step, index]
  )

  const btn =
    'inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-[hsl(var(--amber))]/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border'

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm outline-none ring-[hsl(var(--amber))]/40 focus-visible:ring-2"
    >
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--amber))]" />
          <span className="text-sm font-semibold text-ink">{title}</span>
        </div>
        <span className="rounded-full border border-border bg-card px-2.5 py-0.5 font-code text-xs text-ink-soft">
          步骤 {index + 1} / {total}
        </span>
      </div>

      {infoText && (
        <div className="demo-info border-b border-border px-4 py-2 text-xs leading-relaxed text-ink-soft [&_code]:rounded [&_code]:bg-[hsl(var(--amber-soft))] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-code [&_code]:text-[hsl(var(--amber))] [&_strong]:text-ink">
          {html ? <span dangerouslySetInnerHTML={{ __html: infoText }} /> : infoText}
        </div>
      )}

      {/* 舞台 */}
      <div
        className="demo-stage bg-paper px-4 py-5 sm:px-6"
        style={stageMinHeight ? { minHeight: stageMinHeight } : undefined}
      >
        {renderStep(step, index)}
      </div>

      {/* 解说 */}
      <div className="border-t border-border px-4 py-3">
        <p className="min-h-[3.2em] text-[13px] leading-relaxed text-ink-soft [&_code]:rounded [&_code]:bg-[hsl(var(--amber-soft))] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-code [&_code]:text-[hsl(var(--amber))] [&_strong]:font-semibold [&_strong]:text-ink">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[hsl(var(--amber))] font-code text-[11px] font-bold text-white align-middle">
            {index + 1}
          </span>
          {html ? <span dangerouslySetInnerHTML={{ __html: note }} /> : note}
        </p>
      </div>

      {/* 进度条 */}
      <div className="flex h-1.5 w-full gap-px bg-border/60">
        {steps.map((_, i) => (
          <button
            key={i}
            aria-label={`跳到第 ${i + 1} 步`}
            onClick={() => go(i)}
            className={cn(
              'h-full flex-1 transition-colors',
              i <= index ? 'bg-[hsl(var(--amber))]' : 'bg-transparent hover:bg-[hsl(var(--amber))]/30'
            )}
          />
        ))}
      </div>

      {/* 控制区 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button className={btn} onClick={() => go(0)} disabled={index === 0}>
            <RotateCcw className="h-3.5 w-3.5" /> 重置
          </button>
          <button className={btn} onClick={() => go(index - 1)} disabled={index === 0}>
            <ChevronLeft className="h-3.5 w-3.5" /> 上一步
          </button>
          <button
            className={cn(
              btn,
              'border-[hsl(var(--amber))] bg-[hsl(var(--amber))] text-white hover:bg-[hsl(var(--amber))]/90 hover:text-white'
            )}
            onClick={() => (index >= last ? go(0) : setPlaying((p) => !p))}
          >
            {playing ? (
              <>
                <Pause className="h-3.5 w-3.5" /> 暂停
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> {index >= last ? '重新播放' : '自动播放'}
              </>
            )}
          </button>
          <button className={btn} onClick={() => go(index + 1)} disabled={index === last}>
            下一步 <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button className={btn} onClick={() => go(last)} disabled={index === last}>
            <SkipForward className="h-3.5 w-3.5" /> 最后
          </button>
        </div>
        {legend && legend.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
