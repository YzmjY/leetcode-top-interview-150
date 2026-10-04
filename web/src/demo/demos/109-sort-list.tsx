import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 109. 排序链表 —— 模式 D：自顶向下归并排序（快慢指针切分 + 双指针合并）  */
/* ------------------------------------------------------------------ */

/** 题解示例 1（有代表性且规模最小）：head = [4,2,1,3] → [1,2,3,4] */
const HEAD = [4, 2, 1, 3]
const SORTED = [...HEAD].sort((a, b) => a - b)

/** 链表中点的下标：slow 从 lo 出发、fast 从 lo+1 出发，fast 走到段尾时 slow 停在中点 */
function midIndex(lo: number, hi: number): number {
  let slow = lo
  let fast = lo + 1
  while (fast + 1 < hi) {
    slow += 1
    fast += 2
  }
  return slow
}

/** 一段已排好序的连续区间 [lo, hi)，值按 order 里的原链表下标依次读出（归并只重连指针） */
interface Segment {
  lo: number
  hi: number
  order: number[]
}

interface MergeState {
  lo: number
  mid: number
  hi: number
  left: Segment
  right: Segment
  i: number
  j: number
  out: number[]
  picked: number
  from: 'L' | 'R' | null
}

interface Step {
  phase: 'init' | 'split' | 'base' | 'merge-pick' | 'merge-rest' | 'done'
  /** 当前递归处理的子链表区间 [lo, hi) */
  lo: number
  hi: number
  /** 已经排好序的连续区间，按 lo 升序 */
  segments: Segment[]
  /** init / split：slow、fast 在 [lo, hi) 内的下标；其余为 null */
  slow: number | null
  fast: number | null
  merge: MergeState | null
  /** 递归调用栈，最后一项是当前调用 */
  stack: string[]
  /** 已排好序的节点数（用于状态徽章） */
  sortedCount: number
  note: string
  /** 真正的下一步动作；由后一个快照回填，供 Hint 使用（「下一步：」前缀由组件硬编码） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []
  let sorted: Segment[] = []
  let sortedCount = 0

  const segText = (s: Segment) => `[${s.order.map((idx) => HEAD[idx]).join(', ')}]`

  function snap(s: Partial<Step> & { note: string }): void {
    steps.push({
      phase: 'init',
      lo: 0,
      hi: HEAD.length,
      segments: sorted.slice(),
      slow: null,
      fast: null,
      merge: null,
      stack: stack.slice(),
      sortedCount,
      next: '',
      ...s,
    })
  }

  /** 0 / 1 个节点的段天然有序，直接返回、不再分割 */
  function baseStep(lo: number, hi: number): void {
    sorted = [...sorted, { lo, hi, order: [lo] }]
    sortedCount += hi - lo
    snap({
      phase: 'base',
      lo,
      hi,
      note: `观察：进入 sortList(${segText({ lo, hi, order: [lo] })})，这一段只有 ${hi - lo} 个节点。判断：先检查 head == nil || head.Next == nil，单节点链天然有序，根本不需要找中点。动作：直接返回这一段，父调用把 [${lo}, ${hi}) 记为已排好。为什么必须先判空再找中点：空链或单节点链上快慢指针的下一步会落到 nil 上，越界访问就会崩。`,
    })
  }

