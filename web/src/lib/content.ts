import type { ChapterMeta, Manifest, ProblemContent, ProblemMeta } from './types'
import manifestJson from '../data/manifest.json'

export const manifest = manifestJson as Manifest

/** 扁平化的题目列表（按题号） */
export const allProblems: ProblemMeta[] = manifest.chapters
  .flatMap((c) => c.problems)
  .sort((a, b) => a.num - b.num)

export const problemByNum = new Map(allProblems.map((p) => [p.num, p]))

export function chapterOf(problem: ProblemMeta): ChapterMeta | undefined {
  return manifest.chapters.find((c) => c.problems.some((p) => p.num === problem.num))
}

/** Vite 在构建期把所有 markdown 作为 raw 字符串打包 */
const rawFiles = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function rawOf(meta: ProblemMeta): string | null {
  const key = `../content/${meta.chapterDir}/${meta.slug}.md`
  return rawFiles[key] ?? null
}

const contentCache = new Map<number, ProblemContent>()

/** 解析单篇题解 markdown 为结构化内容 */
export function getProblemContent(num: number): ProblemContent | null {
  if (contentCache.has(num)) return contentCache.get(num)!
  const meta = problemByNum.get(num)
  if (!meta) return null
  const raw = rawOf(meta)
  if (!raw) return null

  // 去掉一级标题
  const body = raw.replace(/^#[^\n]*\n+/, '')

  // 按二级标题切分
  const sections: Record<string, string> = {}
  const parts = body.split(/^## /m)
  for (const part of parts) {
    if (!part.trim()) continue
    const nl = part.indexOf('\n')
    const head = (nl === -1 ? part : part.slice(0, nl)).trim()
    const content = nl === -1 ? '' : part.slice(nl + 1)
    sections[head] = content.trim()
  }

  const description = sections['题目描述'] ?? ''

  // 题目分析：剥离「交互演示」小节（iframe 嵌入段）
  let analysis = sections['题目分析'] ?? ''
  analysis = analysis.split(/^### 交互演示/m)[0].trim()

  // Go 代码
  const codeMatch = raw.match(/```go\r?\n([\s\S]*?)```/)
  const code = codeMatch ? codeMatch[1].trimEnd() : ''

  const time = raw.match(/时间复杂度[：:\* ]+\**O\(([^)\n]+)\)\**/)
  const space = raw.match(/空间复杂度[：:\* ]+\**O\(([^)\n]+)\)\**/)

  const result: ProblemContent = {
    description,
    analysis,
    code,
    timeComplexity: time ? `O(${time[1].trim()})` : null,
    spaceComplexity: space ? `O(${space[1].trim()})` : null,
  }
  contentCache.set(num, result)
  return result
}

export const difficultyLabel = { easy: '简单', medium: '中等', hard: '困难' } as const
