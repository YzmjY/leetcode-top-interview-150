import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 19. 最后一个单词的长度 —— 模式 A：字符行 + 从右向左的单个 index 指针  */
/* 第一个循环跳过尾随空格，第二个循环从右向左数到空格或串首。            */
/* ------------------------------------------------------------------ */

/** 题解示例 2：三个官方示例中唯一带尾随空格的，正好同时覆盖「跳空格」与「计数」两个循环 */
const S = '   fly me   to   the moon  '
const CHARS = S.split('')

interface Step {
  /** 当前下标：两个循环都从右向左移动 */
  index: number
  /** 已统计到的最后一个单词字符数 */
  length: number
  /** 最后一个单词的右端下标；尚未定位为 −1 */
  wordEnd: number
  /** 已统计区间的最左下标；尚未定位为 −1 */
  wordStart: number
  phase: 'init' | 'skip' | 'count' | 'done'
  note: string
  /** 下一步动作（Hint 文案） */
  hint: string
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const steps: Step[] = []
  let index = n - 1
  let length = 0
  let wordEnd = -1
  let wordStart = -1

  steps.push({
    index,
    length,
    wordEnd,
    wordStart,
    phase: 'init',
    note: `观察：s 共 ${n} 个字符，index 从最右端下标 ${index} 出发，length = 0。判断：串尾是空格，而空格不属于任何单词。动作：先用第一个循环向左跳过尾随空格，再开始计数 —— 不变量是 index 右侧的字符都已扫描完毕。`,
    hint: `检查 s[${index}] 是否为空格，是就跳过`,
  })

  // 第一个循环：跳过尾随空格（尾随空格可以不止一个）
  while (index >= 0 && CHARS[index] === ' ') {
    const next = index - 1
    const skipped = n - index // 这是第几个被跳过的尾随空格
    steps.push({
      index,
      length: 0,
      wordEnd: -1,
      wordStart: -1,
      phase: 'skip',
      note:
        skipped === 1
          ? `观察：s[${index}] = ' '，它右边就是串尾。判断：这是尾随空格，不属于任何单词。动作：index 左移到 ${next}，length 保持 0 —— 空格永不计入单词长度。`
          : `观察：s[${index}] = ' '，尾随空格不止一个。判断：必须用循环连续跳过，只左移一次会停在空格上。动作：index 再左移到 ${next}。`,
      hint:
        next < 0
          ? 'index 已到串首左侧，跳过尾随空格的循环结束'
          : CHARS[next] === ' '
            ? `index 左移到 ${next}，继续检查 s[${next}]`
            : `index 左移到 ${next}，它是字母，转入计数`,
    })
    index--
  }

  // 第二个循环：从右向左统计最后一个单词的字符数
  wordEnd = index
  while (index >= 0 && CHARS[index] !== ' ') {
    length++
    wordStart = index
    const ch = CHARS[index]
    const next = index - 1
    const boundary = next >= 0 && CHARS[next] === ' '
    const whyCount = boundary
      ? `左边 s[${next}] 是空格，它就是单词的左边界`
      : next < 0
        ? '已经数到串首，单词从下标 0 一直延伸到这里'
        : '还没遇到空格，仍在最后一个单词内部'
    steps.push({
      index,
      length,
      wordEnd,
      wordStart,
      phase: 'count',
      note:
        length === 1
          ? `观察：s[${index}] = '${ch}' 是字母。判断：这是从右往左第一个非空格字符，说明尾随空格已跳完，它就是最后一个单词的最后一个字符（wordEnd = ${index}）。动作：length 累加到 1，index 左移到 ${next} 继续数。`
          : `观察：s[${index}] = '${ch}' 仍是字母。判断：${whyCount}。动作：length 累加到 ${length}，index 左移到 ${next}。`,
      hint: boundary
        ? `index 左移到 ${next} 的空格上，停止计数`
        : next < 0
          ? `index 左移到 ${next}，已到串首左侧，计数结束`
          : `index 左移到 ${next}，length 继续累加`,
    })
    index--
  }

  const word = S.slice(wordStart, wordEnd + 1)
  const stop =
    index < 0 ? `index 已越过串首（${index}）` : `index 停在 s[${index}] 的空格上，没有越界`
  steps.push({
    index,
    length,
    wordEnd,
    wordStart,
    phase: 'done',
    note: `观察：${stop}，最后一个单词占据下标 [${wordStart}, ${wordEnd}]。判断：空格是单词的左边界，第二个循环一遇到空格（或越界）就停止计数。动作：答案 length = ${length}，最后一个单词是 "${word}"。每个字符至多被两个循环之一访问一次，时间 O(n)；只用了 index 和 length 两个变量，空间 O(1)。`,
    hint: '',
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const PHASE_LABEL: Record<Step['phase'], string> = {
  init: '准备：从右端出发',
  skip: '第一个循环：跳过尾随空格',
  count: '第二个循环：统计单词长度',
  done: '完成：最后一个单词已定位',
}

function cellStateOf(i: number, step: Step): CellState {
  if (i === step.index) return 'active'
  if (step.wordStart >= 0 && i >= step.wordStart && i <= step.wordEnd) return 'ok'
  if (i > step.index) return 'warn'
  return 'dim'
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const word = step.wordStart >= 0 ? S.slice(step.wordStart, step.wordEnd + 1) : ''

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 字符行：从左到右排布，index 旗标从右端向左移动；下标在格下 */}
      <div className="flex w-full flex-wrap items-start justify-center gap-1">
        {CHARS.map((ch, i) => (
          <div key={i} className="flex flex-col items-center">
            <Flag label={i === step.index ? 'index' : undefined} tone="amber" />
            <Cell size="sm" state={cellStateOf(i, step)}>
              {ch === ' ' ? '␣' : ch}
            </Cell>
            <span className="mt-1 font-code text-[10px] text-ink-soft">{i}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="index" value={step.index} tone="amber" />
        <Stat label="length" value={step.length} tone="easy" />
        <Badge>{PHASE_LABEL[step.phase]}</Badge>
        {done ? (
          <Answer>
            {`最后一个单词 "${word}" 的长度 = `}
            <span className="font-code">{step.length}</span>
          </Answer>
        ) : (
          <Hint>{step.hint}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function LengthOfLastWordDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="从右向左：跳过尾随空格再数最后一个单词"
      info={`s = "${S}"（题解示例 2），预期输出 4；空格格显示为 ␣。选用示例 2 而不是示例 1/3，是因为只有它带尾随空格，能同时看到「跳过尾随空格」与「统计单词长度」两个循环。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'index：当前指向的字符' },
        { color: TONE.easy, label: '已计入 length 的单词字符' },
        { color: TONE.medium, label: '已跳过的尾随空格' },
        { color: TONE.muted, label: '尚未扫描的字符' },
      ]}
    />
  )
}
