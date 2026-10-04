import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 13. 除自身以外数组的乘积 —— 模式 H：一维单元格行 + 依赖弧线            */
/* answer 先复用为前缀积草稿，第二趟从右到左乘上滚动的 suffix。           */
/* ------------------------------------------------------------------ */

/** 示例输入：题解示例 1，n = 4 规模最小，两趟扫描的每一步都看得清 */
const NUMS = [1, 2, 3, 4]
const N = NUMS.length

/** 弧线画布坐标：与下方单元格行同一个容器宽度，xOf 按格子序号线性换算 */
const W = 700
const ARC_H = 84
const BASE_Y = ARC_H - 3

interface Step {
  /** answer 快照：第一趟只存前缀积，第二趟就地乘上后缀积；null = 还没算到 */
  answer: (number | null)[]
  /** 第二趟本步乘入的 suffix（更新之前的值）；第一趟固定为 1 */
  suffix: number
  /** 第二趟本步相乘前 answer[i] 里的前缀积；其余阶段为 null */
  pre: number | null
  /** 本步的当前下标；init / done 为 -1 */
  i: number
  phase: 'init' | 'prefix' | 'suffix' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const answer = new Array<number | null>(N).fill(null)
  const steps: Step[] = []

  const snap = (i: number, suffix: number, phase: Step['phase'], note: string) => {
    steps.push({ answer: answer.slice(), suffix, pre: null, i, phase, note })
  }

  snap(
    -1,
    1,
    'init',
    `初始化：nums = [${NUMS.join(', ')}]（题解示例 1），要求不使用除法。观察：answer[i] 恰好等于「i 左侧所有元素的乘积」乘上「i 右侧所有元素的乘积」，两侧各扫一遍即可，answer 数组本身可以当草稿纸。判断：第一趟从左到右只写前缀积，第二趟从右到左滚动一个 suffix 变量乘回去；不变量是「处理下标 i 之前 suffix == nums[i+1] × … × nums[n-1]」，所以 suffix 从 1 开始。`
  )

  answer[0] = 1
  snap(
    0,
    1,
    'prefix',
    `第一趟从左到右，i = 0：观察下标 0 左侧没有任何元素，空前缀积规定为 1。判断：answer[0] 写成 1，下一格才能只乘一次 nums[0] 就得到前缀积，写成 0 会让整行结果为 0。动作：answer[0] = 1，它表示 nums 中下标 0 之前（空区间）的乘积。`
  )

  for (let i = 1; i < N; i++) {
    const left = answer[i - 1]!
    const mult = NUMS[i - 1]
    answer[i] = left * mult
    snap(
      i,
      1,
      'prefix',
      `第一趟从左到右，i = ${i}：观察 answer[${i - 1}] = ${left}，已经是「下标 ${i - 1} 左侧所有元素的乘积」。判断：下标 ${i} 的左侧只比它多出 nums[${i - 1}] = ${mult} 这一个元素，所以一次乘法就够。动作：answer[${i}] = ${left} × ${mult} = ${answer[i]}，不必对每个下标重新连乘。`
    )
  }

  let suffix = 1
  for (let i = N - 1; i >= 0; i--) {
    const pre = answer[i]!
    const used = suffix
    answer[i] = pre * used
    suffix *= NUMS[i]

    const see =
      i === N - 1
        ? `观察 suffix = 1，因为下标 ${i} 右侧一个元素都没有，空后缀积规定为 1。`
        : `观察 suffix = ${used}，等于 nums[${i + 1}..${N - 1}] 的乘积，正是下标 ${i} 右侧所有元素的乘积。`
    const tail =
      i === 0
        ? `随后 suffix 变成 ${used} × nums[0] = ${suffix}，但左侧已没有下标，这个值不会再被用到`
        : `随后 suffix 更新为 ${used} × nums[${i}] = ${suffix}，供更左边的下标使用`
    steps.push({
      answer: answer.slice(),
      suffix: used,
      pre,
      i,
      phase: 'suffix',
      note: `${see}判断：前缀积已经写在格内，再乘一次 suffix，answer[${i}] 就同时含了左右两侧、却不含 nums[${i}] 自己。动作：answer[${i}] = ${pre} × ${used} = ${answer[i]}，答案定型；${tail}。`,
    })
  }