  /** 快慢指针找中点：slow 停在左半末尾，从 slow.Next 断开 */
  function splitStep(lo: number, hi: number, mid: number): void {
    let slow = lo
    let fast = lo + 1
    snap({
      phase: 'split',
      lo,
      hi,
      slow,
      fast,
      note: `观察：段 [${lo}, ${hi}) = [${HEAD.slice(lo, hi).join(', ')}] 还没排好，先把快慢指针初始化成 slow = head（下标 ${lo}，节点 ${HEAD[lo]}）、fast = head.Next（下标 ${lo + 1}，节点 ${HEAD[lo + 1]}）。判断：fast != nil 且 fast.Next != nil，循环条件成立，两个指针都要往前走。动作：slow 走 1 步、fast 走 2 步，边走边判。为什么初始化成 head 与 head.Next 而不是都从 head 出发：这样偶数长度时左半比右半短，n = 2 时正好拆成 1 + 1，不会出现 mid = nil 导致左半仍是整条链的无限递归。`,
    })

    while (fast + 1 < hi) {
      slow += 1
      fast += 2
      const goingOn = fast + 1 < hi
      snap({
        phase: 'split',
        lo,
        hi,
        slow,
        fast: fast < hi ? fast : null,
        note: `观察：slow 前进到下标 ${slow}（节点 ${HEAD[slow]}）；fast 前进两格到${fast < hi ? `下标 ${fast}（节点 ${HEAD[fast]}）` : '段尾之外（nil）'}。判断：${goingOn ? 'fast 及其后继都不为空，这一轮还不该停' : `fast 已到段尾之外，循环到此结束，slow 停在下标 ${slow}`}。动作：${goingOn ? '再让 slow 走 1 步、fast 走 2 步' : `取 mid = slow.Next = 下标 ${mid}，把这个位置记为右半的起点`}。为什么这样能找中点：fast 的速度是 slow 的 2 倍，fast 到段尾时 slow 恰好走过一半。`,
      })
    }

    snap({
      phase: 'split',
      lo,
      hi,
      slow,
      fast: null,
      note: `观察：循环结束，slow 停在下标 ${slow}（节点 ${HEAD[slow]}），mid = slow.Next 落在下标 ${mid}（节点 ${HEAD[mid]}）。判断：从 ${HEAD[slow]}.Next 处断开，这一段就被切成两段连续、互不重叠的子链表。动作：执行 slow.Next = nil，左半 [${lo}, ${mid}) = [${HEAD.slice(lo, mid).join(', ')}]、右半 [${mid}, ${hi}) = [${HEAD.slice(mid, hi).join(', ')}]，接着分别递归 sortList。为什么必须先断开再递归：归并的两条链都要以 nil 结尾，否则合并时会顺着旧指针串回另一段里去。`,
    })
  }

  /** 合并两条已排序子链：每次取头部较小者接到结果链尾部 */
  function mergeStep(lo: number, mid: number, hi: number, left: Segment, right: Segment): void {
    const lv = left.order.map((idx) => HEAD[idx])
    const rv = right.order.map((idx) => HEAD[idx])

    let i = 0
    let j = 0
    const out: number[] = []
    const base = {
      lo,
      hi,
      segments: sorted.slice(),
      slow: null,
      fast: null,
      stack: stack.slice(),
      sortedCount,
      next: '',
    }

    snap({
      ...base,
      phase: 'merge-pick',
      merge: { lo, mid, hi, left, right, i, j, out: [], picked: -1, from: null },
      note: `观察：本次合并的两条子链是 [${lv.join(', ')}] 与 [${rv.join(', ')}]（${lv.length} + ${rv.length} = ${hi - lo} 个节点，段内节点数对得上）。判断：两条链各自的头节点 ${lv[0]} 与 ${rv[0]} 就是本链剩余元素里的最小值，所以每次只要比这两个头。动作：建哨兵 dummy、cur = dummy，进入循环比较两个链头并把较小者接到 cur.Next。为什么用 dummy：返回值固定是 dummy.Next，哨兵让「结果链还为空」这种情形不需要额外分支。`,
    })

    while (i < lv.length && j < rv.length) {
      const a = lv[i]
      const b = rv[j]
      const takeLeft = a < b
      const val = takeLeft ? a : b
      const from: 'L' | 'R' = takeLeft ? 'L' : 'R'
      const picked = takeLeft ? left.order[i] : right.order[j]
      if (takeLeft) i += 1
      else j += 1
      out.push(val)

      snap({
        ...base,
        phase: 'merge-pick',
        merge: {
          lo,
          mid,
          hi,
          left,
          right,
          i,
          j,
          out: out.slice(),
          picked,
          from,
        },
        note: `观察：左链当前头是 ${a}、右链当前头是 ${b}，比较 ${a} < ${b} ${takeLeft ? '成立' : '不成立'}。判断：${a === b ? '两个值相等，按题解的约定取左链节点（比较用严格小于号，相等时保持稳定）' : `${val} 更小，它就是两条链剩余元素里的最小值`}，${takeLeft ? '左链' : '右链'}的指针后移一位（i = ${i}，j = ${j}）。动作：让 cur.Next 指向节点 ${val}，把它接到结果链尾部，结果变成 [${out.join(', ')}]。为什么接上的节点一定不大于后面所有节点：摘走链头后那条链的新头只会更大，${val} 仍不大于两个新头，结果链的非递减不变量保持。`,
      })
    }

    const restSide: 'L' | 'R' | null = i < lv.length ? 'L' : j < rv.length ? 'R' : null
    const restValues = restSide === 'L' ? lv.slice(i) : restSide === 'R' ? rv.slice(j) : []
    const lastMerged = out[out.length - 1]
    out.push(...restValues)

    snap({
      ...base,
      phase: 'merge-rest',
      merge: { lo, mid, hi, left, right, i: lv.length, j: rv.length, out: out.slice(), picked: -1, from: restSide },
      note:
        restSide !== null
          ? `观察：${restSide === 'L' ? '右链' : '左链'}的节点已全部摘下，${restSide === 'L' ? '左链' : '右链'}还剩 [${restValues.join(', ')}] 没接。判断：while 条件「l1 != nil && l2 != nil」不再成立，而剩下的这一段本身有序、头节点 ${restValues[0]} 也不小于已合并部分的最后一个元素 ${lastMerged}。动作：让 cur.Next 指向剩余段，把 [${restValues.join(', ')}] 整段一次接到结果链末尾，得到 [${out.join(', ')}]。为什么可以整段挂接：这一段是那条链剩余的全部节点，它们之间的指针从未被改动。`
          : `观察：两条链的节点都已摘下，i 和 j 同时走到各自长度（${lv.length} 与 ${rv.length}）。判断：while 条件不再成立，没有剩余节点需要挂接。动作：直接返回 dummy.Next。为什么：结果链此时已经含有这一段全部 ${hi - lo} 个节点。`,
    })
  }

