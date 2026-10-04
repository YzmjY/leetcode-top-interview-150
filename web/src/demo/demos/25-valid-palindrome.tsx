import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import {
  Answer,
  Badges,
  Cell,
  Flag,
  Hint,
  Stat,
  TONE,
  type CellState,
  type Tone,
} from './stage'

/* ------------------------------------------------------------------ */
/* 25. 验证回文串 —— 模式 A：对撞双指针，两侧各自跳过非字母数字字符      */
/* ------------------------------------------------------------------ */

/** 题解示例 2：s = "race a car"（10 字符，8 个字母数字），同时覆盖「跳过」与「提前判非」 */
const S = 'race a car'
const CHARS = S.split('')

function isAlnum(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')
}

/** 题目定义的规范化串：移除所有非字母数字字符并统一转小写 */
const NORM = CHARS.filter(isAlnum).map((c) => c.toLowerCase())

/** 原串下标 → 规范化串下标（非字母数字为 -1），用来把两行字符对齐 */
const NORM_OF = buildNormMap()
function buildNormMap(): number[] {
  const map: number[] = []
  let k = 0
  for (const c of CHARS) map.push(isAlnum(c) ? k++ : -1)
  return map
}

/** 空格在单元格里显示为可见符号，避免看起来像空单元格 */
const vis = (ch: string) => (ch === ' ' ? '␣' : ch)

interface Cmp {
  li: number
  ri: number
  l: string
  r: string
  ok: boolean
}

type Phase = 'init' | 'skip' | 'compare' | 'advance' | 'done'

interface Step {
  left: number
  right: number
  /** 原串每个字符是否已确认配对相等 */
  matched: boolean[]
  /** 原串每个字符是否因非字母数字被跳过 */
  skipped: boolean[]
  /** 已确认相等的镜像对数 */
  pairs: number
  /** 本步正在比较的一对（compare / 判非回文的 done 步可见） */
  cmp: Cmp | null
  /** 本步跳过的非字母数字字符 */
  skip: { i: number; side: 'L' | 'R' } | null
  result: boolean | null
  /** 下一步动作，由 buildSteps 的第二次遍历填写 */
  hint: string
  phase: Phase
  note: string
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const matched = CHARS.map(() => false)
  const skipped = CHARS.map(() => false)
  const steps: Step[] = []
  let left = 0
  let right = n - 1
  let result: boolean | null = null
  let lastCmp: Cmp | null = null

  const snap = (
    phase: Phase,
    note: string,
    extra: { cmp?: Cmp | null; skip?: { i: number; side: 'L' | 'R' } | null } = {}
  ): Step => ({
    left,
    right,
    matched: matched.slice(),
    skipped: skipped.slice(),
    pairs: matched.filter(Boolean).length / 2,
    cmp: extra.cmp ?? null,
    skip: extra.skip ?? null,
    result,
    hint: '',
    phase,
    note,
  })

  steps.push(
    snap(
      'init',
      `s = "${S}"，共 ${n} 个字符，其中 ${NORM.length} 个是字母数字。观察：left = 0、right = ${n - 1} 分别指向首尾，而回文只要求「对称位置上的字母数字字符相等」，不需要真的把字符搬出来。不变量：[0, left) 与 (right, ${n - 1}] 内的有效字符已经两两配对相等，循环体每轮只处理当前这一对。`
    )
  )

