import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 14. 加油站 —— 模式 A：横向单元格行 + 总盈余 total / 当前盈余 tank     */
/* ------------------------------------------------------------------ */

/** 题解示例 1：gas = [1,2,3,4,5]，cost = [3,4,5,1,2] → 3 */
const GAS = [1, 2, 3, 4, 5]
const COST = [3, 4, 5, 1, 2]

/** 净收益带符号显示：+3 / -2 */
const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`)

interface Step {
  /** net[i] = gas[i] - cost[i]，本步的不可变快照 */
  net: number[]
  /** 当前遍历到的下标；init / done 步为 null */
  i: number | null
  /** 当前尝试的起点 */
  start: number
  /** 从 start 起累计到当前下标的油量结余 */
  tank: number
  /** 绕行一圈的总盈余 sum(net)，全程不变 */
  total: number
  phase: 'init' | 'ok' | 'fail' | 'reset' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const net = GAS.map((g, idx) => g - COST[idx])
  const total = net.reduce((a, b) => a + b, 0)
  const n = net.length
  const steps: Step[] = []

  const snap = (extra: Partial<Step> & { phase: Step['phase']; note: string }): Step => ({
    net: net.slice(),
    i: null,
    start: 0,
    tank: 0,
    total,
    ...extra,
  })

  steps.push(
    snap({
      phase: 'init',
      note: `观察：净收益 net[i] = gas[i] − cost[i] = [${net.map(fmt).join(', ')}]，${n} 段相加得到总盈余 total = ${total}。判断：total ≥ 0，说明绕一圈的加油量不少于耗油量，可行起点一定存在。动作：令 start = 0、tank = 0，从下标 0 开始向右扫描。为什么：total < 0 时任何起点都会净亏，必须先做这个前置判断，否则无解时也会返回一个看似合法的下标。`,
    })
  )

  let start = 0
  let tank = 0

  for (let i = 0; i < n; i++) {
    const prev = tank
    tank += net[i]

    if (tank < 0) {
      steps.push(
        snap({
          phase: 'fail',
          i,
          start,
          tank,
          note: `观察：net[${i}] = gas[${i}] − cost[${i}] = ${GAS[i]} − ${COST[i]} = ${fmt(net[i])}，从 start = ${start} 出发的 tank 由 ${prev} 变成 ${tank}。判断：tank = ${tank} < 0，车还没开到加油站 ${i + 1} 油就耗光了，起点 ${start} 走不通。动作：下一步把 start 换成 i + 1 = ${i + 1}，tank 清零。为什么：被否掉的起点区间 [${start}, ${i}] 里任一站开到加油站 ${i + 1} 时的油量只会更少，整段可以一次性排除。`,
        })
      )

      const oldStart = start
      start = i + 1
      tank = 0

      steps.push(
        snap({
          phase: 'reset',
          i,
          start,
          tank,
          note: `观察：start 由 ${oldStart} 换成 ${start}、tank 归零，起点区间 [${oldStart}, ${i}] 被整段排除。判断：新起点从空箱重新起跑，不能继承之前亏掉的那部分油。动作：继续扫描下一个下标，累加它的净收益。为什么：一次失败就跳过整段，把 O(n²) 的暴力枚举降成一遍线性扫描。`,
        })
      )
    } else {
      steps.push(
        snap({
          phase: 'ok',
          i,
          start,
          tank,
          note: `观察：net[${i}] = gas[${i}] − cost[${i}] = ${GAS[i]} − ${COST[i]} = ${fmt(net[i])}，从 start = ${start} 出发的 tank 由 ${prev} 变成 ${tank}。判断：tank = ${tank} ≥ 0，油够开到加油站 ${(i + 1) % n}。动作：${i + 1 < n ? `i 右移到 ${i + 1}，继续累加 net[${i + 1}] = ${fmt(net[i + 1])}` : 'i 越界，扫描结束'}。为什么：从 start = ${start} 一路累加到现在 tank 都没变负，这段行程始终成立。`,
        })
      )
    }
  }

  steps.push(
    snap({
      phase: 'done',
      start,
      tank,
      note: `观察：扫描结束，start = ${start}、tank = ${tank}，总盈余 total = ${total} ≥ 0。判断：最后一次重置后 tank 再未变负，前半圈 0 → ${start - 1} 缺的 ${-net.slice(0, start).reduce((a, b) => a + b, 0)} 升恰好被后半圈的盈余补平，绕行一圈不会断油。动作：返回 start = ${start}。为什么：全程只扫一遍数组、只用 start 与 tank 两个变量，时间 O(n)、空间 O(1)。`,
    })
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.net.length
  const showI = step.phase === 'ok' || step.phase === 'fail'

  const stateOf = (idx: number): CellState => {
    if (step.phase === 'done') return idx >= step.start ? 'ok' : 'dim'
    if (idx < step.start) return 'dim'
    if (step.phase === 'fail' && idx === step.i) return 'bad'
    if (idx === step.i) return 'active'
    if (step.phase === 'init') return 'idle'
    if (step.i !== null && idx < step.i) return 'new'
    return 'idle'
  }

  const hint = ((): string | null => {
    const cur = step.i
    if (step.phase === 'init') return `把 net[0] = ${fmt(step.net[0])} 累加进 tank，检查它是否变负`
    if (step.phase === 'fail' && cur !== null) return `start 换成 i + 1 = ${cur + 1}，tank 清零`
    if (step.phase === 'reset' && cur !== null) {
      const k = cur + 1
      return k < n
        ? `累加 net[${k}] = ${fmt(step.net[k])}，看 tank 是否变负`
        : `${n} 段净收益累加完毕，进入结论`
    }
    if (step.phase === 'ok' && cur !== null) {
      const k = cur + 1
      return k < n
        ? `i 右移到 ${k}，累加 net[${k}] = ${fmt(step.net[k])}`
        : 'i 越界，进入结论'
    }
    return null
  })()

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="max-w-full text-center text-xs text-ink-soft">
        每格是净收益 net[i] = gas[i] − cost[i]（格下标注 gas[i]−cost[i] 与下标 i）
      </span>

      {/* 单元格行：start 旗标在上、i 旗标在下，下标与算式在格下 */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {step.net.map((v, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <Flag label={idx === step.start ? 'start' : undefined} tone="easy" />
            <Flag
              label={showI && idx === step.i ? 'i' : undefined}
              tone={step.phase === 'fail' ? 'hard' : 'amber'}
            />
            <Cell state={stateOf(idx)}>{fmt(v)}</Cell>
            <span className="mt-1 font-code text-[11px] text-ink-soft">{idx}</span>
            <span className="font-code text-[10px] text-ink-soft">
              {GAS[idx]}−{COST[idx]}
            </span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="tank" value={step.tank} tone={step.tank < 0 ? 'hard' : 'amber'} />
        <Stat label="total" value={step.total} tone="teal" />
        <Stat label="start" value={step.start} tone="easy" />
        {hint && <Hint>{hint}</Hint>}
        {step.phase === 'done' && <Answer>从加油站 {step.start} 出发可绕行一周</Answer>}
      </Badges>
    </div>
  )
}

export default function GasStationDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="加油站：一次线性扫描确定起点"
      info={`题解示例 1：gas = [1, 2, 3, 4, 5]，cost = [3, 4, 5, 1, 2]，n = 5，总盈余 total = 0 ≥ 0。net[i] = gas[i] − cost[i]，tank 从当前 start 起累加；tank < 0 就把 start 跳到 i + 1 并清零。共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'i：当前正在处理的加油站（格内为 net[i]）' },
        { color: TONE.easy, label: 'start：当前起点；结论步为最终可行段' },
        { color: TONE.teal, label: '当前起点以来已走通（tank ≥ 0）' },
        { color: TONE.hard, label: 'tank < 0：起点作废' },
        { color: TONE.muted, label: '已被排除的起点区间' },
      ]}
    />
  )
}
