import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 9. 跳跃游戏 —— 模式 A：数组 + 指针（可达区间色块变体）                */
/* ------------------------------------------------------------------ */

interface DemoCase {
  label: string
  nums: number[]
  initNote: string
}

/** 依次跑题解的两个官方示例，都是题解里规模最小的 5 元素用例 */
const CASES: DemoCase[] = [
  {
    label: '示例 1',
    nums: [2, 3, 1, 1, 4],
    initNote:
      '观察：nums = [2, 3, 1, 1, 4]，起点固定在下标 0。判断：从任一可达位置 j 出发能一步落到区间 [j, j + nums[j]] 的每个位置，所以可达位置必然连成前缀 [0, maxReach]，中间不会出现空洞。动作：maxReach 初始化为 0（眼下只保证站得住下标 0），指针 i 准备从 0 开始向右扫描。',
  },
  {
    label: '示例 2',
    nums: [3, 2, 1, 0, 4],
    initNote:
      '观察：换用示例 2，nums = [3, 2, 1, 0, 4]，目标下标 n - 1 = 4。判断：下标 3 处的 0 意味着落到那里就无法再前进，只有让 maxReach 在扫描到 i = 4 之前突破下标 3，才能拿到终点。动作：maxReach 重新置为 0，指针 i 从 0 开始重新扫描。',
  },
]

interface Step {
  caseIndex: number
  label: string
  nums: number[]
  /** 本步扫描到的下标；init / done 为 −1 */
  i: number
  /** 本步结束时的最远可达下标 */
  maxReach: number
  /** i + nums[i]；init / done 为 null（不展示位置本身都没走到的长度） */
  cand: number | null
  /** maxReach 已经覆盖最后一个下标 n - 1 */
  covered: boolean
  phase: 'init' | 'extend' | 'hold' | 'blocked' | 'done'
  result: boolean | null
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []

