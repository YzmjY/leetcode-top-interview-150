/**
 * 旧版演示运行时适配层
 * 复刻 docs/assets/interactive/demo.js 中对演示脚本可见的 API
 * （Demo.el / Demo.esc / Demo.create），但不再创建外壳 ——
 * 外壳由 React 组件 DemoShell 接管，这里只捕获演示配置。
 */

export interface LegacyStep {
  note?: string
  [key: string]: unknown
}

export interface LegacyConfig {
  title: string
  info?: string | ((step: LegacyStep, index: number) => string)
  steps: LegacyStep[]
  desc?: string | ((step: LegacyStep, index: number) => string)
  legend?: { color: string; label: string }[]
  autoMs?: number
  stageHeight?: number
  render?: (step: LegacyStep, index: number, ctx: { stage: HTMLElement }) => void
}

export function esc(value: unknown): string {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function el(tag: string, className?: string | null, html?: string | null): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (html != null) node.innerHTML = html
  return node
}

export interface DemoScope {
  el: typeof el
  esc: typeof esc
  create: (config: LegacyConfig) => void
  __config: LegacyConfig | null
}

/** 每个迁移模块调用一次，拿到自己的 Demo 作用域 */
export function createDemoScope(): DemoScope {
  const scope: DemoScope = {
    el,
    esc,
    __config: null,
    create(config: LegacyConfig) {
      scope.__config = config
    },
  }
  return scope
}
