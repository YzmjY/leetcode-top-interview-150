import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 62. K 个一组翻转链表 —— 模式 D：链表 + 分组色块 / 头插法组内反转       */
/* ------------------------------------------------------------------ */

/** 取题解「示例 1」：head = [1,2,3,4,5]，k = 2，输出 [2,1,4,3,5] */
const VALS = [1, 2, 3, 4, 5]
const K = 2

/** dummy 及其后每个节点的原始下标（0..n-1） */
type Id = number
/** 哨兵节点：不是输入链表里的真实节点 */
const DUMMY: Id = -1
/** 全部节点快照（含 dummy） */
type Order = Id[]

const KEY = (id: Id) => String(id + 1)

interface Step {
  /** 沿 next 读出的节点身份，含开头的 dummy */
  order: Order
  /** 本步各指针所指节点；-1 表示 dummy，null 表示该指针此刻为空 */
  pre: Id | null
  cur: Id | null
  tail: Id | null
  move: Id | null
  /** 当前待翻转组的成员（原下标，顺序为组内原始顺序） */
  members: Id[]
  /** 已经整组翻转完毕的组数；done 步为满组总数 */
  processed: number
  /** 当前组序号，从 1 开始；done 步为满组总数 */
  groupNo: number
  /** 本步正在做的动作 */
  phase: 'init' | 'insert' | 'check' | 'groupdone' | 'stop' | 'done'
  note: string
  /** 真正的下一步动作，由后一个快照统一回填（不能在渲染期推断） */
  hint: string
}

