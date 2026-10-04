import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { Sparkles } from 'lucide-react'
import { legacyModules } from './legacy/modules'
import type { LegacyConfig } from './legacy/runtime'

/**
 * 可视化注册表：题号 → 演示。
 * - native：手工重构的 React 演示（优先）
 * - legacy：从旧版 iframe 演示自动迁移的模块（经统一新外壳渲染）
 *
 * ★ native 表由文件名自动生成：`demos/<题号>-<slug>.tsx`（与 docs/ 和 legacy/gen/ 同一套 slug）。
 *   新增一道精修题 = 在 demos/ 里放一个符合命名的文件，本文件无需改动。
 *   non-数字开头的文件（如 stage.tsx）会被忽略。
 *
 * ★ lazy() 必须在此处（模块作用域）只调用一次。若写在渲染期（组件函数体内），每次渲染
 *   都会生成一个新的组件类型，Suspense 反复挂起，React Router 的 startTransition 导航
 *   就永远无法提交 —— 表现为地址栏变了但页面停在原处。
 */
const demoModules = import.meta.glob<{ default: ComponentType }>('./demos/*.tsx')

const native: Record<number, LazyExoticComponent<ComponentType>> = {}
for (const [path, load] of Object.entries(demoModules)) {
  const matched = /^\.\/demos\/(\d+)-/.exec(path)
  if (matched) native[Number(matched[1])] = lazy(load)
}

const LazyLegacy = lazy(() => import('./legacy/LegacyDemo'))

export function hasNativeDemo(num: number): boolean {
  return num in native
}

export function hasDemo(num: number): boolean {
  return num in native || num in legacyModules
}

function LegacyLoader({ num }: { num: number }) {
  const [config, setConfig] = useState<LegacyConfig | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setConfig(null)
    setFailed(false)
    legacyModules[num]!()
      .then((m) => {
        if (alive) setConfig(m.default())
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [num])

  if (failed) return <Placeholder reason="演示加载失败" />
  if (!config) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card text-sm text-ink-soft">
        演示加载中…
      </div>
    )
  }
  return (
    <Suspense fallback={null}>
      <LazyLegacy config={config} />
    </Suspense>
  )
}

function Placeholder({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-14 text-center">
      <Sparkles className="h-6 w-6 text-[hsl(var(--amber))]" />
      <p className="text-sm font-medium text-ink">{reason}</p>
    </div>
  )
}

export function VizSlot({ num }: { num: number }) {
  const Demo = native[num]
  if (Demo) {
    return (
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-sm text-ink-soft">
            演示加载中…
          </div>
        }
      >
        <Demo />
      </Suspense>
    )
  }
  if (legacyModules[num]) return <LegacyLoader num={num} />
  return <Placeholder reason="本题暂无交互演示" />
}
