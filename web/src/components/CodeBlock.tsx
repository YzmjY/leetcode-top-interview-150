import { useMemo, useState } from 'react'
import { Check, Copy, FileCode2 } from 'lucide-react'
import { hljs } from './Markdown'

/** Go 代码展示块：暗色编辑器风格 + 复制按钮 */
export function CodeBlock({ code, lang = 'go' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  const html = useMemo(() => {
    try {
      return hljs.highlight(code, { language: lang }).value
    } catch {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    }
  }, [code, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard 不可用时静默 */
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-[hsl(var(--code-bg))] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <FileCode2 className="h-3.5 w-3.5" />
          <span className="font-code">{lang}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="code-view rounded-none p-5">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
