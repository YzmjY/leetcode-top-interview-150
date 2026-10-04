export type Difficulty = 'easy' | 'medium' | 'hard'

export interface ProblemMeta {
  num: number
  title: string
  slug: string
  path: string
  chapterDir: string
  hasDemo: boolean
  hasCode: boolean
  difficulty: Difficulty
}

export interface ChapterMeta {
  name: string
  problems: ProblemMeta[]
}

export interface Manifest {
  total: number
  chapters: ChapterMeta[]
}

export interface ProblemContent {
  /** 题目描述 markdown */
  description: string
  /** 思路解析 markdown（已剥离交互演示 iframe 段） */
  analysis: string
  /** Go 代码 */
  code: string
  /** 时间复杂度，如 O(n)，解析失败为 null */
  timeComplexity: string | null
  /** 空间复杂度 */
  spaceComplexity: string | null
}