/** 用真实算法跑一遍 INPUT，每轮 push 一个不可变快照 */
function buildSteps(): Step[] {
  const n = VALS.length
  const fullGroups = Math.floor(n / K)
  const steps: Step[] = []

  // 可变的工作副本：pos 是节点 id 在 order 里的位置
  let order: Order = [DUMMY, ...VALS.map((_, i) => i)]
  const posOf: Record<Id, number> = {}
  order.forEach((id, p) => {
    posOf[id] = p
  })

  const push = (s: {
    pre: Id | null
    cur: Id | null
    tail: Id | null
    move: Id | null
    members: Id[]
    processed: number
    groupNo: number
    phase: Step['phase']
    note: string
  }) => {
    steps.push({ ...s, order: order.slice(), hint: '' })
  }

  const nextOf = (id: Id): Id | null => {
    const p = posOf[id]
    return p + 1 < order.length ? order[p + 1] : null
  }

  /** 把 move 从 cur 之后摘下来、插到 pre 之后（头插法重组后的 next 顺序） */
  const moveAfterPre = (pre: Id, move: Id) => {
    const [node] = order.splice(posOf[move], 1)
    order.splice(posOf[pre] + 1, 0, node)
    order.forEach((id, p) => {
      posOf[id] = p
    })
  }

  let pre: Id = DUMMY
  let head: Id | null = order[1]
  let processed = 0
  let groupNo = 0

  // ── init ──
  push({
    pre: DUMMY,
    cur: null,
    tail: null,
    move: null,
    members: [],
    processed: 0,
    groupNo: 0,
    phase: 'init',
    note: `观察：head = [${VALS.join(', ')}]（n = ${n}），k = ${K}，即每 ${K} 个节点分一组翻转，示例输出 [2,1,4,3,5]。判断：整条链没有哨兵就无法处理头节点被翻到组尾的情况，所以在头前挂一个 dummy；翻转前还要先确认剩余节点够 k 个，不足的原样保留。动作：dummy.next = head，pre 指向 dummy，它是「已处理部分」的尾巴，head 指向下一组的第一个节点 1。为什么：每轮开始时 dummy.next 读出的链表 = 前面若干组的逆序结果 + 尚未处理的剩余链表。`,
  })

  // ── 外层循环：每轮处理一组 ──
  while (head !== null) {
    groupNo += 1

    // 探测：tail 从 pre 出发数 k 步
    let tail: Id | null = pre
    let enough = true
    let stepsWalked = 0
    for (let t = 0; t < K; t++) {
      tail = tail === null ? null : nextOf(tail)
      if (tail === null) {
        enough = false
        break
      }
      stepsWalked += 1
    }

    // 当前组的成员（按 next 顺序，最多 K 个）
    const members: Id[] = []
    let probe = nextOf(pre)
    while (probe !== null && members.length < K) {
      members.push(probe)
      probe = nextOf(probe)
    }
    const memberVals = members.map((id) => VALS[id])

    if (!enough) {
      push({
        pre,
        cur: null,
        tail: null,
        move: null,
        members,
        processed,
        groupNo,
        phase: 'stop',
        note: `观察：从 pre（${pre === DUMMY ? 'dummy' : `节点 ${VALS[pre]}`}）往后数，只有 ${stepsWalked} 步能落在真实节点上（［${memberVals.join(', ')}］），第 ${stepsWalked + 1} 步 tail 就变成了 nil，凑不满 k = ${K} 个。判断：剩下的 ${members.length} 个节点无法成组，按题目要求保持原有顺序。动作：直接返回 dummy.Next = [${order.slice(1).map((id) => VALS[id]).join(', ')}]，这一小段没有被动过任何指针。为什么：正因为在翻转之前先用探测指针判够不够，才不会把不足一组的部分也翻转。`,
      })
      break
    }

    const tailId = tail as Id
    const nextGroup: Id | null = nextOf(tailId)

    // ── 探测通过：先记下下一组起点 ──
    push({
      pre,
      cur: nextOf(pre),
      tail: tailId,
      move: null,
      members,
      processed,
      groupNo,
      phase: 'check',
      note: `观察：从 pre 出发数满 k = ${K} 步，tail 落在本组第 ${K} 个节点 ${VALS[tailId]} 上，本组成员是［${memberVals.join(' → ')}］。判断：这一组够 k 个，需要翻转；下一组的起点是 nextGroup = ${nextGroup === null ? 'nil' : `节点 ${VALS[nextGroup]}`}。动作：记下 nextGroup，cur 指向本组第一个节点 ${VALS[members[0]]}，准备做 k - 1 = ${K - 1} 次头插。为什么：先保存边界再改指针，翻转后才知道把尾巴接回哪里。`,
    })

    // ── 组内头插翻转：k-1 次 ──
    const cur = nextOf(pre) as Id
    for (let t = 0; t < K - 1; t++) {
      const move = nextOf(cur) as Id
      const preLabel = pre === DUMMY ? 'dummy' : `节点 ${VALS[pre]}`
      moveAfterPre(pre, move)
      push({
        pre,
        cur,
        tail: tailId,
        move,
        members,
        processed,
        groupNo,
        phase: 'insert',
        note: `观察：第 ${t + 1} 次头插把 cur 之后的节点 ${VALS[move]} 摘下来，插到 pre（${preLabel}）之后，本组已翻转部分变成 ${members
          .slice(0, t + 2)
          .reverse()
          .map((id) => VALS[id])
          .join(' → ')}。判断：cur 始终指向已翻转段的尾巴，位置不动。动作：${
          t < K - 2
            ? `继续头插，接着摘 cur 后面的节点 ${VALS[nextOf(cur) as Id]}`
            : `本组 ${K - 1} 次头插已做完，把 pre 推进到本组末尾`
        }。为什么：翻转一组 k 个节点只需把后 k - 1 个依次插到 pre 之后，写成 k 次就会从下一组借节点、破坏链表。`,
      })
    }

    // ── 推进 pre / head ──
    pre = cur
    head = nextGroup
    processed += 1

    push({
      pre,
      cur,
      tail: null,
      move: null,
      members,
      processed,
      groupNo,
      phase: 'groupdone',
      note: `观察：本组［${memberVals.join(' → ')}］已经变成［${memberVals.slice().reverse().join(' → ')}］，整条链表读作 [${order
        .slice(1)
        .map((id) => VALS[id])
        .join(', ')}]。判断：翻转后 cur 停在原组第一个节点 ${VALS[cur]} 上，它现在是本组的末尾。动作：pre = cur 让 pre 停在已处理部分的末尾，head = nextGroup${
        nextGroup === null ? '（已是 nil，外层循环结束）' : `（节点 ${VALS[nextGroup]}）`
      }。为什么：pre 必须落在组尾而不是组头，否则下一组的探测起点会错位、链表被拆坏。`,
    })
  }

  // ── done：总结 ──
  push({
    pre,
    cur: null,
    tail: null,
    move: null,
    members: [],
    processed: fullGroups,
    groupNo: fullGroups,
    phase: 'done',
    note: `观察：前 ${fullGroups} 组各 ${K} 个节点都完成了组内翻转，最后剩的节点 ${VALS[n - 1]} 不足 k = ${K} 个，保持原序。判断：head 已经变成 nil，所有节点都处理完毕。动作：从 dummy.Next 读出答案 [${order
      .slice(1)
      .map((id) => VALS[id])
      .join(', ')}]，读法就是「跳过 dummy，沿 next 依次读出」。为什么：每个节点在探测和头插里各被访问常数次，时间 O(n)；全程只有 dummy 和几个指针，额外空间 O(1)。`,
  })

  // 「下一步动作」永远取自后一个快照，保证 Hint 说的都是真正还没做的事
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'insert') {
      s.hint = `把节点 ${VALS[b.move as Id]} 插到 pre 之后（第 ${b.groupNo} 组头插）`
    } else if (b.phase === 'check') {
      s.hint = `从 pre 出发数 ${K} 步，探测第 ${b.groupNo} 组是否够 ${K} 个`
    } else if (b.phase === 'groupdone') {
      s.hint = `第 ${b.groupNo} 组翻转完成，把 pre 推进到本组末尾，再看下一组`
    } else if (b.phase === 'stop') {
      s.hint = `剩余节点不足 ${K} 个，停止翻转，返回 dummy.Next`
    } else if (b.phase === 'done') {
      s.hint = '从 dummy.Next 读出最终链表'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 当前组 / 已完成组用色块分层：同组成员连成一个圆角色块 */
type GroupState = 'processing' | 'done' | undefined

function groupStateOf(group: Id[], step: Step): GroupState {
  const cur = step.cur !== null ? VALS[step.cur] : null
  const pre = step.pre !== null ? VALS[step.pre] : null
  if (step.phase === 'insert' && (group.includes(cur!) || group.includes(pre!))) return 'processing'
  if (step.phase !== 'done' && group.some((id) => step.members.includes(id))) return 'processing'
  if (group[0] !== DUMMY && step.processed > 0 && group.some((id) => id < step.processed * K)) {
    return 'done'
  }
  return undefined
}

const GROUP_BOX: Record<'processing' | 'done', string> = {
  processing: 'bg-[hsl(var(--amber))]/10 border-[hsl(var(--amber))]/35',
  done: 'bg-[hsl(var(--easy))]/15 border-[hsl(var(--easy))]/40',
}

/** 把当前链表切分为「每 K 个一组 + 最后的尾组」，色块按组切分 */
function chunk(order: Order): Order[] {
  const rest = order.slice(1)
  const out: Order[] = []
  for (let s = 0; s < rest.length; s += K) out.push(rest.slice(s, s + K))
  return out
}

function Stage(step: Step) {
  const groups = chunk(step.order)
  const members = step.members
  const done = step.phase === 'done'

  /** 节点底色：当前组 amber、已完成组 easy 绿、不足 k 的尾组 dim */
  const nodeState = (id: Id): 'idle' | 'active' | 'teal' | 'ok' | 'dim' => {
    if (id === DUMMY) return 'idle'
    if (done) return 'ok'
    if (step.move !== null && id === step.move) return 'active'
    if (step.phase === 'stop' && members.includes(id)) return 'dim'
    if (members.includes(id)) return 'idle'
    if (id < step.processed * K) return 'ok'
    return 'idle'
  }

  /** 指针旗标：颜色 + 字母双重区分（可访问性） */
  const flagsOf = (id: Id) => {
    const out: { label: string; tone: 'amber' | 'teal' | 'medium' }[] = []
    if (id === step.cur) out.push({ label: 'cur', tone: 'amber' })
    if (id === step.move) out.push({ label: 'move', tone: 'medium' })
    if (id === step.tail) out.push({ label: 'tail', tone: 'teal' })
    if (id === step.pre) out.push({ label: 'pre', tone: 'teal' })
    return out
  }

  const hintTone = step.hint.includes('不足') ? 'medium' : 'teal'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 当前链表：从左到右就是 next 顺序，按原下标标注节点身份 */}
      <div className="flex w-full flex-wrap items-start justify-center gap-y-3">
        {groups.map((group, gi) => {
          const gs = groupStateOf(group, step)
          return (
            <div key={KEY(group[0])} className="flex items-center">
              {gi > 0 && <Link active={groupStateOf(groups[gi - 1], step) === 'processing'} />}
              <div
                className={`flex flex-col items-center rounded-xl border-[1.5px] px-2 pb-2 pt-1 ${
                  gs === undefined ? 'border-transparent' : GROUP_BOX[gs]
                }`}
              >
                {/* 组内计数：色块上标出这一组的容量（满组 / 不足 k 个的尾组） */}
                <span className="mb-0.5 text-center font-code text-[10px] leading-none text-ink-soft">
                  组 {gi + 1} · {group.length}/{K}
                </span>
                <div className="flex items-center gap-1.5">
                  {group.map((id) => (
                    <div key={KEY(id)} className="flex flex-col items-center">
                      <div className="flex flex-col items-center">
                        {flagsOf(id).map((f) => (
                          <Flag key={f.label} label={f.label} tone={f.tone} />
                        ))}
                      </div>
                      {id === DUMMY ? (
                        <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border px-2 font-code text-[11px] text-ink-soft">
                          dummy
                        </div>
                      ) : (
                        <Node state={nodeState(id)}>{VALS[id]}</Node>
                      )}
                      <span className="mt-1 font-code text-[10px] leading-none text-ink-soft">
                        {id === DUMMY ? '哨兵' : `原 #${id}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="k" value={K} tone="teal" />
        <Stat label="已翻转组" value={step.processed} tone="easy" />
        <Badge tone={members.length === 0 ? 'plain' : step.phase === 'stop' ? 'medium' : 'amber'}>
          {members.length === 0 ? (
            '无待翻转组'
          ) : (
            <>
              当前组 <b className="font-code">[{members.map((id) => VALS[id]).join(', ')}]</b>
              {step.phase === 'stop' ? ' 不足 k 个' : ' 待翻转'}
            </>
          )}
        </Badge>
        {!done && step.hint && <Hint tone={hintTone}>{step.hint}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">[{step.order.slice(1).map((id) => VALS[id]).join(', ')}]</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ReverseNodesInKGroupDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="每 k 个一组翻转链表（头插法）"
      info={`输入：head = [${VALS.join(', ')}]、k = ${K}（题解示例 1，输出 [2,1,4,3,5]）。这一步组边界刚好演示两种情形：前两组够 k 个被翻转，末尾 [5] 不足 k 个保持原序。演示按题解「先探测 k 个再头插 k-1 次」的顺序逐步展开，去掉了题解里对 k == 1、k == n 等退化情形的特判讨论，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前 k 人组：色块标出「取满 k 个」，move 为本步被头插的节点' },
        { color: TONE.easy, label: '已完成组内翻转的组（pre 停在其末尾）' },
        { color: TONE.muted, label: '不足 k 个的尾组：保持原序、不再翻转' },
        { color: TONE.teal, label: 'pre / tail 探测指针' },
      ]}
    />
  )
}
