import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 10. 跳跃游戏 II —— 模式 A：数组 + 指针（分层区间块变体）              */
/* curEnd 是当前层右边界，curFarthest 是扫描中得到的下一层最远位置        */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums = [2,3,1,1,4]，答案 2 跳 */
const NUMS = [2, 3, 1, 1, 4]

interface Step {
  nums: number[]
  /** 正在考察的下标，init 时为 −1 */
  i: number
  jumps: number
  /** 当前这一层（用 jumps 跳可达）的右边界 */
  curEnd: number
  /** 已扫描前缀里再跳一步能到的最远下标，即下一层右边界 */
  curFarthest: number
  phase: 'init' | 'scan' | 'jump' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums = NUMS.slice()
  const n = nums.length
  const steps: Step[] = []
  let jumps = 0
  let curEnd = 0
  let curFarthest = 0

  const push = (phase: Step['phase'], i: number, note: string) => {
    steps.push({
      nums: nums.slice(),
      i,
      jumps,
      curEnd,
      curFarthest,
      phase,
      note,
    })
  }

  push(
    'init',
    -1,
    `初始化：输入取题解示例 1，nums = [2, 3, 1, 1, 4]，n = 5；jumps = 0、curEnd = 0、curFarthest = 0，i 还没开始扫描。把跳跃看成分层扩散——curEnd 是当前这一层（用 jumps 跳可达）的右边界，curFarthest 是已扫描前缀里所有跳板再跳一步能触达的最远下标，也就是下一层的右边界。站在 n − 1 = 4 上不用再跳，所以循环只扫 i = 0..3。`
  )

  for (let i = 0; i < n - 1; i++) {
    const prevFarthest = curFarthest
    const cand = i + nums[i]
    if (cand > curFarthest) curFarthest = cand

    push(
      'scan',
      i,
      cand > prevFarthest
        ? `观察：i = ${i}，nums[${i}] = ${nums[i]}，从这里再跳一步最远能到 ${i} + ${nums[i]} = ${cand}，比原来的 curFarthest = ${prevFarthest} 更远。判断：本层出现了一个更远的跳板，下一层的右边界必须推进。动作：curFarthest 更新为 ${cand}，下一层新区间就是下标 [${prevFarthest + 1}, ${cand}]。为什么：curFarthest 是整个已扫描前缀的滚动最大值，必须把这一层每个跳板都算进来才能得到完整的下一层边界。`
        : `观察：i = ${i}，nums[${i}] = ${nums[i]}，从这里再跳一步最远到 ${i} + ${nums[i]} = ${cand}，没有超过 curFarthest = ${prevFarthest}。判断：这个跳板比前面已经找到的落点更近，对下一层边界没有贡献。动作：curFarthest 保持 ${curFarthest} 不变，继续看本层后面的位置。为什么：下一层边界取的是前缀最大值，不能被更小的候选覆盖回去。`
    )

    if (i === curEnd) {
      const oldEnd = curEnd
      jumps += 1
      curEnd = curFarthest
      const covered = curEnd >= n - 1
      push(
        'jump',
        i,
        covered
          ? `观察：i = ${i} 触及当前层右边界 curEnd = ${oldEnd}，本层考察结果是 curFarthest = ${curEnd}，也就是再跳一次最远能到下标 ${curEnd}。判断：本层（右边界 ${oldEnd}）已考察完，跳数要 +1；题解最短路径 0 → 1 → 4 的第二跳从下标 1 起跳（nums[1] = 3，1 + 3 = 4），一步覆盖终点。动作：jumps 由 ${jumps - 1} 增到 ${jumps}，curEnd 更新为 ${curEnd}。为什么：curEnd = ${curEnd} ≥ n − 1 = ${n - 1}，终点已经进入当前层，循环提前结束，再多扫只会让层数变大。`
          : `观察：i = ${i} 正好等于当前层右边界 curEnd = ${oldEnd}，这一层已经全部考察完。判断：层内再没有别的落脚点，必须跳一次才能继续，此时 curFarthest = ${curEnd} 就是第 ${jumps} 层的完整边界。动作：jumps 由 ${jumps - 1} 增到 ${jumps}，curEnd 更新为 curFarthest = ${curEnd}，区间 [0, ${curEnd}] 变为「${jumps} 跳以内可达」。为什么：curEnd = ${curEnd} < n − 1 = ${n - 1}，终点还够不到，接着考察第 ${jumps} 层里的跳板。`
      )
      if (covered) break
    }
  }