  while (left < right) {
    // 左指针跳过非字母数字字符
    while (left < right && !isAlnum(CHARS[left])) {
      steps.push(
        snap(
          'skip',
          `观察：left = ${left} 的 '${vis(CHARS[left])}' 不是字母或数字。判断：它不属于回文比较的对象，留在原位只会挡住后面的有效字符。动作：left 右移到 ${left + 1}；跳过它不改变两侧有效字符的相对顺序。`,
          { skip: { i: left, side: 'L' } }
        )
      )
      skipped[left] = true
      left++
    }
    if (left >= right) break

    // 右指针跳过非字母数字字符
    while (left < right && !isAlnum(CHARS[right])) {
      steps.push(
        snap(
          'skip',
          `观察：左指针已经停在有效字符 '${vis(CHARS[left])}' 上，而 right = ${right} 的 '${vis(CHARS[right])}' 不是字母或数字。判断：它不是字母数字字符，在规范化串里根本不存在，不能拿去比较。动作：right 左移到 ${right - 1}，指向下一个有效字符。`,
          { skip: { i: right, side: 'R' } }
        )
      )
      skipped[right] = true
      right--
    }
    if (left >= right) break

    const l = CHARS[left].toLowerCase()
    const r = CHARS[right].toLowerCase()
    const ok = l === r
    const cmp: Cmp = { li: left, ri: right, l, r, ok }
    lastCmp = cmp

    steps.push(
      snap(
        'compare',
        ok
          ? `观察：left = ${left} 的 '${vis(CHARS[left])}' 与 right = ${right} 的 '${vis(CHARS[right])}' 都是字母数字字符，无需跳过。判断：统一转小写后 '${l}' = '${r}'，这一对镜像位置相等。动作：把它标记为已确认，两指针各向内收拢一格。`
          : `观察：left = ${left} 的 '${vis(CHARS[left])}' 与 right = ${right} 的 '${vis(CHARS[right])}' 都无需跳过，是这一轮要比的一对有效字符。判断：'${l}' ≠ '${r}'，二者在规范化串 "${NORM.join('')}" 中的下标 ${NORM_OF[left]} 与 ${NORM_OF[right]} 互为镜像位置。动作：立即返回 false，其余字符不必再看。`,
        { cmp }
      )
    )

    if (!ok) {
      result = false
      break
    }

    matched[left] = true
    matched[right] = true
    left++
    right--
    steps.push(
      snap(
        'advance',
        `观察：'${l}' 与 '${r}' 已确认相等，规范化串左右两端各配对好 ${matched.filter(Boolean).length / 2} 个字符。动作：left → ${left}、right → ${right}，检查下一对。为什么：只有每一对镜像字符都相等才能判定为回文，必须一对一对往后看。`
      )
    )
  }

  if (result === null) result = true

  steps.push(
    result
      ? snap(
          'done',
          `两个指针相遇或交错，循环正常结束：所有镜像位置上的有效字符都相等，"${S}" 是回文串，返回 true。规范化串 "${NORM.join('')}" 正着读和反着读一样。时间 O(n)：left 单调增、right 单调减，每个字符最多被访问一次；空间 O(n)，来自题解里 []rune(s) 的字符副本。`
        )
      : snap(
          'done',
          `循环在 '${lastCmp?.l}' ≠ '${lastCmp?.r}' 处提前返回，结果是 false，"${S}" 不是回文串。规范化串 "${NORM.join('')}" 的下标 ${lastCmp ? NORM_OF[lastCmp.li] : 0} 与下标 ${lastCmp ? NORM_OF[lastCmp.ri] : 0} 互为镜像位置，字符却不同，所以整理后正着读和反着读并不一样。时间 O(n)：每个字符最多被访问一次；空间 O(n)，来自题解里 []rune(s) 的字符副本。`,
          { cmp: lastCmp }
        )
  )

  return steps.map((s, i) => ({
    ...s,
    hint: i + 1 < steps.length ? hintOf(steps[i + 1]) : '',
  }))
}