  /** 在左右两半各自的局部查找表里解析出「整段有序结果」 */
  function resolveScope(lo: number, hi: number, saved: Segment[]): Segment {
    const hit = saved.filter((s) => s.lo >= lo && s.hi <= hi).sort((p, q) => p.lo - q.lo)
    return { lo, hi, order: hit.flatMap((s) => s.order) }
  }

  function go(lo: number, hi: number, depth: number): Segment {
    stack.push(`sortList([${HEAD.slice(lo, hi).join(', ')}]) · 深度 ${depth}`)
    if (hi - lo <= 1) {
      baseStep(lo, hi)
      stack.pop()
      return { lo, hi, order: [lo] }
    }
    const mid = midIndex(lo, hi)
    splitStep(lo, hi, mid)
    go(lo, mid, depth + 1)
    const afterLeft = sorted.slice()
    go(mid, hi, depth + 1)
    const afterRight = sorted.slice()

    const left = resolveScope(lo, mid, afterLeft)
    const right = resolveScope(mid, hi, afterRight)
    mergeStep(lo, mid, hi, left, right)

    const merged: Segment = {
      lo,
      hi,
      order: [...left.order, ...right.order].sort((a, b) => HEAD[a] - HEAD[b]),
    }
    sorted = [...sorted.filter((s) => s.hi <= lo || s.lo >= hi), merged].sort((p, q) => p.lo - q.lo)
    sortedCount += hi - lo
    stack.pop()
    return merged
  }

  snap({
    phase: 'init',
    note: `观察：head = [${HEAD.join(', ')}]，即链表 ${HEAD.join(' → ')}；n = ${HEAD.length} > 1，所以不满足 head == nil || head.Next == nil 的直接返回条件。判断：归并排序每层把规模减半、共 log n 层，每层合并总代价 O(n)，总时间 O(n log n)；自顶向下写法的额外空间是递归栈 O(log n)。动作：调用 sortList([${HEAD.join(', ')}])，先快慢指针找中点断开，再分别排序两半，最后合并两条有序链。为什么链表排序首选归并：链表不能随机访问，快排 partition 要来回跳，而归并只需顺序扫描、合并时只改指针、不新建节点。`,
  })

  go(0, HEAD.length, 1)

  snap({
    phase: 'done',
    hi: HEAD.length,
    note: `结论：整条链表已经有序，从头读出 [${SORTED.join(', ')}]。判断：此时不存在未处理的段，递归归并已经结束，[0, ${HEAD.length}) 就是一段有序链。动作：返回 dummy.Next，即排序后链表的头节点。为什么复杂度是 O(n log n) / O(log n)：每层合并代价 O(n)、共 log n 层，空间只用了递归栈与常数个指针（不计待排序节点本身）。`,
  })

