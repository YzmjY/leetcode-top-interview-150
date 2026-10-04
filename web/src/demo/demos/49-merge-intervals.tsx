import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Pointer, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 49. 合并区间 —— 模式 B：数轴上的横向区间条 + 排序后一次线性扫描合并     */
/* ------------------------------------------------------------------ */

/**
 * 题解示例 1 的四个区间 [[1,3],[2,6],[8,10],[15,18]]，这里只把顺序打乱成
 * [[8,10],[1,3],[15,18],[2,6]]，用来展示「先按起点升序排序」这一步（取舍见 info）。
 */
const INPUT: [number, number][] = [
  [8, 10],
  [1, 3],
  [15, 18],
  [2, 6],
]

const N = INPUT.length

/** 本输入合并后恰好 3 段（[[1,6],[8,10],[15,18]]），据此给结果区留出固定高度 */
const SEGMENTS = 3

type Kind =
  | 'init'
  | 'sort-pick'
  | 'sort-cmp'
  | 'sort-place'
  | 'sorted'
  | 'merge-init'
  | 'cmp'
  | 'merge'
  | 'add'
  | 'done'

interface Step {
  kind: Kind
  /** 输入数组的当前顺序（排序阶段会变化） */
  arr: [number, number][]
  /** 结果列表 merged 的快照 */
  merged: [number, number][]
  /** 排序阶段：已就位的前缀长度 */
  sortedCount: number
  /** 排序阶段：本轮 key 的起点；-1 表示本步不涉及排序 */
  keyStart: number
  /** 排序阶段：key 当前所在下标；-1 表示本步不涉及排序 */
  keyAt: number
  /** 本步正在处理的下标：排序阶段是 arr 的下标，合并阶段是 curr 的下标；-1 表示无 */
  at: number
  /** 合并阶段：当前合并块在 arr 中的起始下标；-1 表示无 */
  blockStart: number
  /** 合并阶段：last 在 merged 中的下标；-1 表示无 */
  lastIdx: number
  /** 合并阶段的比较步：curr 与 last 是否相交 */
  overlap: boolean
  note: string
  /** 下一步动作，最后统一由后一个快照回填，保证 Hint 与步骤数据一致 */
  next: string
}

const fmt = (iv: [number, number]) => `[${iv[0]},${iv[1]}]`
const fmtList = (list: [number, number][]) => list.map(fmt).join('、')

