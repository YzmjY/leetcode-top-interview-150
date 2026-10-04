import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 6. 轮转数组 —— 模式 A：数组 + 指针（区间底色块变体，三次反转法）      */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums = [1,2,3,4,5,6,7]，k = 3，答案 [5,6,7,1,2,3,4] */
const NUMS = [1, 2, 3, 4, 5, 6, 7]
const K = 3

type Phase = 'init' | 'reverse-all' | 'reverse-prefix' | 'reverse-suffix' | 'done'
type ReversePhase = Exclude<Phase, 'init' | 'done'>

const PHASE_ORDER: ReversePhase[] = ['reverse-all', 'reverse-prefix', 'reverse-suffix']

const PHASE_TAG: Record<ReversePhase, string> = {
  'reverse-all': '① 整体反转 [0, n−1]',
  'reverse-prefix': '② 反转前 k 个 [0, k−1]',
  'reverse-suffix': '③ 反转后 n−k 个 [k, n−1]',
}

interface Swap {
  phase: ReversePhase
  l: number
  r: number
  i: number
  j: number
}

/** 按题解顺序收集三次反转的全部对撞交换：reverse(0,n−1) → reverse(0,k−1) → reverse(k,n−1) */
function collectSwaps(n: number, k: number): Swap[] {
  const list: Swap[] = []
  const walk = (phase: ReversePhase, l: number, r: number) => {
    for (let i = l, j = r; i < j; i++, j--) {
      list.push({ phase, l, r, i, j })
    }
  }
  walk('reverse-all', 0, n - 1)
  walk('reverse-prefix', 0, k - 1)
  walk('reverse-suffix', k, n - 1)
  return list
}

interface Step {
  /** 本步结束后的数组快照 */
  nums: number[]
  phase: Phase
  /** 当前正在反转的闭区间 [l, r]；init / done 为 null */
  l: number | null
  r: number | null
  /** 本步刚交换的两个位置；非交换步为 null */
  i: number | null
  j: number | null
  swapsDone: number
  swapsTotal: number
  /** 下一步动作提示；done 步为 null */
  hint: string | null
  note: string
}