  snap(
    -1,
    suffix,
    'done',
    `结论：answer = [${answer.join(', ')}]，每个位置都是除自身以外其余元素的乘积。两次线性扫描各只做 O(1) 工作，时间 O(n)；除输出数组外只用到 suffix 一个变量，额外空间 O(1)，全程没有除法。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 一条依赖弧线：从 from 弯到 to，末端箭头指向 to（to 即当前正在更新的格） */
function DepArc({ from, to, label, color }: { from: number; to: number; label: string; color: string }) {
  const mid = (from + to) / 2
  return (
    <g>
      <path
        d={`M ${from} ${BASE_Y} Q ${mid} ${BASE_Y - 40} ${to} ${BASE_Y}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={mid}
        y={16}
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        className="font-code"
        fill={color}
      >
        {label}
      </text>
      <path d={`M ${to - 8} ${BASE_Y - 9} L ${to + 8} ${BASE_Y - 9} L ${to} ${BASE_Y + 3} z`} fill={color} />
    </g>
  )
}

/** 空区间标记：从行外虚线指向当前格，说明这一步用的是空乘积 1 */
function EmptyMarker({ side, to, text }: { side: 'left' | 'right'; to: number; text: string }) {
  const lineFrom = side === 'left' ? 6 : W - 6
  const headX = side === 'left' ? to - 18 : to + 18
  const tipX = side === 'left' ? to - 6 : to + 6
  return (
    <g>
      <path
        d={`M ${lineFrom} ${BASE_Y} L ${headX} ${BASE_Y}`}
        fill="none"
        stroke="hsl(var(--ink-soft))"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <path d={`M ${headX} ${BASE_Y - 6} L ${headX} ${BASE_Y + 6} L ${tipX} ${BASE_Y} z`} fill="hsl(var(--ink-soft))" />
      <text
        x={side === 'left' ? 10 : W - 10}
        y={BASE_Y - 14}
        textAnchor={side === 'left' ? 'start' : 'end'}
        fontSize="19"
        fontWeight="700"
        className="font-code"
        fill="hsl(var(--ink-soft))"
      >
        {text}
      </text>
    </g>
  )
}