  push(
    'done',
    n - 1,
    `扫描结束：jumps = ${jumps}，即到达 n − 1 = ${n - 1} 的最少跳跃次数，路径是 0 → 1 → 4。为什么最少：jumps = k 时 curEnd 恰好等于「最多用 k 跳能到的最远下标」R_k，第一次出现 curEnd ≥ n − 1 时的 k 必然最小，在此之前 R_{k−1} 还够不到终点。复杂度：i 只扫一遍数组，时间 O(n)；只用 jumps、curEnd、curFarthest 三个变量，空间 O(1)。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 下一步动作（Hint 前缀「下一步：」由组件硬编码） */
function nextAction(step: Step): string | null {
  const last = step.nums.length - 1
  if (step.phase === 'done') return null
  if (step.phase === 'init') return `i 从 0 开始扫描，用 0 + nums[0] = ${NUMS[0]} 更新 far`
  if (step.phase === 'scan') {
    if (step.i === step.curEnd) {
      return `本层扫完：jumps 增到 ${step.jumps + 1}，end 更新为 far = ${step.curFarthest}`
    }
    const nx = step.i + 1
    return `i 右移到 ${nx}，用 ${nx} + nums[${nx}] 挑战 far = ${step.curFarthest}`
  }
  if (step.curEnd >= last) {
    return `end = ${step.curEnd} ≥ n − 1 = ${last}，跳出循环并输出 jumps = ${step.jumps}`
  }
  return `i 右移到 ${step.i + 1}，在第 ${step.jumps} 层里继续找更远的跳板`
}

function Stage(step: Step) {
  const n = step.nums.length
  const last = n - 1
  const done = step.phase === 'done'
  const hint = nextAction(step)

  /** 下一层新区间 (curEnd, curFarthest]（右端按 n − 1 夹取） */
  const nextL = step.curEnd + 1
  const nextR = Math.min(last, step.curFarthest)
  const hasNext = nextR >= nextL

  const stateOf = (idx: number): CellState => {
    if (done) return idx <= step.curEnd ? 'ok' : 'dim'
    if (idx === step.i) return 'active'
    if (idx <= step.curEnd) return 'ok'
    if (idx <= step.curFarthest) return 'new'
    return 'dim'
  }

  /** 格上旗标：字母标签与颜色同时给线索 */
  const flagsOf = (idx: number): { label: string; tone: 'amber' | 'easy' | 'teal' }[] => {
    if (done) return []
    const flags: { label: string; tone: 'amber' | 'easy' | 'teal' }[] = []
    if (idx === step.i) flags.push({ label: 'i', tone: 'amber' })
    if (idx === step.curEnd) flags.push({ label: 'end', tone: 'easy' })
    if (idx === step.curFarthest) flags.push({ label: 'far', tone: 'teal' })
    return flags
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[520px]">
        {/* 指针旗标：i 在上、end / far 在下，同格时纵向堆叠 */}
        <div className="flex h-12 w-full">
          {step.nums.map((_, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {flagsOf(idx).map((f) => (
                <Flag key={f.label} label={f.label} tone={f.tone} />
              ))}
            </div>
          ))}
        </div>

        {/* 数值行：当前层区间实线绿块、下一层区间虚线青块 */}
        <div className="relative flex w-full">
          <div
            className={cn(
              'pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] transition-all duration-300',
              done
                ? 'demo-pulse border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15'
                : 'border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy))]/10'
            )}
            style={{ left: '0%', width: `${((step.curEnd + 1) / n) * 100}%` }}
          />
          {hasNext && !done && (
            <div
              className="pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-dashed border-[hsl(var(--teal))]/60 bg-[hsl(var(--teal))]/10 transition-all duration-300"
              style={{
                left: `${(nextL / n) * 100}%`,
                width: `${((nextR - nextL + 1) / n) * 100}%`,
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

        {/* 下标 + 终点标记 */}
        <div className="mt-1 flex w-full">
          {step.nums.map((_, idx) => (
            <span key={idx} className="flex min-w-0 flex-1 flex-col items-center">
              <span className="font-code text-[11px] text-ink-soft">{idx}</span>
              {idx === last && <span className="text-[9px] leading-tight text-ink-soft">终点</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 两个区间的显式文字说明（与区间块颜色一致） */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TONE.easy }} />
          当前层 <b className="font-code" style={{ color: TONE.easy }}>[0, {step.curEnd}]</b>：
          <b className="font-code">{step.jumps}</b> 跳以内可达
        </span>
        {hasNext && !done && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TONE.teal }} />
            下一层 <b className="font-code" style={{ color: TONE.teal }}>[{nextL}, {nextR}]</b>：
            再跳 1 次可达
          </span>
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="已跳次数 jumps" value={step.jumps} tone="amber" />
        <Stat label="本层边界 end" value={step.curEnd} tone="easy" />
        <Stat label="最远可达 far" value={step.curFarthest} tone="teal" />
        {hint && <Hint>{hint}</Hint>}
        {done && <Answer>jumps = {step.jumps}，最少 {step.jumps} 跳到达下标 {last}</Answer>}
      </Badges>
    </div>
  )
}

export default function JumpGameIiDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="分层贪心求最少跳跃次数"
      info={`输入取题解示例 1：nums = [${NUMS.join(', ')}]，n = ${NUMS.length}，答案 2 跳。curEnd（旗标 end）是当前这一跳能覆盖的右边界，curFarthest（旗标 far）是已扫描前缀里再跳一步能到的最远下标；示例 2 只是把 nums[2] 由 1 换成 0、跳数同为 2，规模不更小，故选示例 1。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'i：当前扫描的下标' },
        { color: TONE.easy, label: '当前层区间 [0, end]：jumps 跳以内可达' },
        { color: TONE.teal, label: '下一层区间 (end, far]：再跳 1 次可达' },
        { color: TONE.muted, label: '还没够到的下标' },
      ]}
    />
  )
}