  CASES.forEach((demoCase, caseIndex) => {
    const nums = demoCase.nums.slice()
    const n = nums.length
    const last = n - 1
    let maxReach = 0
    let result: boolean | null = null
    let lastI = -1

    steps.push({
      caseIndex,
      label: demoCase.label,
      nums: nums.slice(),
      i: -1,
      maxReach,
      cand: null,
      covered: maxReach >= last,
      phase: 'init',
      result: null,
      note: demoCase.initNote,
    })

    for (let i = 0; i < n; i++) {
      // 分支一：下标已经落在可达前缀之外 → 断档，返回 false
      if (i > maxReach) {
        result = false
        steps.push({
          caseIndex,
          label: demoCase.label,
          nums: nums.slice(),
          i,
          maxReach,
          cand: null,
          covered: false,
          phase: 'blocked',
          result: false,
          note: `观察：i = ${i}，而 maxReach 仍停在 ${maxReach}。判断：${i} > ${maxReach} 成立，下标 ${i} 已经落在可达区间 [0, ${maxReach}] 之外。动作：直接返回 false，循环在这里终止。为什么：可达位置是连续前缀，前缀之外的下标只会更远，一律不可能落脚。`,
        })
        break
      }

      const before = maxReach
      const cand = i + nums[i]
      const grew = cand > before
      if (grew) maxReach = cand
      const covered = maxReach >= last
      lastI = i

      // i == before 时下标 i 正好是可达区间的最右端：判据 i > maxReach 不成立，仍然可达
      const reachClause =
        i === before
          ? `i = ${i} 与 maxReach = ${before} 恰好相等，下标 ${i} 正是可达区间的最右端，判据 ${i} > maxReach 不成立，所以仍能落脚`
          : `i = ${i} 落在可达前缀内（${i} ≤ maxReach = ${before}）`

      const judge = grew
        ? `i + nums[${i}] = ${i} + ${nums[i]} = ${cand}，比原来的 maxReach = ${before} 更远`
        : `i + nums[${i}] = ${i} + ${nums[i]} = ${cand}，${
            cand === before ? '恰好等于' : '没有超过'
          }当前的 maxReach = ${before}，推不远`

      const act = grew
        ? `maxReach 更新为 ${maxReach}，可达区间变成 [0, ${maxReach}]`
        : `maxReach 保持 ${maxReach}，可达区间仍是 [0, ${maxReach}]`

      const tail = covered
        ? `为什么：此时 maxReach = ${maxReach} ≥ n - 1 = ${last}，终点已经落在可达前缀内，代码在这里提前返回 true，后面的元素不必再扫描。`
        : `为什么：上界取的是所有可达落点的最大值，${
            grew ? '把范围推远就一定不会漏掉任何可达点' : '相等或更小的候选不会改变可达范围'
          }。`

      steps.push({
        caseIndex,
        label: demoCase.label,
        nums: nums.slice(),
        i,
        maxReach,
        cand,
        covered,
        phase: grew ? 'extend' : 'hold',
        result: null,
        note: `观察：${reachClause}，nums[${i}] = ${nums[i]}。判断：${judge}。动作：${act}。${tail}`,
      })

      if (covered) {
        result = true
        break
      }
    }

    const doneNote =
      result === true
        ? `结论：${demoCase.label} 返回 true —— 扫描到 i = ${lastI} 时 maxReach 已经达到 ${maxReach} = n - 1 = ${last}，终点落在可达前缀 [0, ${maxReach}] 内，后面的元素不必再看。为什么：可达集合是连续前缀，上界一旦覆盖 n - 1，就必然存在一条通路。全程只用一个 maxReach，时间 O(n)、空间 O(1)。`
        : `结论：${demoCase.label} 返回 false —— maxReach 最多推进到下标 ${maxReach}，nums[${maxReach}] = ${nums[maxReach]} 无法再向前，扫描到 i = ${maxReach + 1} 时 ${maxReach + 1} > ${maxReach} 断档。为什么：可达位置连成连续前缀，前缀之外的下标一律够不到。每个元素最多看一次，时间 O(n)、空间 O(1)。`

    steps.push({
      caseIndex,
      label: demoCase.label,
      nums: nums.slice(),
      i: -1,
      maxReach,
      cand: null,
      covered: maxReach >= last,
      phase: 'done',
      result,
      note: doneNote,
    })
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step, last: number): string | null {
  if (step.phase === 'done') {
    return step.caseIndex === 0 ? '换用示例 2 [3, 2, 1, 0, 4]，maxReach 重置为 0' : null
  }
  if (step.phase === 'blocked') return '本用例已判定 false，随后给出结论'
  if (step.phase === 'init') return `i 从 0 出发，先检查 0 ≤ maxReach = ${step.maxReach}`
  if (step.covered) return `maxReach = ${step.maxReach} ≥ n - 1 = ${last}，提前返回 true`
  return `i 右移到 ${step.i + 1}，先检查 ${step.i + 1} ≤ maxReach = ${step.maxReach}`
}

function Stage(step: Step) {
  const n = step.nums.length
  const last = n - 1
  const init = step.phase === 'init'
  const blocked = step.phase === 'blocked'
  const done = step.phase === 'done'
  /** 色块右端落在哪一格：maxReach 可以超过 n - 1，展示时截断 */
  const reachEdge = Math.min(step.maxReach, last)
  const blockedAt = blocked ? step.i : -1
  const hint = nextAction(step, last)

  const stateOf = (k: number): CellState => {
    if (blocked) return k === blockedAt ? 'bad' : k <= step.maxReach ? 'idle' : 'dim'
    if (done) return k > reachEdge ? 'dim' : step.result ? 'ok' : 'idle'
    if (k <= step.maxReach) return k === step.i ? 'active' : 'idle'
    return 'dim'
  }

  /** 格上方的文字状态标：不靠颜色也能区分 */
  const topLabelOf = (k: number): { text: string; color: string } | null => {
    if (blocked && k === blockedAt) return { text: '断档', color: TONE.hard }
    if (init && k === 0) return { text: '起点', color: TONE.amber }
    if (!blocked && k === last && step.covered) return { text: '覆盖终点', color: TONE.easy }
    if (done && k === last && !step.covered) return { text: '够不到', color: TONE.muted }
    if (!blocked && !step.covered && k === reachEdge + 1) {
      return { text: '还没够到', color: 'hsl(var(--ink-soft))' }
    }
    return null
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[520px]">
        {/* 当前用例 */}
        <div className="mb-1 flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-ink-soft">
          <span>{step.label}：</span>
          <span className="font-code">nums = [{step.nums.join(', ')}]</span>
          <span className="font-code">目标下标 n - 1 = {last}</span>
        </div>

        {/* 状态标：起点 / 断档 / 覆盖终点 / 还没够到 / 够不到 */}
        <div className="flex h-4 w-full">
          {step.nums.map((_, k) => {
            const label = topLabelOf(k)
            return (
              <div key={k} className="flex min-w-0 flex-1 items-end justify-center">
                {label && (
                  <span
                    className="whitespace-nowrap font-code text-[10px] font-bold"
                    style={{ color: label.color }}
                  >
                    {label.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* 指针旗标：reach 上界在上、当前 i 在下（同格时上下并列） */}
        <div className="flex h-12 w-full">
          {step.nums.map((_, k) => (
            <div key={k} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {k === reachEdge && <Flag label="reach" tone={step.covered ? 'easy' : 'water'} />}
              {!init && !done && k === step.i && (
                <Flag label="i" tone={blocked ? 'hard' : 'amber'} />
              )}
            </div>
          ))}
        </div>

        {/* 单元格行：可达区间 [0, maxReach] 用横跨的色块整体表示，色块压在单元格之下 */}
        <div className="relative flex w-full">
          <div
            className={cn(
              'pointer-events-none absolute -inset-y-1 left-0 rounded-lg border-[1.5px] transition-all duration-300',
              step.covered
                ? 'border-[hsl(var(--easy))]/55 bg-[hsl(var(--easy))]/10'
                : 'border-[hsl(var(--water))]/45 bg-[hsl(var(--water))]/10',
              done && step.result && 'demo-pulse'
            )}
            style={{ width: `${((reachEdge + 1) / n) * 100}%` }}
          />
          {step.nums.map((v, k) => (
            <div key={k} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(k)} className="w-full min-w-0">
                {v}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="mt-1 flex w-full">
          {step.nums.map((_, k) => (
            <span key={k} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {k}
            </span>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat
          label={init ? '起始 maxReach' : done ? '最终 maxReach' : 'maxReach'}
          value={step.maxReach}
          tone={step.covered ? 'easy' : 'water'}
        />
        {blocked ? (
          <Stat label="越界的 i" value={step.i} tone="hard" />
        ) : (
          <Stat label="i + nums[i]" value={step.cand ?? '—'} tone="teal" />
        )}
        {hint && <Hint tone={blocked ? 'hard' : 'teal'}>{hint}</Hint>}
        {done && (
          <Answer>
            {step.label} →{' '}
            <span className="font-code">
              {step.result ? 'true' : 'false'}（maxReach = {step.maxReach}，n - 1 = {last}）
            </span>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function JumpGameDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="贪心维护最远可达下标"
      info={`依次跑题解的两个官方示例：示例 1 nums = [2, 3, 1, 1, 4] → true（i = 1 时 maxReach 已达 n - 1 = 4，提前返回），示例 2 nums = [3, 2, 1, 0, 4] → false（下标 3 的 0 让 maxReach 停在 3，i = 4 时 i > maxReach 断档）。两者都是题解里规模最小（5 个元素）的官方输入；示例 1 在 i = 1 就提前返回，单独看它看不到失败分支，所以把示例 2 一并演示。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前扫描的 i' },
        { color: TONE.water, label: '可达区间色块 0 .. maxReach' },
        { color: TONE.hard, label: '断档：i > maxReach' },
        { color: TONE.muted, label: '超出可达范围，够不到' },
        { color: TONE.easy, label: '已覆盖终点 n - 1（返回 true）' },
      ]}
    />
  )
}
