import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 63. 删除链表的倒数第 N 个结点 —— 模式 D：dummy 哨兵 + 快慢指针固定间距   */
/* ------------------------------------------------------------------ */

/** 题解示例 1：head = [1, 2, 3, 4, 5]，n = 2，输出 [1, 2, 3, 5] */
const HEAD = [1, 2, 3, 4, 5]
const N = 2

/** 带哨兵的链在舞台上的位置：0 = dummy，1..L = 头结点..尾结点，L + 1 = nil（越界位置） */
const NIL = HEAD.length + 1
/** 倒数第 n 个 = 正数第 L - n + 1 个，在数值数组里的下标是 L - n */
const VICTIM_INDEX = HEAD.length - N
const VICTIM_VALUE = HEAD[VICTIM_INDEX]
const RESULT = [...HEAD.slice(0, VICTIM_INDEX), ...HEAD.slice(VICTIM_INDEX + 1)]

/** 位置 → 屏幕上显示的名字（dummy / 结点 k / nil） */
function nameOf(pos: number): string {
  if (pos === 0) return 'dummy'
  if (pos === NIL) return 'nil'
  return `结点 ${HEAD[pos - 1]}`
}

/** 沿带哨兵的链走一步：dummy → 头结点 → … → 尾结点 → nil */
function advance(pos: number): number {
  return pos === HEAD.length ? NIL : pos + 1
}

/** 舞台上的固定结点行 */
interface ChainSlot {
  pos: number
  label: string
  sub: string
  sentinel: boolean
}

const CHAIN: ChainSlot[] = [
  { pos: 0, label: 'dummy', sub: '哨兵', sentinel: true },
  ...HEAD.map((v, i) => ({ pos: i + 1, label: String(v), sub: String(i + 1), sentinel: false })),
  { pos: NIL, label: 'nil', sub: '越界', sentinel: true },
]

type Phase = 'init' | 'gap' | 'sync' | 'remove' | 'done'

interface Step {
  phase: Phase
  /** slow 在带哨兵链上的位置 */
  slowPos: number
  /** fast 的位置；等于 NIL 表示已经越界到 nil */
  fastPos: number
  /** 被摘除结点在链上的位置；remove / done 两步非空 */
  victimPos: number | null
  /** 第一趟 fast 独自走的是第几步（0 表示不在第一趟） */
  gapStep: number
  /** 下一步动作，由后一个快照统一回填 */
  next: string
  hintTone: 'teal' | 'hard'
  note: string
}

