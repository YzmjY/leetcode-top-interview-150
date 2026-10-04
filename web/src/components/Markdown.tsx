import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import go from 'highlight.js/lib/languages/go'

hljs.registerLanguage('go', go)

const md = new MarkdownIt({
  html: false,
  linkify: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch {
        /* fallthrough */
      }
    }
    return ''
  },
})

/** 渲染题解 markdown 正文（题目描述 / 思路解析） */
export function Markdown({ children }: { children: string }) {
  const html = useMemo(() => md.render(children), [children])
  return <div className="lc-prose" dangerouslySetInnerHTML={{ __html: html }} />
}

export { hljs }
