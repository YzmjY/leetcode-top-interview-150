import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 108. 将有序数组转换为二叉搜索树 —— 模式 E：上方区间色块 + 下方递归长树   */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：nums = [-10,-3,0,5,9]（升序，严格递增） */
const NUMS = [-10, -3, 0, 5, 9]
const N = NUMS.length
const COLS = Array.from({ length: N }, (_, i) => i)

/** 按题解的下中位数取法，每个元素最终落到的层：根是 nums[2] = 0 */
const FULL_DEPTH = new Map<number, number>([
  [2, 0],
  [0, 1],
  [3, 1],
  [1, 2],
  [4, 2],
])

type Phase = 'init' | 'pick' | 'none' | 'link' | 'wrap' | 'done'

interface Step {
  phase: Phase
  /** 当前调用 build(lo, hi) 的闭区间；init 为 null */
  lo: number | null
  hi: number | null
  /** 这一步定下来的根下标：pick / wrap 为实际中点；none 为 -1；link / init / done 为 null */
  mid: number | null
  /** 这一步刚挂到父节点上的孩子下标（link 用） */
  linked: number | null
  /** 递归深度（pick / none / wrap 有值） */
  depth: number | null
  /** 已入树的节点下标（不可变快照） */
  created: number[]
  /** 已连好的父子边快照 */
  edges: { from: number; to: number }[]
  /** 下一步动作；由后一个快照统一回填，保证 Hint 描述的是真正的下一步 */
  next: string
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const created: number[] = []
  const edges: { from: number; to: number }[] = []
  const depth = new Map<number, number>()
  /** 当前递归路径上的调用，栈顶在末尾：负责区间标色 */
  const walk: { lo: number; hi: number }[] = []
  let lastCall: { lo: number; hi: number } | null = null

  const snap = (
    phase: Phase,
    o: {
      lo?: number | null
      hi?: number | null
      mid?: number | null
      linked?: number | null
      depth?: number | null
      note: string
    }
  ) => {
    steps.push({
      phase,
      lo: o.lo ?? null,
      hi: o.hi ?? null,
      mid: o.mid === undefined ? null : o.mid,
      linked: o.linked ?? null,
      depth: o.depth === undefined ? null : o.depth,
      created: created.slice(),
      edges: edges.map((e) => ({ ...e })),
      next: '',
      note: o.note,
    })
  }

  snap('init', {
    note: `观察：nums = [${NUMS.join(', ')}] 已经严格升序，中序遍历一棵 BST 得到的正是升序序列。判断：只要让「中序 = 原数组」就自动满足 BST，再让每次取的中点把区间尽量均分，左右子树高度差就不会超过 1。动作：从 build(0, ${N - 1}) 开始递归，每层取 mid = lo + ⌊(hi-lo)/2⌋ 当根，再分别递归 [lo, mid-1] 与 [mid+1, hi]。为什么：左半段与右半段的长度最多相差 1，每层都如此，树高就只有 O(log n)。`,
  })