function buildSteps(): Step[] {
  const nums = NUMS.slice()
  const n = nums.length
  const k = K % n
  const swapList = k === 0 ? [] : collectSwaps(n, k)
  const total = swapList.length
  const steps: Step[] = []
  let done = 0

  const segA = nums.slice(0, n - k)
  const segB = nums.slice(n - k)
  const first = swapList[0]

  steps.push({
    nums: nums.slice(),
    phase: 'init',
    l: null,
    r: null,
    i: null,
    j: null,
    swapsDone: 0,
    swapsTotal: total,
    hint: first ? `${PHASE_TAG[first.phase]}，交换 nums[${first.i}] 与 nums[${first.j}]` : 'k = 0，数组无需改动',
    note: `初始化：n = ${n}，k = ${K} % ${n} = ${k}（k < n，取模不改变 k，也不会出现 k − 1 越界）。前段 A = nums[0..${n - k - 1}] = [${segA.join(', ')}] 长 ${n - k}，后段 B = nums[${n - k}..${n - 1}] = [${segB.join(', ')}] 长 ${k}，右移 ${k} 位就是把 AB 变成 BA。三次反转全程只做对撞交换，顺序固定为整体 [0, ${n - 1}] → 前 k 个 [0, ${k - 1}] → 后 n−k 个 [${k}, ${n - 1}]，两处边界都由下标 k = ${k} 决定。`,
  })

  swapList.forEach((sw, idx) => {
    const { l, r, i, j, phase } = sw
    const leftVal = nums[i]
    const rightVal = nums[j]
    nums[i] = rightVal
    nums[j] = leftVal
    done++

    const ni = i + 1
    const nj = j - 1
    const samePhaseLeft = swapList.slice(idx + 1).filter((s) => s.phase === phase).length
    const next = swapList[idx + 1]

    let why: string
    if (samePhaseLeft > 0) {
      why = `为什么：每对首尾交换都把区间的一端固定下来，${PHASE_TAG[phase]}还剩 ${samePhaseLeft} 对要交换。`
    } else if (phase === 'reverse-all') {
      why = `为什么：整体反转把长度为 ${k} 的后缀 B 送到了最前面，但它此刻是反序的，正是后两步要修正的对象。`
    } else if (phase === 'reverse-prefix') {
      why = `为什么：翻转前 ${k} 个把反序的 B 段摆正，nums[0..${k - 1}] = [${nums.slice(0, k).join(', ')}] 已经是最终结果。`
    } else {
      why = `为什么：翻转后 ${n - k} 个把剩下的反序 A 段摆正，整个数组变成 BA，正好是向右轮转 ${k} 位的结果。`
    }

    steps.push({
      nums: nums.slice(),
      phase,
      l,
      r,
      i,
      j,
      swapsDone: done,
      swapsTotal: total,
      hint: next
        ? `${next.phase !== phase ? `${PHASE_TAG[next.phase]}，` : ''}交换 nums[${next.i}] = ${nums[next.i]} 与 nums[${next.j}] = ${nums[next.j]}`
        : '三次反转结束，nums 就是答案',
      note: `观察：${PHASE_TAG[phase]}的区间 [${l}, ${r}] 两端是 nums[${i}] = ${leftVal}、nums[${j}] = ${rightVal}。动作：交换后 nums[${i}] = ${rightVal}、nums[${j}] = ${leftVal}，本轮结束时 i = ${ni}、j = ${nj}${ni >= nj ? `，i ≥ j，区间 [${l}, ${r}] 反转完毕` : ''}。${why}`,
    })
  })

  steps.push({
    nums: nums.slice(),
    phase: 'done',
    l: null,
    r: null,
    i: null,
    j: null,
    swapsDone: done,
    swapsTotal: total,
    hint: null,
    note: `三次反转完成：nums = [${nums.join(', ')}]，恰好是原数组向右轮转 ${k} 位。为什么正确：整体翻转让后缀 B 来到最前但顺序相反，第二次翻前 ${k} 个把 B 摆正，第三次翻后 ${n - k} 个把剩下的 A 摆正，最终得到 BA。复杂度：三次反转合计走过 n + k + (n−k) = 2n 个元素，每个元素被交换两次，时间 O(n)；全程只用 i、j 两个下标就地交换，空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.nums.length
  const k = K % n
  const isDone = step.phase === 'done'
  const hasInterval = step.l !== null && step.r !== null
  const l = step.l ?? 0
  const r = step.r ?? 0
  /** 进入 ③ 阶段后，前 k 个元素已经是最终结果 */
  const prefixSettled = step.phase === 'reverse-suffix'
  const activePhaseIdx = PHASE_ORDER.findIndex((p) => p === step.phase)

  const stateOf = (idx: number): CellState => {
    if (isDone) return 'ok'
    if (idx === step.i) return 'active'
    if (idx === step.j) return 'new'
    if (prefixSettled && idx < k) return 'ok'
    if (hasInterval && idx >= l && idx <= r) return 'idle'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 三次反转的阶段进度 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {PHASE_ORDER.map((p, idx) => (
          <Badge
            key={p}
            tone={step.phase === p ? 'amber' : isDone || (activePhaseIdx >= 0 && idx < activePhaseIdx) ? 'easy' : 'plain'}
          >
            {PHASE_TAG[p]}
          </Badge>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[460px]">
        {/* 状态标：正在反转 / 已就位 */}
        <div className="flex h-4 w-full">
          {step.nums.map((_, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 items-end justify-center">
              {hasInterval && idx === l && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--amber))]">
                  反转中
                </span>
              )}
              {(prefixSettled || isDone) && idx === 0 && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">
                  已就位
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 指针旗标：i 在区间左端、j 在区间右端 */}
        <div className="flex h-8 w-full">
          {step.nums.map((_, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {idx === step.i && <Flag label="i" tone="amber" />}
              {idx === step.j && <Flag label="j" tone="teal" />}
            </div>
          ))}
        </div>

        {/* 数值行：正在反转的区间用半透明琥珀块整体包裹 */}
        <div className="relative flex w-full">
          {hasInterval && (
            <div
              className="pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15 transition-all duration-300"
              style={{
                left: `${(l / n) * 100}%`,
                width: `${((r - l + 1) / n) * 100}%`,
              }}
            />
          )}
          {step.nums.map((v, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(idx)} className="w-full min-w-0">
                {v}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="mt-1 flex w-full">
          {step.nums.map((_, idx) => (
            <span key={idx} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {idx}
            </span>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="当前反转区间" value={hasInterval ? `[${l}, ${r}]` : '—'} tone="amber" />
        <Stat label="已交换对数" value={`${step.swapsDone} / ${step.swapsTotal}`} tone="water" />
        {step.hint && <Hint>{step.hint}</Hint>}
        {isDone && (
          <Answer>
            向右轮转 {k} 位 → [{step.nums.join(', ')}]
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RotateArrayDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title={`三次反转原地轮转（k = ${K}）`}
      info={`nums = [${NUMS.join(', ')}]，k = ${K}，取自题解示例 1，答案 [5, 6, 7, 1, 2, 3, 4]，共 ${steps.length} 步。三次反转全程只用对撞交换、不用额外数组；题目另有规模更小的示例 2（n = 4、k = 2），但那里 k = n − k、两段等长，看不出下标 k 这个分界点，所以选示例 1。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在反转的区间（琥珀块）/ i：区间左端' },
        { color: TONE.teal, label: 'j：区间右端' },
        { color: TONE.easy, label: '已就位：③ 阶段起的前 k 个（完成时为全部）' },
        { color: TONE.muted, label: '区间外尚未处理的元素' },
      ]}
    />
  )
}