function Stage(step: Step) {
  const cur = step.i
  /** 第 k 个格子的中心 x：格子序号线性换算，绝不写死像素 */
  const xOf = (k: number) => ((k + 0.5) / N) * W

  const numsState = (k: number): CellState => {
    if (step.phase === 'done' || step.phase === 'init') return 'idle'
    if (k === cur) return 'active'
    // 第一趟本步乘入的 nums[i-1]
    if (step.phase === 'prefix' && k === cur - 1) return 'new'
    return 'idle'
  }

  const answerState = (k: number): CellState => {
    if (step.phase === 'done') return 'ok'
    if (step.phase === 'init') return 'dim'
    if (k === cur) return 'active'
    if (step.phase === 'prefix') return k < cur ? 'new' : 'dim'
    return k > cur ? 'ok' : 'new'
  }

  /** 格下文字标签：状态不靠颜色单独区分 */
  const tagOf = (k: number): { text: string; color: string } => {
    if (step.phase === 'done') return { text: '答案', color: TONE.easy }
    if (step.phase === 'prefix' && k === cur) return { text: '本步写入', color: TONE.amber }
    if (step.phase === 'suffix' && k === cur) return { text: '× 后缀积', color: TONE.amber }
    if (step.phase === 'suffix' && k > cur) return { text: '已定型', color: TONE.easy }
    if (step.phase !== 'init' && k < cur) return { text: '前缀积', color: TONE.teal }
    return { text: '待算', color: 'hsl(var(--ink-soft))' }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 两张行与弧线共用同一容器宽度，xOf 换算才与格心对齐 */}
      <div className="w-full max-w-[480px]">
        {/* 原始数组：旗标标出当前下标 i，第一趟同时高亮本步乘入的 nums[i-1] */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
          {NUMS.map((v, k) => (
            <div key={k} className="flex min-w-0 flex-col items-center gap-1">
              <Flag label={cur >= 0 && k === cur ? 'i' : undefined} tone="amber" />
              <Cell state={numsState(k)} className="w-full min-w-0 max-w-[52px] sm:max-w-[64px]">
                {v}
              </Cell>
              <span className="font-code text-[11px] text-ink-soft">nums[{k}]</span>
            </div>
          ))}
        </div>

        {/* 依赖弧线：第一趟来自左邻的前缀积，第二趟来自右邻滚下来的 suffix */}
        <svg viewBox={`0 0 ${W} ${ARC_H}`} className="w-full select-none">
          {step.phase === 'prefix' && cur >= 1 && (
            <DepArc from={xOf(cur - 1)} to={xOf(cur)} label={`answer[${cur - 1}]`} color={TONE.teal} />
          )}
          {step.phase === 'suffix' && cur <= N - 2 && (
            <DepArc from={xOf(cur + 1)} to={xOf(cur)} label={`suffix ${step.suffix}`} color={TONE.easy} />
          )}
          {step.phase === 'prefix' && cur === 0 && (
            <EmptyMarker side="left" to={xOf(0)} text="左侧无元素 · 空前缀 = 1" />
          )}
          {step.phase === 'suffix' && cur === N - 1 && (
            <EmptyMarker side="right" to={xOf(N - 1)} text="右侧无元素 · 空后缀 = 1" />
          )}
        </svg>

        {/* answer 行：格内是当前 answer 值，格下是下标与状态文字 */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
          {step.answer.map((v, k) => {
            const tag = tagOf(k)
            return (
              <div key={k} className="flex min-w-0 flex-col items-center gap-1">
                <Cell state={answerState(k)} className="w-full min-w-0 max-w-[52px] sm:max-w-[64px]">
                  {v === null ? '?' : v}
                </Cell>
                <span className="font-code text-[11px] text-ink-soft">answer[{k}]</span>
                <span className="h-4 font-code text-[10px] font-bold" style={{ color: tag.color }}>
                  {tag.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Badge tone="teal">第一趟：从左到右算前缀积 →</Badge>
            <Badge>不使用除法 · answer 复用为草稿纸</Badge>
            <Hint>从 i = 0 开始，令 answer[0] = 1（空前缀积为 1）</Hint>
          </>
        )}

        {step.phase === 'prefix' && (
          <>
            <Badge tone="teal">第一趟 · 从左到右 → · i = {cur}</Badge>
            {cur >= 1 && <Stat label={`answer[${cur - 1}]`} value={step.answer[cur - 1]} tone="teal" />}
            <Stat label={`answer[${cur}]`} value={step.answer[cur]} tone="amber" />
            <Hint>
              {cur + 1 < N
                ? `i 右移到 ${cur + 1}，answer[${cur + 1}] = answer[${cur}] × nums[${cur}] = ${step.answer[cur]! * NUMS[cur]}`
                : `第一趟结束，切到第二趟：suffix 从 1 开始处理 i = ${N - 1}`}
            </Hint>
          </>
        )}

        {step.phase === 'suffix' && (
          <>
            <Badge tone="easy">第二趟 · 从右到左乘后缀积 ←</Badge>
            <Stat label={`前缀积 answer[${cur}]`} value={step.pre} tone="teal" />
            <Stat label="suffix" value={step.suffix} tone="easy" />
            <Hint>
              {cur > 0
                ? `i 左移到 ${cur - 1}，用更新后的 suffix = ${step.suffix * NUMS[cur]} 去乘 answer[${cur - 1}]`
                : `两趟扫描结束，读出 answer = [${step.answer.join(', ')}]`}
            </Hint>
          </>
        )}

        {step.phase === 'done' && (
          <>
            <Stat label="n" value={N} />
            <Answer>answer = [{step.answer.join(', ')}]</Answer>
            <Badge>时间 O(n) · 额外空间 O(1)（除输出数组外只用 suffix）</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function ProductOfArrayExceptSelfDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="前缀积 × 后缀积，两趟扫描"
      info={`输入：nums = [${NUMS.join(', ')}]（题解示例 1，期望输出 [24, 12, 8, 6]）。answer 先复用为前缀积草稿，第二趟从右到左乘上滚动的 suffix，全程不使用除法。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前下标 i 与本步更新的 answer[i]' },
        { color: TONE.teal, label: '第一趟：前缀积 / 本步乘入的 nums[i-1]' },
        { color: TONE.easy, label: '两侧都乘完，答案定型' },
        { color: TONE.muted, label: '尚未计算' },
      ]}
    />
  )
}