  function build(lo: number, hi: number, d: number): number | null {
    walk.push({ lo, hi })

    if (lo > hi) {
      // 递归出口：空区间
      let note = `观察：调用 build(${lo}, ${hi}) 时 lo = ${lo} > hi = ${hi}，区间里一个元素也没有。判断：这是递归出口，必须用 lo > hi 而不是 lo == hi，否则单元素区间无法终止。动作：返回 null，不创建任何节点。`
      if (lastCall) {
        const t = NUMS[lastCall.lo]
        const side = hi < lastCall.lo ? '左' : '右'
        note += `为什么：于是 ${t} 的${side}孩子就是空，这一侧不再往下长。`
      } else {
        note += '为什么：整个数组为空时同样在这里立刻返回 null。'
      }
      walk.pop()
      snap('none', { lo, hi, mid: -1, depth: d, note })
      return null
    }

    const mid = lo + Math.floor((hi - lo) / 2)
    lastCall = { lo, hi }
    created.push(mid)
    depth.set(mid, d)
    snap('pick', {
      lo,
      hi,
      mid,
      depth: d,
      note: `观察：调用 build(${lo}, ${hi})，区间里有 ${hi - lo + 1} 个元素。判断：mid = ${lo} + ⌊(${hi}-${lo})/2⌋ = ${mid}，取 nums[${mid}] = ${NUMS[mid]} 当根，左半段 [${lo}, ${mid - 1}]、右半段 [${mid + 1}, ${hi}]。动作：先递归左半段 build(${lo}, ${mid - 1})，再把右半段交给 build(${mid + 1}, ${hi})。为什么：原数组中左半段的元素都小于 ${NUMS[mid]}、右半段都大于它，这样挂出来必然满足 BST，而且两段长度最多差 1。`,
    })

    const li = build(lo, mid - 1, d + 1)
    if (li !== null) {
      edges.push({ from: mid, to: li })
      snap('link', {
        lo,
        hi,
        linked: li,
        note: `观察：左半段 [${lo}, ${mid - 1}] 递归完成，返回的子树根是 nums[${li}] = ${NUMS[li]}。判断：这段区间里的所有元素都小于 ${NUMS[mid]}，所以它可以整棵挂到左边。动作：连一条边 ${NUMS[mid]} → ${NUMS[li]}，作为 ${NUMS[mid]} 的左孩子。为什么：挂上后中序读出来仍然是 ${NUMS.slice(lo, hi + 1).join(', ')} 这一段升序。`,
      })
    }

    const ri = build(mid + 1, hi, d + 1)
    if (ri !== null) {
      edges.push({ from: mid, to: ri })
      snap('link', {
        lo,
        hi,
        linked: ri,
        note: `观察：右半段 [${mid + 1}, ${hi}] 递归完成，返回的子树根是 nums[${ri}] = ${NUMS[ri]}。判断：这段区间里的所有元素都大于 ${NUMS[mid]}，所以它可以整棵挂到右边。动作：连一条边 ${NUMS[mid]} → ${NUMS[ri]}，作为 ${NUMS[mid]} 的右孩子。为什么：左右子树各自都是 BST，拼上根之后整棵仍是 BST。`,
      })
    }

    walk.pop()
    snap('wrap', {
      lo,
      hi,
      mid,
      depth: d,
      note: `观察：区间 [${lo}, ${hi}] 的左右子调用都已返回，根 ${NUMS[mid]} 的整棵子树成型。判断：这段区间的 ${hi - lo + 1} 个元素恰好各建了一个节点，不重不漏${d === 0 ? '，它就是整棵树' : ''}。动作：把根 ${NUMS[mid]} 返回给上一层调用。为什么：上一层只关心「这段区间交回来的子树根是谁」，返回值就是 ${NUMS[mid]}。`,
    })
    return mid
  }

  build(0, N - 1, 0)

  snap('done', {
    note: `观察：build(0, ${N - 1}) 返回根 ${NUMS[2]}，5 个元素全部变成节点，边也全部连好。判断：中序遍历这棵树得到 ${NUMS.join(', ')}，与原数组完全一致，所以它是合法 BST；每个节点都是所在区间的中点，左右子树高度差不超过 1。动作：答案就是这棵树（题解的下中位数取法得到层序 [0,-10,5,null,-3,null,9]，与题面示例的 [0,-3,9,-10,null,5] 形状不同但同样正确）。为什么：每个元素只当过一次根，时间 O(n)；递归栈最深等于树高，空间 O(log n)。`,
  })

  // 「下一步」统一由后一个快照回填，保证 Hint 真的是下一步动作
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i]
    const b = steps[i + 1]
    if (b.phase === 'pick' && b.mid !== null) {
      a.next = `取区间 [${b.lo}, ${b.hi}] 的中点 ${b.mid}，用 nums[${b.mid}] = ${NUMS[b.mid]} 建根`
    } else if (b.phase === 'none') {
      a.next =
        a.phase === 'pick'
          ? `递归左半段 [${b.lo}, ${b.hi}]，它是空区间，直接返回 null`
          : `递归区间 [${b.lo}, ${b.hi}]，它是空区间，直接返回 null`
    } else if (b.phase === 'link' && b.linked !== null) {
      const parent = b.edges[b.edges.length - 1].from
      a.next = `把刚建好的子树根 nums[${b.linked}] = ${NUMS[b.linked]} 挂到 nums[${parent}] 的孩子位上`
    } else if (b.phase === 'wrap' && b.mid !== null) {
      a.next = `区间 [${b.lo}, ${b.hi}] 左右都已完成，把根 ${NUMS[b.mid]} 返回上一层`
    } else if (b.phase === 'done') {
      a.next = '递归全部返回，输出这棵树'
    }
  }

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 树图坐标：x 按中序展开（= 数组下标），y 按层 */
const W = 660
const PAD_X = 60
const COL_STEP = (W - PAD_X * 2) / (N - 1)
const TOP = 50
const ROW_STEP = 96
const R = 22
const GRID_MAX = 336

const posX = (i: number) => PAD_X + COL_STEP * i
const posY = (d: number) => TOP + d * ROW_STEP