/** 跑一遍题解里的真实算法，每步存一个不可变快照 */
function buildSteps(): Step[] {
  const steps: Step[] = []
  let slow = 0
  let fast = 0
  let victim: number | null = null

  const push = (phase: Phase, note: string, gapStep = 0) => {
    steps.push({
      phase,
      slowPos: slow,
      fastPos: fast,
      victimPos: victim,
      gapStep,
      next: '',
      hintTone: 'teal',
      note,
    })
  }

  push(
    'init',
    `观察：head = [${HEAD.join(', ')}]、n = ${N}，先加哨兵，让 dummy.Next 指向头结点，整条带哨兵的链是 dummy → ${HEAD.join(' → ')} → nil。判断：要删除倒数第 n = ${N} 个结点，必须先拿到它的前驱，所以让 fast 先走 n + 1 = ${N + 1} 步把间距固定住。动作：fast 与 slow 都从 dummy 出发，此刻间距是 0 条边。为什么：有了 dummy，即使要删的是头结点，slow 也能停在它的前驱上，不必为 n = L 单写一个分支。`
  )

  // 第一趟：fast 独自先走 n + 1 步
  for (let i = 1; i <= N + 1; i++) {
    const from = fast
    fast = advance(fast)
    push(
      'gap',
      `观察：fast 独自迈出第 ${i} 步，从 ${nameOf(from)} 落到 ${nameOf(fast)}，slow 仍停在 dummy。判断：${
        i < N + 1
          ? `间距 ${i} 条边，还差 ${N + 1 - i} 步才走满 n + 1 = ${N + 1}`
          : `间距恰好 ${N + 1} 条边，已经把 n + 1 = ${N + 1} 步走满`
      }。动作：${i < N + 1 ? `fast 继续独自前进，还差 ${N + 1 - i} 步` : '第一趟结束，转入 fast 与 slow 同步前进'}。为什么：只有间距恰好是 ${N + 1} 条边，fast 越界时 slow 才正好落在倒数第 n + 1 = ${N + 1} 个结点上。`,
      i
    )
  }

  // 第二趟：fast 与 slow 同步前进，直到 fast 越界到 nil
  while (fast !== NIL) {
    const fromFast = fast
    const fromSlow = slow
    fast = advance(fast)
    slow = advance(slow)
    push(
      'sync',
      `观察：fast 从 ${nameOf(fromFast)} 走到 ${nameOf(fast)}，slow 从 ${nameOf(fromSlow)} 同步走到 ${nameOf(slow)}，两者各走 1 步。判断：${
        fast === NIL
          ? 'fast 已经越过尾结点到达 nil，整条链表走完，间距到此「用尽」'
          : `fast 还没越界，间距保持 ${N + 1} 条边不变`
      }。动作：${
        fast === NIL
          ? `退出同步循环——slow 停在 ${nameOf(slow)}，它正是待删结点的前驱`
          : '继续让两个指针各走 1 步'
      }。为什么：两个指针每轮步长相同，fast 领先 slow 的步数恒为 ${N + 1}，所以 fast 一到 nil，slow 的位置就被唯一确定。`
    )
  }

  victim = advance(slow)
  push(
    'remove',
    `观察：fast 已到 nil，slow 停在 ${nameOf(slow)}，slow.Next 指向 ${nameOf(victim)}，而 ${nameOf(victim)} 正是倒数第 n = ${N} 个结点。判断：待删结点 ${nameOf(victim)} 的两条边 ${nameOf(slow)} → ${nameOf(victim)} 与 ${nameOf(victim)} → ${nameOf(advance(victim))} 都要断开，slow.Next 应当改指 ${nameOf(advance(victim))}。动作：执行 slow.Next = slow.Next.Next，${nameOf(victim)} 被摘除。为什么：删除的入口是前驱 slow 的 next 而不是 slow 本身；被摘除结点残留的 Next 已经不在链上，不影响结果。`
  )

  push(
    'done',
    `结论：返回 dummy.Next，结果链表是 [${RESULT.join(', ')}]，被摘除的是原来的倒数第 ${N} 个结点 ${VICTIM_VALUE}。正确性：fast 从 dummy 沿 next 走完 L + 1 = ${HEAD.length + 1} 步到 nil，slow 同步落后 ${N + 1} 步，所以 fast 越界时 slow 必定停在待删结点的前驱上。复杂度：每个结点被常数次访问，时间 O(L) 且只扫描一趟；额外空间只有 dummy、fast、slow 三个指针，O(1)。`
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '返回 dummy.Next，读出结果链表'
    } else if (b.phase === 'remove') {
      s.hintTone = 'hard'
      s.next = `slow 已停在 ${nameOf(b.slowPos)}：执行 slow.Next = slow.Next.Next${
        b.victimPos === null ? '' : `，摘除 ${nameOf(b.victimPos)}`
      }`
    } else if (b.phase === 'gap') {
      s.next = `fast 独自走第 ${b.gapStep} 步（共 n + 1 = ${N + 1} 步），slow 停在 dummy`
    } else {
      s.next = `两个指针各走 1 步：fast → ${nameOf(b.fastPos)}，slow → ${nameOf(b.slowPos)}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type EdgeKind = 'plain' | 'span' | 'broken'

/** 结点之间的连接：普通细线 / 间距色块 / 被断开的虚线边 */
function Edge({ kind }: { kind: EdgeKind }) {
  return (
    <div className="mt-6 flex h-11 items-center">
      {kind === 'plain' ? (
        <Link />
      ) : kind === 'span' ? (
        <div className="h-2.5 w-6 shrink-0 rounded-full bg-[hsl(var(--water))]" />
      ) : (
        <div className="w-6 shrink-0 border-t-2 border-dashed border-[hsl(var(--hard))]" />
      )}
    </div>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const victim = step.victimPos
  const gap = step.fastPos - step.slowPos

  const edgeKind = (edge: number): EdgeKind => {
    if (victim !== null && (edge === victim - 1 || edge === victim)) return 'broken'
    if (edge >= step.slowPos && edge < step.fastPos) return 'span'
    return 'plain'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-code text-[11px] text-ink-soft">
        {done
          ? '结果链表（返回 dummy.Next）'
          : '带哨兵的链：结点下方的数字 = 从 dummy 数起的位置'}
      </span>

      {done ? (
        <>
          <div className="flex flex-wrap items-start justify-center gap-y-2">
            {RESULT.map((v, i) => (
              <div key={v} className="flex items-center">
                {i > 0 && <Link />}
                <Node state="ok">{v}</Node>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-ink-soft">已摘除</span>
            <Node className="border-[hsl(var(--hard))] bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))] line-through">
              {VICTIM_VALUE}
            </Node>
            {victim !== null && (
              <span className="font-code text-[11px] text-[hsl(var(--hard))]">
                断开 {nameOf(victim - 1)} → {nameOf(victim)}、{nameOf(victim)} → {nameOf(victim + 1)}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-center gap-y-2">
            {CHAIN.map((nd, idx) => {
              const isSlow = step.slowPos === nd.pos
              const isFast = step.fastPos === nd.pos
              const both = isSlow && isFast
              const isVictim = victim === nd.pos
              return (
                <div key={nd.pos} className="flex items-start">
                  {idx > 0 && <Edge kind={edgeKind(idx - 1)} />}
                  <div className="flex flex-col items-center">
                    <Flag
                      label={both ? 'slow·fast' : isSlow ? 'slow' : isFast ? 'fast' : undefined}
                      tone={isSlow ? 'amber' : 'teal'}
                    />
                    {isVictim ? (
                      <Node className="border-[hsl(var(--hard))] bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))] line-through">
                        {nd.label}
                      </Node>
                    ) : (
                      <Node
                        state={both || isSlow ? 'active' : isFast ? 'teal' : 'idle'}
                        className={
                          nd.pos === NIL
                            ? 'border-dashed text-ink-soft'
                            : nd.sentinel
                              ? 'border-dashed'
                              : undefined
                        }
                      >
                        {nd.label}
                      </Node>
                    )}
                    <span className="mt-1 font-code text-[11px] text-ink-soft">{nd.sub}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {step.phase === 'gap' && (
            <span className="text-[11px] text-ink-soft">
              第一趟：fast 独自先走拉开间距，slow 停在 dummy 不动
            </span>
          )}
          {step.phase === 'remove' && victim !== null && (
            <span className="font-code text-[11px] text-[hsl(var(--hard))]">
              断开 {nameOf(victim - 1)} → {nameOf(victim)}、{nameOf(victim)} → {nameOf(victim + 1)}
              {'；改接 '}
              {nameOf(step.slowPos)} → {nameOf(victim + 1)}
            </span>
          )}
        </>
      )}

      <Badges className="justify-center">
        <Stat label="slow" value={done ? '—' : nameOf(step.slowPos)} tone="amber" />
        <Stat label="fast" value={done ? '—' : nameOf(step.fastPos)} tone="teal" />
        {done ? (
          <Badge tone="hard">
            被删结点 <b className="font-code">{VICTIM_VALUE}</b>（倒数第{' '}
            <b className="font-code">{N}</b> 个）
          </Badge>
        ) : (
          <Badge tone="water">
            间距 <b className="font-code">{gap}</b> 条边 · 目标 n + 1 ={' '}
            <b className="font-code">{N + 1}</b>
          </Badge>
        )}
        {!done && step.next && <Hint tone={step.hintTone}>{step.next}</Hint>}
        {done && (
          <Answer>
            结果链表 [<b className="font-code">{RESULT.join(', ')}</b>]
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RemoveNthNodeFromEndOfListDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="dummy 哨兵 + 快慢指针，一趟扫完"
      info={`输入：head = [${HEAD.join(', ')}]、n = ${N}（题解示例 1，输出 [${RESULT.join(', ')}]）。取这个示例是因为它同时包含「fast 独自先走 n + 1 = ${N + 1} 步」和「两指针同步前进到 fast 越界」两个阶段，且规模最小、能逐步看清：蓝色色块是两指针之间的间距（恒为 n + 1 = ${N + 1} 条边），结点 ${VICTIM_VALUE} 标红并注明被断开的两条边，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'slow 慢指针（停在待删结点的前驱）' },
        { color: TONE.teal, label: `fast 快指针（领先 slow 固定 n + 1 = ${N + 1} 步）` },
        { color: TONE.water, label: `两指针之间的间距色块（${N + 1} 条边 = n + 1）` },
        { color: TONE.hard, label: '被摘除的结点与断开的两条边' },
        { color: TONE.easy, label: '删除完成后的结果链表' },
      ]}
    />
  )
}