/** 跑一遍真实算法（插入排序 + 一次线性扫描），每轮 push 一个不可变快照 */
function buildSteps(): Step[] {
  const arr: [number, number][] = INPUT.map((iv) => [iv[0], iv[1]])
  const merged: [number, number][] = []
  const steps: Step[] = []
  let sortedCount = 0

  const snap = (kind: Kind, note: string, extra: Partial<Step> = {}) => {
    steps.push(
      Object.assign(
        {
          kind,
          arr: arr.map((iv): [number, number] => [iv[0], iv[1]]),
          merged: merged.map((iv): [number, number] => [iv[0], iv[1]]),
          sortedCount,
          keyStart: -1,
          keyAt: -1,
          at: -1,
          blockStart: -1,
          lastIdx: -1,
          overlap: false,
          note,
          next: '',
        } as Step,
        extra
      )
    )
  }

  /* ---------------- 初始状态 ---------------- */
  snap(
    'init',
    `观察：输入 intervals = ${fmtList(INPUT)}（题解示例 1 的四个区间，只把顺序打乱了），起点依次是 ${INPUT.map((iv) => iv[0]).join('、')}，并不单调。判断：curr 只与结果列表的末尾区间 last 比较一次，这个前提要求区间按起点升序，所以必须先排序。动作：先用插入排序把区间按起点升序排列（只比较起点，终点不参与），再让 merged 从空开始、curr 从下标 1 开始扫描。为什么：起点有序之后，与当前合并区间相交的区间在数组里必然连成一段，一次线性扫描就能完成全部合并。`
  )

  /* ---------------- 按起点升序排序 ---------------- */
  for (let k = 1; k < N; k++) {
    const key = arr[k]
    snap(
      'sort-pick',
      `观察：第 ${k} 轮取出下标 ${k} 的 ${fmt(key)} 作为 key，左侧 ${k} 个区间已按起点升序（起点 ${arr.slice(0, k).map((iv) => iv[0]).join('、')}）。判断：要从右往左找第一个起点不大于 ${key[0]} 的区间，key 就插在它右边。动作：先与下标 ${k - 1} 的 ${fmt(arr[k - 1])} 比较起点。为什么：前缀本身有序时，只要定位到这个位置，插入后前缀仍然有序。`,
      { keyStart: key[0], keyAt: k, at: k }
    )

    let j = k - 1
    while (j >= 0 && arr[j][0] > key[0]) {
      snap(
        'sort-cmp',
        `观察：key = ${fmt(key)} 的起点 ${key[0]} 与下标 ${j} 的 ${fmt(arr[j])} 起点 ${arr[j][0]} 比较。判断：${arr[j][0]} > ${key[0]}，它必须排在 key 后面，插入时整体右移一位让位。动作：比较指针左移到下标 ${j - 1}${j - 1 < 0 ? '（左侧已无区间，key 插入下标 0）' : ''}。为什么：前缀已升序，凡是起点大于 key 起点的区间都要给 key 腾出位置。`,
        { keyStart: key[0], keyAt: k, at: j }
      )
      j -= 1
    }
    if (j >= 0) {
      snap(
        'sort-cmp',
        `观察：key = ${fmt(key)} 的起点 ${key[0]} 与下标 ${j} 的 ${fmt(arr[j])} 起点 ${arr[j][0]} 比较。判断：${arr[j][0]} ≤ ${key[0]}，它应当留在 key 左边，向左扫描到此停止。动作：插入位置锁定为下标 ${j + 1}，被越过的区间各右移一位。为什么：前缀本身升序，遇到第一个起点不大于 key 起点的区间后，它左侧的起点只会更小。`,
        { keyStart: key[0], keyAt: k, at: j }
      )
    }

    /* 原地插入：取出 key 再插到 j+1，效果等同于被越过的区间逐个右移 */
    const target = j + 1
    arr.splice(target, 0, arr.splice(k, 1)[0])
    sortedCount = k + 1
    snap(
      'sort-place',
      `观察：key = ${fmt(key)} 的插入位置是下标 ${target}，被越过的区间各右移一位。判断：本步之后前 ${sortedCount} 个区间的起点严格升序（${arr.slice(0, sortedCount).map((iv) => iv[0]).join('、')}）。动作：把 key 写回下标 ${target}，已排序前缀从 ${k} 个增长到 ${sortedCount} 个。为什么：插入排序每轮把有序前缀扩大一个，${N} 个区间共 ${N - 1} 轮，排序完成后才进入合并扫描。`,
      { keyStart: key[0], keyAt: target, at: target, sortedCount }
    )
  }

  snap(
    'sorted',
    `观察：排序完成，区间按起点升序排列为 ${fmtList(arr)}，起点依次是 ${arr.map((iv) => iv[0]).join('、')}，终点不参与排序。判断：题解实现用库排序 sort.Slice 完成这一步，只要求「按起点升序」这个结果，本演示用插入排序逐步展示比较与移动。动作：进入合并阶段，先把第一个区间放进结果列表。为什么：起点有序之后，与当前合并区间相交的区间在数组里只可能连续出现，不会断开后再出现。`
  )

  /* ---------------- 扫描合并 ---------------- */
  merged.push([arr[0][0], arr[0][1]])
  snap(
    'merge-init',
    `观察：结果列表 merged 先放入排序后的第一个区间 ${fmt(merged[0])}，它成为末尾区间 last。判断：不变量是「merged 中的区间两两不重叠、按起点升序，且并集恰好等于已处理区间的并集」，所以 curr 只可能与 last 相交。动作：让 curr 从下标 1 开始，逐个把 curr[0] 与 last[1] 比较。为什么：curr[0] ≤ last[1] 说明两者有公共点，必须合并；否则 curr 与 merged 中所有区间都不相交，只能另起一段。`,
    { blockStart: 0, lastIdx: 0 }
  )

  for (let i = 1; i < N; i++) {
    const curr = arr[i]
    const last = merged[merged.length - 1]
    const lastIdx = merged.length - 1
    const overlap = curr[0] <= last[1]

    snap(
      'cmp',
      overlap
        ? `观察：curr = ${fmt(curr)}（下标 ${i}），last = ${fmt(last)}，比较 curr[0] = ${curr[0]} 与 last[1] = ${last[1]}。判断：${curr[0]} ≤ ${last[1]}，两区间有公共点（闭区间判据，端点相等也算相交），必须合并。动作：进入合并分支，把 last[1] 更新为 max(${last[1]}, ${curr[1]}) = ${Math.max(last[1], curr[1])}。为什么：相交的两段并集仍然是连续的一段，用一个区间覆盖即可。`
        : `观察：curr = ${fmt(curr)}（下标 ${i}），last = ${fmt(last)}，比较 curr[0] = ${curr[0]} 与 last[1] = ${last[1]}。判断：${curr[0]} > ${last[1]}，两区间之间有空隙（${last[1]} < ${curr[0]}），不可能重叠。动作：进入追加分支，把 curr 作为新的末尾区间。为什么：区间已按起点升序，curr 之后区间的起点只会更大，都不会与 last 相交。`,
      { at: i, blockStart: i, lastIdx, overlap }
    )

    if (overlap) {
      const oldEnd = last[1]
      const grown = curr[1] > oldEnd
      if (grown) last[1] = curr[1]
      snap(
        'merge',
        grown
          ? `观察：last = [${last[0]},${oldEnd}] 的终点 ${oldEnd} 小于 curr[1] = ${curr[1]}。判断：新的右端点要取 max(${oldEnd}, ${curr[1]}) = ${last[1]}，不能直接赋成 curr[1]——当 curr 被 last 完全包含（如 last = [1,10]、curr = [2,3]）时直接赋值会把区间缩小。动作：last 更新为 ${fmt(last)}，起点 ${last[0]} 不变，merged 仍是 ${merged.length} 个区间。为什么：起点由排序保证已是最小，合并只需保证并集被完整覆盖。`
          : `观察：curr = ${fmt(curr)} 完全落在 last = [${last[0]},${oldEnd}] 内部。判断：并集仍是 [${last[0]},${oldEnd}]，所以终点要取 max(${oldEnd}, ${curr[1]}) = ${last[1]}，取 max 而不是覆盖才不会把区间缩小。动作：last 保持 ${fmt(last)} 不变，merged 仍是 ${merged.length} 个区间。为什么：被包含的区间不改变并集，多留一段反而会违反「两两不重叠」的不变量。`,
        { at: i, blockStart: merged.length - 1, lastIdx: merged.length - 1, overlap }
      )
    } else {
      merged.push([curr[0], curr[1]])
      snap(
        'add',
        `观察：curr = ${fmt(curr)} 与 last = ${fmt(last)} 之间有空隙，没有公共点。判断：它与 merged 里已有的每个区间都不相交（更早的区间终点都不超过 last[1] = ${last[1]}）。动作：把 ${fmt(curr)} 追加为新的末尾区间，merged 变成 ${fmtList(merged)}。为什么：不相交的两段并集无法用一个区间覆盖，只能各占一个结果区间。`,
        { at: i, blockStart: i, lastIdx: merged.length - 1, overlap }
      )
    }
  }

  snap(
    'done',
    `观察：${N} 个区间全部扫描完毕，merged = ${fmtList(merged)}，共 ${merged.length} 段。判断：它两两不重叠、按起点升序，并集恰好等于全部输入的并集，正是题目要求的结果。动作：答案读出来就是 ${fmtList(merged)}。为什么：瓶颈在按起点排序的 O(n log n)，线性扫描是 O(n)，结果数组需要 O(n) 空间。`
  )

  /* 「下一步动作」由后一个快照推出，保证 Hint 描述的是真正的下一步 */
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.kind === 'sort-pick') {
      s.next = `取下标 ${b.at} 的 ${fmt(b.arr[b.at])} 当 key，从右往左找插入位置`
    } else if (b.kind === 'sort-cmp') {
      s.next = `比较 key 起点 ${b.keyStart} 与下标 ${b.at} 的起点 ${b.arr[b.at][0]}`
    } else if (b.kind === 'sort-place') {
      s.next = `把 key ${fmt(b.arr[b.at])} 插到下标 ${b.at}，已排序前缀扩大到 ${b.sortedCount} 个`
    } else if (b.kind === 'sorted') {
      s.next = `排序结束，进入合并：merged 先放入 ${fmt(b.arr[0])}`
    } else if (b.kind === 'merge-init') {
      s.next = `取 curr = ${fmt(b.arr[1])}，与 last = ${fmt(b.merged[0])} 比较起点和终点`
    } else if (b.kind === 'cmp') {
      s.next = `比较 curr[0] = ${b.arr[b.at][0]} 与 last[1] = ${b.merged[b.lastIdx][1]}：${b.overlap ? '相交，合并到 last' : '不相交，追加为新的一段'}`
    } else if (b.kind === 'merge') {
      s.next = `把 last 的终点更新为 ${b.merged[b.lastIdx][1]}`
    } else if (b.kind === 'add') {
      s.next = `把 ${fmt(b.arr[b.at])} 追加为新的末尾区间`
    } else if (b.kind === 'done') {
      s.next = `输出最终结果：${b.merged.length} 段互不重叠的区间`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD_L = 46
const PAD_R = 22
const X_MIN = 0
const X_MAX = 18
const TICKS = Array.from({ length: X_MAX - X_MIN + 1 }, (_, v) => X_MIN + v)

const TITLE_Y = 14
const POINTER_Y = 36
const INPUT_TOP = 52
const ROW_PITCH = 30
const ROW_H = 22
const GUTTER_X = PAD_L - 6
const AXIS_Y = INPUT_TOP + (N - 1) * ROW_PITCH + ROW_H + 12
const TICK_Y = AXIS_Y + 15
const MERGED_TITLE_Y = AXIS_Y + 34
const MERGED_TOP = AXIS_Y + 42
const MERGED_PITCH = 28
const MERGED_BOTTOM = MERGED_TOP + (SEGMENTS - 1) * MERGED_PITCH + ROW_H
const H = MERGED_BOTTOM + 24

const INK = 'hsl(var(--ink))'
const INK_SOFT = 'hsl(var(--ink-soft))'
const BORDER = 'hsl(var(--border))'
/** 未处理 / 已越过：18% ink，与 TONE.muted 数值一致 */
const DIM = 'hsl(var(--ink) / 0.18)'

function Stage(step: Step) {
  const done = step.kind === 'done'
  const isSort = step.kind === 'init' || step.kind === 'sorted' || step.kind.startsWith('sort')

  const x = (v: number) => PAD_L + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - PAD_L - PAD_R)
  const left = (iv: [number, number]) => x(iv[0])
  const barW = (iv: [number, number]) => Math.max(16, x(iv[1]) - x(iv[0]))
  const mid = (iv: [number, number]) => left(iv) + barW(iv) / 2
  const rowY = (k: number) => INPUT_TOP + k * ROW_PITCH
  const mergedY = (k: number) => MERGED_TOP + k * MERGED_PITCH

  /** 输入区间填色：当前 amber、已并入当前合并块 easy、其余 dim */
  const inputFill = (k: number): string => {
    if (done || step.kind === 'sorted') return TONE.easy
    if (isSort) {
      if (step.kind === 'init') return DIM
      if (k === step.at) return TONE.amber
      return k < step.sortedCount ? TONE.easy : DIM
    }
    if (step.kind === 'merge-init') return k === 0 ? TONE.easy : DIM
    if (k === step.at) return TONE.amber
    if (k >= step.blockStart && k < step.at) return TONE.easy
    return DIM
  }

  /** 结果区填色：末尾区间 teal（curr 的比较对象），其余已并入的结果区间 easy */
  const mergedFill = (k: number): string => (!done && k === step.lastIdx ? TONE.teal : TONE.easy)

  /** 行标第二行的角色文字：不靠颜色也能读出谁被处理 */
  const roleOf = (k: number): { text: string; color: string } | null => {
    if (isSort) {
      if (step.kind === 'sort-cmp' && k === step.keyAt) return { text: 'key', color: TONE.amber }
      if (step.kind === 'sort-cmp' && k === step.at) return { text: '右移', color: TONE.amber }
      if (step.kind === 'sort-place' && k === step.at) return { text: '落位', color: TONE.amber }
      return null
    }
    if (!done && k === step.at) return { text: 'curr', color: TONE.amber }
    return null
  }

  const focusRow = isSort ? step.keyAt : step.at
  const focusLabel = isSort ? 'key' : 'curr'

  const currLabel = !isSort && step.at >= 0 ? fmt(step.arr[step.at]) : '—'
  const lastLabel = step.lastIdx >= 0 ? fmt(step.merged[step.lastIdx]) : '—'
  const lastEnd = step.lastIdx >= 0 ? step.merged[step.lastIdx][1] : -1

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 阶段标题 */}
        <text x="8" y={TITLE_Y} fontSize="11" fontWeight="700" className="fill-[hsl(var(--ink-soft))]">
          {isSort ? '输入区间 · 排序中（按起点升序）' : '输入区间 · 已按起点升序'}
        </text>

        {/* 焦点指针 + 引出线：指向本步正在处理的区间 */}
        {focusRow >= 0 && (
          <g>
            <line
              x1={mid(step.arr[focusRow])}
              x2={mid(step.arr[focusRow])}
              y1={POINTER_Y + 10}
              y2={rowY(focusRow) - 1}
              stroke={TONE.amber}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <Pointer x={mid(step.arr[focusRow])} y={POINTER_Y} label={focusLabel} tone="amber" />
          </g>
        )}

        {/* 输入区间：数轴上的横向区间条 */}
        {step.arr.map((iv, k) => {
          const role = roleOf(k)
          return (
            <g key={`iv-${k}`}>
              <rect
                className="demo-bar"
                x={left(iv)}
                y={rowY(k)}
                width={barW(iv)}
                height={ROW_H}
                rx={5}
                fill={inputFill(k)}
                stroke={role ? role.color : BORDER}
                strokeWidth="2"
                strokeDasharray={step.kind === 'sort-cmp' && k === step.keyAt ? '4 3' : undefined}
              />
              <text
                x={mid(iv)}
                y={rowY(k) + 15}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                className="font-code"
                fill={INK}
              >
                {fmt(iv)}
              </text>
              {role && (
                <text
                  x={GUTTER_X}
                  y={rowY(k) + 9}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="700"
                  className="font-code"
                  fill={role.color}
                >
                  {role.text}
                </text>
              )}
              <text
                x={GUTTER_X}
                y={rowY(k) + 20}
                textAnchor="end"
                fontSize="9.5"
                className="font-code"
                fill={INK_SOFT}
              >
                iv[{k}]
              </text>
            </g>
          )
        })}

        {/* 数轴：横向区间条与结果区共用同一条轴 */}
        <line x1={PAD_L - 8} x2={W - PAD_R + 4} y1={AXIS_Y} y2={AXIS_Y} stroke={BORDER} strokeWidth="1.5" />
        {TICKS.map((v) => (
          <g key={`tick-${v}`}>
            <line x1={x(v)} x2={x(v)} y1={AXIS_Y} y2={AXIS_Y + 4} stroke={BORDER} strokeWidth="1" />
            {v % 2 === 0 && (
              <text
                x={x(v)}
                y={TICK_Y}
                textAnchor="middle"
                fontSize="9.5"
                className="font-code"
                fill={INK_SOFT}
              >
                {v}
              </text>
            )}
          </g>
        ))}

        {/* 结果区 */}
        <text x="8" y={MERGED_TITLE_Y} fontSize="11" fontWeight="700" className="fill-[hsl(var(--ink-soft))]">
          合并结果 merged（已确定、两两不重叠）
        </text>
        {step.merged.length === 0 && (
          <text x={PAD_L} y={MERGED_TOP + 15} fontSize="10.5" fill={INK_SOFT}>
            （还没有区间进入结果列表）
          </text>
        )}
        {step.merged.map((iv, k) => (
          <g key={`m-${k}`}>
            <rect
              className="demo-bar"
              x={left(iv)}
              y={mergedY(k)}
              width={barW(iv)}
              height={ROW_H}
              rx={5}
              fill={mergedFill(k)}
              stroke={!done && k === step.lastIdx ? TONE.teal : BORDER}
              strokeWidth="2"
            />
            <text
              x={mid(iv)}
              y={mergedY(k) + 15}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              className="font-code"
              fill={INK}
            >
              {fmt(iv)}
            </text>
            {!done && k === step.lastIdx && (
              <text
                x={GUTTER_X}
                y={mergedY(k) + 9}
                textAnchor="end"
                fontSize="9"
                fontWeight="700"
                className="font-code"
                fill={TONE.teal}
              >
                last
              </text>
            )}
            <text
              x={GUTTER_X}
              y={mergedY(k) + 20}
              textAnchor="end"
              fontSize="9.5"
              className="font-code"
              fill={INK_SOFT}
            >
              m[{k}]
            </text>
          </g>
        ))}

        {/* last[1] 水位式的比较基准线：curr[0] 在它左边即相交 */}
        {!done && step.lastIdx >= 0 && (
          <g>
            <line
              x1={x(lastEnd)}
              x2={x(lastEnd)}
              y1={POINTER_Y + 10}
              y2={MERGED_BOTTOM}
              stroke={TONE.teal}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.8"
            />
            <text x={x(lastEnd)} y={H - 10} textAnchor="middle" fontSize="10" className="font-code" fill={TONE.teal}>
              last[1] = {lastEnd}
            </text>
          </g>
        )}
      </svg>

      <Badges className="mt-3">
        <Stat label="curr" value={currLabel} tone="amber" />
        <Stat label="last" value={lastLabel} tone="teal" />
        <Stat label="结果段数" value={step.merged.length} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">{fmtList(step.merged)}</b>（{step.merged.length} 段互不重叠）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MergeIntervalsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="按起点排序后一次线性扫描合并"
      info={`输入：intervals = ${fmtList(INPUT)} —— 取自题解示例 1 的四个区间，只把顺序打乱，用来展示「先按起点升序排序」这一步（示例 1 原顺序已有序），合并结果 [[1,6],[8,10],[15,18]] 与原示例一致。排序阶段用插入排序逐步展示比较与移动，题解实现调用库排序 sort.Slice，两者都只按起点升序；闭区间判据 curr[0] ≤ last[1] 中的等号不可省，端点相等也算相交（见题解示例 2 的 [1,4] 与 [4,5]）。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理的区间（排序的 key / 合并的 curr）' },
        { color: TONE.easy, label: '已确定的区间（已就位前缀 / 已并入结果的区间）' },
        { color: TONE.teal, label: '结果末尾区间 last（curr 的比较对象）' },
        { color: TONE.muted, label: '未处理，或已完成且与 curr 不相邻的旧区间' },
      ]}
    />
  )
}