/** 把「下一步」翻译成动作描述，供 Hint 显示 */
function hintOf(next: Step): string {
  if (next.phase === 'compare' && next.cmp) {
    return `比较 s[${next.cmp.li}] = '${next.cmp.l}' 与 s[${next.cmp.ri}] = '${next.cmp.r}'`
  }
  if (next.phase === 'advance') {
    return `两指针向内收拢：left → ${next.left}，right → ${next.right}`
  }
  if (next.phase === 'skip' && next.skip) {
    const move = next.skip.side === 'L' ? 'left 右移' : 'right 左移'
    return `${move}跳过 s[${next.skip.i}] = '${vis(CHARS[next.skip.i])}'，它不是字母或数字`
  }
  if (next.phase === 'done') {
    return next.result ? '循环正常结束，返回 true' : '两字符不相等，返回 false'
  }
  return ''
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const m = NORM.length
  const done = step.phase === 'done'
  const nx = step.cmp ? NORM_OF[step.cmp.li] : -1
  const ny = step.cmp ? NORM_OF[step.cmp.ri] : -1
  /** done 步把旗标留在「发现问题的那一对」上，其余步旗标跟着两个指针 */
  const leftFlag = done ? (step.cmp ? step.cmp.li : -1) : step.left
  const rightFlag = done ? (step.cmp ? step.cmp.ri : -1) : step.right

  const flagAt = (i: number, l: number, r: number): { label: string; tone: Tone } | null => {
    const isL = i === l
    const isR = i === r
    if (l < 0 || r < 0) return null
    if (isL && isR) return { label: 'L/R', tone: 'medium' }
    if (isL) return { label: 'L', tone: 'amber' }
    if (isR) return { label: 'R', tone: 'teal' }
    return null
  }

  const charState = (i: number): CellState => {
    if (step.cmp && (i === step.cmp.li || i === step.cmp.ri)) return step.cmp.ok ? 'ok' : 'bad'
    if (done) return step.matched[i] ? 'ok' : step.skipped[i] ? 'dim' : 'idle'
    if (step.matched[i]) return 'ok'
    if (i === step.left) return 'active'
    if (i === step.right) return 'new'
    if (step.skipped[i]) return 'dim'
    return 'idle'
  }

  /** 规范化串：两端已确认的区域 + 当前比较对 */
  const normState = (j: number): CellState => {
    if (step.cmp && (j === nx || j === ny)) return step.cmp.ok ? 'ok' : 'bad'
    if (j < step.pairs || j >= m - step.pairs) return 'ok'
    return 'idle'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 第一行：原始串，旗标在格上、下标在格下 */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">原始串 s（␣ 表示空格，旗标为两个对撞指针）</span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {CHARS.map((ch, i) => {
            const f = flagAt(i, leftFlag, rightFlag)
            return (
              <div key={i} className="flex flex-col items-center">
                <Flag label={f?.label} tone={f?.tone ?? 'muted'} />
                <Cell state={charState(i)}>
                  {vis(ch)}
                </Cell>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 第二行：规范化串（去非字母数字 + 转小写），绿=已配对，红=不相等 */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">规范化串（移除非字母数字并转小写）</span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {NORM.map((ch, j) => {
            const f = flagAt(j, nx, ny)
            return (
              <div key={j} className="flex flex-col items-center">
                <Flag label={f?.label} tone={f?.tone ?? 'muted'} />
                <Cell state={normState(j)} size="sm">
                  {ch}
                </Cell>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{j}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="left" value={step.left} tone="amber" />
        <Stat label="right" value={step.right} tone="teal" />
        {done ? (
          <Answer>
            {step.result ? (
              'true：所有镜像位置上的有效字符都相等'
            ) : (
              <>
                false：
                <span className="font-code">
                  s[{step.cmp!.li}] = '{step.cmp!.l}'
                </span>
                <span className="mx-1">≠</span>
                <span className="font-code">
                  s[{step.cmp!.ri}] = '{step.cmp!.r}'
                </span>
              </>
            )}
          </Answer>
        ) : (
          <Hint tone={step.phase === 'compare' && step.cmp && !step.cmp.ok ? 'hard' : 'teal'}>
            {step.hint}
          </Hint>
        )}
      </Badges>
    </div>
  )
}

export default function ValidPalindromeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="对撞双指针跳过非字母数字"
      info={`输入：s = "${S}"（题解示例 2）。示例 1 需 30 个字符、30 步以上，这里取更小且同样覆盖「跳过空格」与「不相等提前返回」的示例 2，结论为 false；规范化后得到 "${NORM.join('')}"。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'L 指针：自左向右，跳过非字母数字' },
        { color: TONE.teal, label: 'R 指针：自右向左，跳过非字母数字' },
        { color: TONE.easy, label: '已确认相等 / 本对相等' },
        { color: TONE.hard, label: '不相等 → 判非回文' },
        { color: TONE.muted, label: '非字母数字字符（已跳过）' },
      ]}
    />
  )
}