const LABEL: Record<'current' | 'back' | 'ok' | 'pending', string> = {
  current: '刚建',
  back: '回溯中',
  ok: '已成树',
  pending: '待建',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const curMid = step.mid !== null && step.mid >= 0 ? step.mid : null
  const built = new Set(step.created)
  const edgeState = new Map<number, 'amber' | 'teal' | 'easy'>()
  for (const e of step.edges) {
    edgeState.set(
      e.to,
      step.linked === e.to ? 'amber' : step.phase === 'wrap' && e.from === curMid ? 'teal' : 'easy'
    )
  }

  const loRaw = step.lo ?? 0
  const hiRaw = step.hi ?? -1
  const rangeLo = Math.max(0, Math.min(loRaw, N - 1))
  const rangeHi = Math.min(N - 1, Math.max(hiRaw, 0))
  const showRange = !done && step.phase !== 'init' && loRaw <= hiRaw && loRaw <= N - 1 && hiRaw >= 0

  const cellState = (i: number): CellState => {
    if (done) return built.has(i) ? 'ok' : 'dim'
    if (i === curMid) return 'active'
    if (showRange && i >= rangeLo && i <= rangeHi) return 'warn'
    if (built.has(i)) return 'ok'
    return 'dim'
  }

  const roleText =
    step.phase === 'pick'
      ? `新建节点 nums[${curMid}] = ${NUMS[curMid as number]}`
      : step.phase === 'wrap'
        ? `区间 [${loRaw}, ${hiRaw}] 的子树已完成，根 nums[${curMid}] 向上返回`
        : step.phase === 'link'
          ? `刚连好 ${NUMS[step.edges[step.edges.length - 1].from]} → ${NUMS[step.linked as number]}`
          : step.phase === 'none'
            ? `lo = ${loRaw} > hi = ${hiRaw}，空区间 → null`
            : done
              ? `中序 = [${NUMS.join(', ')}]`
              : `准备调用 build(0, ${N - 1})`
  const roleTone: 'amber' | 'teal' | 'easy' | 'plain' =
    step.phase === 'pick' || step.phase === 'link'
      ? 'amber'
      : step.phase === 'wrap'
        ? 'teal'
        : done
          ? 'easy'
          : 'plain'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 数组行：半透明色块标出当前递归区间 [lo, hi]，中点用琥珀 */}
      <div className="flex w-full flex-col items-center gap-2">
        <div
          className="grid w-full gap-1.5"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, maxWidth: GRID_MAX }}
        >
          {/* 旗标层：中点旗标（渲染上位于色块与单元格之前，不参与遮挡） */}
          <div className="col-span-full grid gap-1.5" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
            {COLS.map((i) => (
              <div key={`flag-${i}`} className="flex h-6 items-end justify-center">
                {i === curMid && (
                  <span className="flex flex-col items-center leading-none">
                    <span className="font-code text-[11px] font-bold text-[hsl(var(--amber))]">mid</span>
                    <span className="text-[8px] text-[hsl(var(--amber))]">▼</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 区间色块层：半透明 water 块，横跨 [lo, hi] */}
          {showRange && (
            <div
              aria-hidden
              className="pointer-events-none self-stretch rounded-lg border border-dashed border-[hsl(var(--water))]/70 bg-[hsl(var(--water))]/[0.12]"
              style={{ gridColumn: `${rangeLo + 1} / span ${rangeHi - rangeLo + 1}` }}
            />
          )}

          {/* 数值层：每个元素一个格子 */}
          {COLS.map((i) => (
            <Cell key={`cell-${i}`} state={cellState(i)} className="w-full min-w-0 sm:min-w-0">
              {NUMS[i]}
            </Cell>
          ))}
        </div>

        {/* 下标行：活动区间的 lo / hi 有字母标签，不靠颜色区分 */}
        <div
          className="grid w-full gap-1.5"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, maxWidth: GRID_MAX }}
        >
          {COLS.map((i) => (
            <div key={`idx-${i}`} className="flex flex-col items-center leading-none">
              <span
                className={cn(
                  'font-code text-[11px]',
                  i === curMid
                    ? 'font-bold text-[hsl(var(--amber))]'
                    : showRange && i >= rangeLo && i <= rangeHi
                      ? 'font-bold text-[hsl(var(--water))]'
                      : 'text-ink-soft'
                )}
              >
                {i}
              </span>
              {showRange && i === rangeLo && (
                <span className="mt-0.5 font-code text-[10px] font-bold text-[hsl(var(--water))]">lo</span>
              )}
              {showRange && i === rangeHi && rangeHi !== rangeLo && (
                <span className="mt-0.5 font-code text-[10px] font-bold text-[hsl(var(--water))]">hi</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 树图：节点圆 r 22，边先画、节点后画 */}
      <svg viewBox={`0 0 ${W} 296`} className="w-full select-none">
        {step.edges.map((e) => {
          const st = edgeState.get(e.to) ?? 'easy'
          const stroke =
            st === 'amber'
              ? 'hsl(var(--amber))'
              : st === 'teal'
                ? 'hsl(var(--teal))'
                : 'hsl(var(--easy))'
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={posX(e.from)}
              y1={posY(FULL_DEPTH.get(e.from) as number)}
              x2={posX(e.to)}
              y2={posY(FULL_DEPTH.get(e.to) as number)}
              stroke={stroke}
              strokeWidth={st === 'amber' ? 3.5 : 2}
            />
          )
        })}

        {COLS.map((i) => {
          const d = FULL_DEPTH.get(i) as number
          const cx = posX(i)
          const cy = posY(d)
          const isBuilt = built.has(i)
          const isCur = i === curMid
          const fill = !isBuilt
            ? 'hsl(var(--card))'
            : isCur
              ? 'hsl(var(--amber-soft))'
              : step.phase === 'wrap'
                ? 'hsl(var(--teal-soft))'
                : 'hsl(var(--easy-soft))'
          const stroke = !isBuilt
            ? 'hsl(var(--border))'
            : isCur
              ? 'hsl(var(--amber))'
              : step.phase === 'wrap'
                ? 'hsl(var(--teal))'
                : 'hsl(var(--easy))'
          const textFill = !isBuilt
            ? 'hsl(var(--ink-soft))'
            : isCur
              ? 'hsl(var(--amber))'
              : step.phase === 'wrap'
                ? 'hsl(var(--teal))'
                : 'hsl(var(--easy))'
          const label = !isBuilt
            ? LABEL.pending
            : isCur
              ? step.phase === 'wrap'
                ? LABEL.back
                : LABEL.current
              : LABEL.ok
          return (
            <g key={`node-${i}`} className={isCur ? 'demo-water' : undefined}>
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCur ? 3 : 2}
                strokeDasharray={isBuilt ? undefined : '5 4'}
              />
              <text
                x={cx}
                y={cy + 6}
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                className="font-code"
                fill={textFill}
              >
                {isBuilt ? NUMS[i] : '?'}
              </text>
              <text
                x={cx}
                y={cy + R + 14}
                textAnchor="middle"
                fontSize="10"
                className="font-code"
                fill="hsl(var(--ink-soft))"
              >
                {`nums[${i}] · `}
                <tspan fill={isBuilt ? textFill : 'hsl(var(--ink-soft))'}>{label}</tspan>
              </text>
            </g>
          )
        })}
      </svg>

      <Badges className="justify-center">
        <Stat
          label="当前调用"
          value={
            step.phase === 'init'
              ? '未开始'
              : done
                ? 'build 已全部返回'
                : `build(${loRaw}, ${hiRaw})`
          }
          tone="teal"
        />
        <Stat label="已建节点" value={step.created.length} tone="easy" />
        <Badge tone={roleTone}>{roleText}</Badge>
        {done ? (
          <Answer>
            <span className="font-code">
              根 {NUMS[2]}（层序 [0,-10,5,null,-3,null,9]）
            </span>
          </Answer>
        ) : (
          step.next && <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function ConvertSortedArrayToBinarySearchTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="每次取区间中点当根，递归长出平衡 BST"
      info={`nums = [-10,-3,0,5,9]（题解示例 1，5 个元素，全部演示、无取舍）。上方数组行用半透明色块标出当前递归区间 [lo, hi]、中点用琥珀；下方按中序 x / 层 y 同步长出树节点。更新后的题解取「下中位数」，得到根 0 且左 0→-10→-3、右 0→5→9，与题面示例 [0,-3,9,-10,null,5] 形状不同但同样正确。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步的中点 / 刚挂上的边（旗标 mid、节点旁「刚建」）' },
        { color: TONE.water, label: '当前递归区间 [lo, hi]（半透明色块 + lo/hi 字母）' },
        { color: TONE.easy, label: '已确定并入树的节点' },
        { color: TONE.teal, label: '回溯：当前区间的子树已完成、向上返回' },
        { color: TONE.muted, label: '未处理 / 当前区间之外' },
      ]}
    />
  )
}