  // 「下一步」由后一个快照回填，保证 Hint 描述的一定是尚未发生的动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'split' && b.slow !== null && b.fast !== null) {
      s.next = `从下标 ${b.slow} 出发：slow 指向 ${b.slow}、fast 指向 ${b.fast}，再各自前进`
    } else if (b.phase === 'split' && b.slow !== null) {
      s.next = `slow 停在下标 ${b.slow}，执行 mid = slow.Next 并从下标 ${b.slow + 1} 断开`
    } else if (b.phase === 'base') {
      s.next = `递归处理单节点子链 [${HEAD[b.lo]}]，它天然有序、直接返回`
    } else if (b.phase === 'merge-pick' && b.merge) {
      const m = b.merge
      if (m.picked < 0) {
        s.next = `合并 [${m.left.order.map((x) => HEAD[x]).join(', ')}] 与 [${m.right.order.map((x) => HEAD[x]).join(', ')}]：建哨兵 dummy，比较 l1、l2 两个链头`
      } else if (m.from !== null && m.picked >= 0) {
        const l1 = m.left.order[m.i] === undefined ? null : HEAD[m.left.order[m.i]]
        const l2 = m.right.order[m.j] === undefined ? null : HEAD[m.right.order[m.j]]
        s.next =
          l1 !== null && l2 !== null
            ? `比较左链头 ${l1} 与右链头 ${l2}，取较小者接到 cur.Next`
            : `把 ${HEAD[m.picked]} 接到 cur.Next`
      }
    } else if (b.phase === 'merge-rest') {
      s.next =
        b.merge && b.merge.from !== null
          ? `把剩余段整段接到 cur.Next，得到 [${(b.merge?.out ?? []).join(', ')}]`
          : '返回 dummy.Next，这一段合并结束'
    } else if (b.phase === 'done') {
      s.next = '所有段已排好，返回结果链的头节点'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const done = step.phase === 'done'
  const merge = step.merge
  const pickedIdx = merge ? merge.picked : -1

  /** 节点状态：本步正在处理的段 = amber，已排好的段 = easy 绿，未处理 = 白 */
  const nodeState = (idx: number): 'idle' | 'active' | 'ok' => {
    if (done) return 'ok'
    if (step.phase === 'base' && idx === step.lo) return 'active'
    if (step.phase === 'split' && idx >= step.lo && idx < step.hi) return 'active'
    if (idx === pickedIdx) return 'active'
    if (step.segments.some((s) => idx >= s.lo && idx < s.hi)) return 'ok'
    return 'idle'
  }

  /** 节点旗标：split 显示 slow / fast，merge 显示两条链的当前头指针 */
  const flagOf = (idx: number): { label: string; tone: 'amber' | 'teal' } | undefined => {
    if (done) return undefined
    if (step.phase === 'split') {
      const isSlow = step.slow === idx
      const isFast = step.fast === idx
      if (isSlow && isFast) return { label: 'slow·fast', tone: 'amber' }
      if (isSlow) return { label: 'slow', tone: 'amber' }
      if (isFast) return { label: 'fast', tone: 'teal' }
      return undefined
    }
    if (merge && (step.phase === 'merge-pick' || step.phase === 'merge-rest')) {
      const isL1 = merge.left.order[merge.i] === idx
      const isL2 = merge.right.order[merge.j] === idx
      if (isL1 && isL2) return { label: 'l1·l2', tone: 'teal' }
      if (isL1) return { label: 'l1', tone: 'teal' }
      if (isL2) return { label: 'l2', tone: 'teal' }
      return undefined
    }
    return undefined
  }

  /** 段边界标签：split 标出左右两半的起点，merge 标出两条链在数组里的起点 */
  const segLabel = (idx: number): string | undefined => {
    if (done) return undefined
    if (step.phase === 'split' && step.slow !== null) {
      if (idx === step.lo) return `L 左半 [${step.lo}, ${step.slow + 1})`
      if (idx === step.slow + 1) return `R 右半 [${step.slow + 1}, ${step.hi})`
      return undefined
    }
    if (merge && step.phase === 'merge-pick') {
      if (idx === merge.lo) return 'l1 起点'
      if (idx === merge.mid) return 'l2 起点'
      return undefined
    }
    return undefined
  }

  /** 已排好的段与本步处理段的交界处，用虚边框提示「段」的边界 */
  const isBoundary = (idx: number): boolean =>
    !done && step.segments.some((s) => s.hi === idx && idx < HEAD.length)

  const inMerge = step.phase === 'merge-pick' || step.phase === 'merge-rest'

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* 递归调用栈：最后一项是当前调用 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] text-ink-soft">递归调用栈</span>
        {step.stack.map((f, k) => (
          <span
            key={f}
            className={
              k === step.stack.length - 1
                ? 'rounded-lg border border-[hsl(var(--teal))]/40 bg-[hsl(var(--teal-soft))] px-2 py-0.5 font-code text-[11px] text-[hsl(var(--teal))]'
                : 'rounded-lg border border-border bg-card px-2 py-0.5 font-code text-[11px] text-ink-soft'
            }
          >
            {f}
          </span>
        ))}
      </div>

      {/* 已排好序的连续段 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] text-ink-soft">已排好的段</span>
        {step.segments.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">（暂无）</span>
        ) : (
          step.segments.map((s) => (
            <span
              key={`${s.lo}-${s.hi}`}
              className="rounded-lg border border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code text-[11px] text-[hsl(var(--easy))]"
            >
              {s.order.map((idx) => HEAD[idx]).join(' → ')}
            </span>
          ))
        )}
      </div>

      {/* 链表行：节点位置固定，靠色块区分「本步处理的段 / 已排好的段 / 未处理」 */}
      <div className="flex w-full items-start justify-center gap-1">
        {HEAD.map((v, idx) => {
          const flag = flagOf(idx)
          const label = segLabel(idx)
          return (
            <div key={idx} className="flex min-w-0 items-start">
              {idx > 0 && (
                <div className="flex h-11 items-center self-end">
                  <Link active={inMerge} />
                </div>
              )}
              <div className="flex flex-col items-center">
                <Flag label={flag?.label ?? label} tone={flag?.tone ?? 'amber'} />
                <Node
                  state={nodeState(idx)}
                  className={isBoundary(idx) ? 'border-dashed border-[hsl(var(--ink))]/30' : undefined}
                >
                  {v}
                </Node>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{idx}</span>
              </div>
            </div>
          )
        })}
        {/* fast 走出段尾时停在 nil 上 */}
        {!done && step.phase === 'split' && step.fast === null && (
          <div className="flex min-w-0 items-start">
            <div className="flex h-11 items-center self-end">
              <Link active />
            </div>
            <div className="flex flex-col items-center">
              <Flag label="fast" tone="teal" />
              <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border px-2 font-code text-xs text-ink-soft">
                nil
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 本步合并出的结果链：只画已经接好的前缀 */}
      {merge && !done && (
        <div className="flex w-full flex-col items-center gap-1">
          <span className="text-[11px] text-ink-soft">
            {step.phase === 'merge-rest' ? '本段合并结果' : '结果链（边比较边长）'}
          </span>
          <div className="flex flex-wrap items-center justify-center">
            {merge.out.length === 0 ? (
              <span className="font-code text-[11px] text-ink-soft">（dummy 之后还没有节点）</span>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <Flag label="dummy" tone="ink" />
                  <Node className="border-dashed px-2 text-[11px] font-normal text-ink-soft">
                    dummy
                  </Node>
                </div>
                {merge.out.map((v, k) => {
                  const isCur = step.phase === 'merge-pick' && k === merge.out.length - 1
                  return (
                    <div key={`${k}-${v}`} className="flex items-center">
                      <Link active={isCur} />
                      <div className="flex flex-col items-center">
                        <Flag label={isCur ? 'cur' : undefined} tone="amber" />
                        <Node state={isCur ? 'active' : 'ok'}>{v}</Node>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      <Badges className="justify-center">
        {done ? (
          <Stat label="排序结果" value={`[${SORTED.join(', ')}]`} tone="easy" />
        ) : (
          <Stat label="当前段" value={`[${HEAD.slice(step.lo, step.hi).join(', ')}]`} tone="amber" />
        )}
        <Stat label="已排好节点" value={`${step.sortedCount} / ${HEAD.length}`} tone="easy" />
        <Stat label="递归深度" value={step.stack.length} tone="teal" />
        {!done && step.next !== '' && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            排序后链表 <b className="font-code">[{SORTED.join(', ')}]</b>，时间{' '}
            <b className="font-code">O(n log n)</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SortListDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="自顶向下归并排序：快慢指针切分 + 合并有序链"
      info={`输入取题解示例 1（有代表性且规模最小）：head = [${HEAD.join(', ')}] → [${SORTED.join(', ')}]，共 ${steps.length} 步。示例 2 有 5 个节点、示例 3 是空链表，改用示例 1 就能完整看到「快慢指针找中点断开 → 递归排两半 → 合并两条有序链」全过程（含 4 与 2 的一次拆分和 2 < 4 的比较）。链表节点位置固定不动，amber 是本步正在处理的段、绿色是已经排好序的连续段，合并时下方从 dummy 哨兵起边长边接结果链。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步正在处理的段 / 刚接到结果链的节点与加粗边' },
        { color: TONE.teal, label: 'split 的 slow、fast 与合并时的 l1、l2 链头指针' },
        { color: TONE.easy, label: '已排好序的连续段' },
        { color: TONE.muted, label: '尚未处理的节点（下标为原链表位置）' },
      ]}
    />
  )
}
