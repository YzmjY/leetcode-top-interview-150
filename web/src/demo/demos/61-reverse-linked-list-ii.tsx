import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 61. 反转链表 II —— 模式 D：dummy 哨兵 + 头插法（穿针引线）逐次前插     */
/* ------------------------------------------------------------------ */

/** 取题解「示例 1」：head = [1,2,3,4,5]，left = 2，right = 4，输出 [1,4,3,2,5] */
const HEAD = [1, 2, 3, 4, 5]
const LEFT = 2
const RIGHT = 4

/** 节点身份：dummy 用 -1，其余是 HEAD 里的原下标 0..n-1 */
type Id = number
const DUMMY: Id = -1
/** 表尾之外的空位（next 指向 nil） */
const NIL = -2
/** 头插次数 = right - left（区间第一个节点本来就已经在 pre 之后） */
const INSERTS = RIGHT - LEFT
/** 位置 k（1 起）对应的节点身份 */
const idAt = (k: number): Id => k - 1
/** 节点在屏幕上的名字 */
const nameOf = (id: Id | null): string =>
  id === null ? 'nil' : id === DUMMY ? 'dummy' : `节点 ${HEAD[id]}`

/** 位置 p 上的节点指向的节点身份；p 越界即 nil */
function nextAtPos(order: Id[], p: number): Id {
  return p + 1 < order.length ? order[p + 1] : NIL
}

/** 沿 next 从 dummy.Next 读出节点身份（首元素是 dummy，结果里跳过它） */
function chainIds(order: Id[]): Id[] {
  const out: Id[] = []
  let p = 1
  while (p < order.length) {
    out.push(order[p])
    p += 1
  }
  return out
}

/** 读成 "1, 4, 3, 2, 5" 这样的字符串 */
function readAll(order: Id[]): string {
  return chainIds(order)
    .map((id) => HEAD[id])
    .join(', ')
}

type Phase = 'init' | 'walk' | 'insert' | 'done'

interface Step {
  /** 沿 next 读出的节点身份，含开头的 dummy —— 不可变快照 */
  order: Id[]
  pre: Id | null
  cur: Id | null
  move: Id | null
  /** 本步被改接的那条边：改的是该节点自己的 next */
  editedFrom: Id | null
  /** 已完成的头插次数（0..right-left） */
  inserted: number
  phase: Phase
  note: string
  /** 真正的下一步动作，由后一个快照统一回填，供 Hint 使用；done 步为空 */
  next: string
}

/** 用真实算法跑一遍 INPUT，每轮 push 一个不可变快照 */
function buildSteps(): Step[] {
  // 链表用 order 表达（下一个节点就是数组里的下一个元素），只增删元素位置、不新建节点
  const order: Id[] = [DUMMY, ...HEAD.map((_, i) => i)]
  const posOf = (id: Id) => order.indexOf(id)
  let pre: Id = DUMMY
  let cur: Id | null = null
  let move: Id | null = null
  let inserted = 0
  const steps: Step[] = []

  const push = (phase: Phase, editedFrom: Id | null, note: string) => {
    steps.push({
      order: order.slice(),
      pre,
      cur,
      move,
      editedFrom,
      inserted,
      phase,
      note,
      next: '',
    })
  }

  push(
    'init',
    null,
    `观察：head = [${HEAD.join(', ')}]，left = ${LEFT}、right = ${RIGHT}，要反转的是位置 ${LEFT}..${RIGHT}（值为 ${HEAD.slice(LEFT - 1, RIGHT).join('、')}）这一段，示例输出 [1,4,3,2,5]。判断：朴素做法要同时记前驱、区间左端、区间右端、右端后继四个位置，容易接错；头插法只需 pre、cur 两个指针。动作：挂哨兵 dummy.next = head，pre 从 dummy 出发，它是待反转区间的前驱。为什么必须用 dummy：left == 1 时 pre 就停在 dummy，头节点被反转也不用额外更新头指针。`,
  )

  for (let k = 0; k < LEFT - 1; k++) {
    pre = order[posOf(pre) + 1]
    push(
      'walk',
      null,
      `观察：pre 从 dummy 沿 next 前进一步，落到 ${nameOf(pre)}，已走 ${k + 1} / ${LEFT - 1} 步。判断：pre 必须停在位置 left - 1 = ${LEFT - 1} 上，它才是待反转区间的前驱，${
        k + 1 < LEFT - 1 ? `还差 ${LEFT - 1 - (k + 1)} 步` : '现在刚好到位'
      }。动作：${
        k + 1 < LEFT - 1
          ? 'pre 继续沿 next 后移一位'
          : `pre 已就位，接着令 cur = pre.Next = ${nameOf(order[posOf(pre) + 1])}`
      }。为什么：left 只能靠从 dummy 数 ${LEFT - 1} 步定位，多走一步 pre 就落进区间内部，头插会插错位置。`,
    )
  }

  cur = order[posOf(pre) + 1]
  const restAfterCur = order.slice(posOf(cur) + 1)
  push(
    'walk',
    null,
    `观察：pre 停在 ${nameOf(pre)}，执行 cur = pre.Next 后 cur 指向 ${nameOf(cur)}，它就是待反转区间的第一个节点，接下来需要前插的就是它后面的 ${restAfterCur.map((x) => HEAD[x]).join('、')} 共 ${INSERTS} 个节点。判断：cur 是区间原第一个节点，反转完成后会变成逆序段的末尾，所以整个循环里 cur 都不移动。动作：接下来把 cur.Next 处的节点拔出来前插到 pre 之后，共执行 right - left = ${RIGHT} - ${LEFT} = ${INSERTS} 次。为什么次数是 right - left 而不是 +1：区间第一个节点本来就已经在 pre 之后，多插一次会从区间外借节点。`,
  )

  for (let t = 0; t < INSERTS; t++) {
    const moveId = nextAtPos(order, posOf(cur))
    const from = posOf(cur) + 1
    const to = posOf(pre) + 1
    // 四步指针操作：move := cur.Next；cur.Next := move.Next；move.Next := pre.Next；pre.Next := move
    const [node] = order.splice(from, 1)
    order.splice(to, 0, node)
    move = moveId
    inserted += 1
    push(
      'insert',
      pre,
      `观察：第 ${inserted} 次头插把 cur.Next 处的 ${nameOf(move)} 拔出来——先 cur.Next = move.Next 把它从原位摘除，再 move.Next = pre.Next 指向当前区间头部，最后 pre.Next = move 接到 ${nameOf(pre)} 之后，链表变成 [${readAll(order)}]。判断：头插共需 right - left = ${INSERTS} 次，已完成 ${inserted} 次，${inserted < INSERTS ? `还剩 ${INSERTS - inserted} 次` : '区间已全部逆序'}。动作：${
        inserted < INSERTS
          ? `接着摘 cur.Next 处的节点 ${nameOf(nextAtPos(order, posOf(cur)))} 继续前插`
          : '停止头插，从 dummy.Next 读出结果'
      }。为什么 cur 全程不动：它始终指向 ${nameOf(cur)}，也就是已反转子链的尾巴；四步顺序也不能换，先把 move.Next 指向 cur（而不是 pre.Next）第二次插入就会把 cur 又接到前面、破坏结构。`,
    )
  }

  push(
    'done',
    null,
    `观察：头插 ${INSERTS} 次后，位置 ${LEFT}..${RIGHT} 的 [${HEAD.slice(LEFT - 1, RIGHT).join(', ')}] 逆序成 [${[
      ...HEAD.slice(LEFT - 1, RIGHT),
    ]
      .reverse()
      .join(', ')}]，从 dummy.Next 读出的答案 = [${readAll(order)}]。判断：前段 ${HEAD.slice(0, LEFT - 1).join(', ')} 与后段 ${HEAD.slice(RIGHT).join(', ')} 一个指针都没被改过，只有区间内部的边被重接。动作：返回 dummy.Next——不是 dummy 本身，也不是此刻可能已经不在头部的原 head。为什么复杂度是 O(n) / O(1)：pre 走 left - 1 步、头插 right - left 次，都是常数次指针操作，全程只用 dummy、pre、cur、move 四个指针，没有新建节点。`,
  )

  // 「下一步动作」统一由后一个快照回填，保证 Hint 说的都是真正还没做的事
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '头插结束，从 dummy.Next 读出反转后的链表'
    } else if (b.phase === 'walk' && b.cur === null) {
      s.next = `pre 沿 next 前进一步，去定位位置 left - 1 = ${LEFT - 1}`
    } else if (b.phase === 'walk') {
      s.next = `令 cur = pre.Next = ${nameOf(b.cur)}，进入头插循环`
    } else {
      s.next = `摘出节点 ${nameOf(b.move)} 前插到 ${nameOf(b.pre)} 之后（第 ${b.inserted} / ${INSERTS} 次头插）`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type NodeState = 'idle' | 'active' | 'teal' | 'ok' | 'dim'
/** 旗标区固定高度：最多 left/right + pre + cur 三行旗标都放得下，各行节点才能横向对齐 */
const FLAG_AREA = 'h-[4.5rem]'

function Stage(step: Step) {
  const done = step.phase === 'done'
  const leftId = idAt(LEFT)
  const rightId = idAt(RIGHT)
  const iLeft = step.order.indexOf(leftId)
  const iRight = step.order.indexOf(rightId)
  /** 区间色块的起止位置：left..right 在链上始终相邻，所以是一段连续位置 */
  const blockFrom = Math.min(iLeft, iRight)
  const blockTo = Math.max(iLeft, iRight)

  const inBlock = (p: number) => p >= blockFrom && p <= blockTo

  /** 本步被改接的那些边：出边用「节点身份」表达 */
  const edgeActive = (p: number): boolean => {
    if (p <= 0 || step.editedFrom === null) return false
    const from = step.order[p - 1]
    // 头插里改成 pre.Next 与 cur.Next 两条边
    if (from === step.editedFrom) return true
    return from === step.cur
  }

  /** 节点底色：move 琥珀、cur 青绿、区间内普通、区间外变灰、完成步全绿 */
  const nodeState = (p: number): NodeState => {
    if (done) return p === 0 ? 'idle' : 'ok'
    const id = step.order[p]
    if (id === step.move) return 'active'
    if (id === step.cur) return 'teal'
    return inBlock(p) ? 'idle' : 'dim'
  }

  /** 指针旗标：颜色 + 字母双重区分（可访问性） */
  const flagsOf = (p: number, isDummy: boolean) => {
    const id = step.order[p]
    const out: { label: string; tone: 'amber' | 'teal' | 'ink' }[] = []
    if (id === step.move) out.push({ label: 'move', tone: 'amber' })
    if (id === step.cur) out.push({ label: 'cur', tone: 'teal' })
    if (id === step.pre) out.push({ label: 'pre', tone: 'teal' })
    if (isDummy && out.length === 0) out.push({ label: '哨兵', tone: 'ink' })
    return out
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 一条节点行：从左到右就是 next 顺序；窄屏横向可滚动，不压缩节点 */}
      <div className="flex w-full min-w-0 items-start gap-1 overflow-x-auto pb-1 sm:min-w-0">
        {step.order.map((id, p) => {
          const isDummy = id === DUMMY
          const inBlockHere = !done && inBlock(p)
          const box = !inBlockHere
            ? 'border-transparent'
            : isDummy
              ? 'border-[hsl(var(--amber))]/40 bg-[hsl(var(--amber))]/10'
              : 'border-[hsl(var(--amber))]/35 bg-[hsl(var(--amber))]/15'
          return (
            <div key={id} className="flex items-start">
              {p > 0 && (
                <div className={`${FLAG_AREA} flex items-end pb-11`}>
                  <Link active={edgeActive(p)} />
                </div>
              )}
              <div className="flex flex-col items-center">
                <div className={`${FLAG_AREA} flex flex-col items-center justify-end`}>
                  {!done && p === blockFrom && <Flag label="left" tone="amber" />}
                  {!done && p === blockTo && <Flag label="right" tone="amber" />}
                  {flagsOf(p, isDummy).map((f) => (
                    <Flag key={f.label} label={f.label} tone={f.tone} />
                  ))}
                </div>
                <div
                  className={`flex flex-col items-center rounded-xl border-[1.5px] px-1.5 pb-1 pt-0.5 ${box}`}
                >
                  {isDummy ? (
                    <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border px-2 font-code text-[11px] text-ink-soft">
                      dummy
                    </div>
                  ) : (
                    <Node state={nodeState(p)}>{HEAD[id]}</Node>
                  )}
                </div>
                <span className="mt-1 font-code text-[10px] leading-none text-ink-soft">
                  {isDummy ? '第 0 个' : `原 #${id}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 区间色块只有颜色，这里补上文字，保证不靠颜色也能看懂 */}
      <Badge tone={done ? 'easy' : 'amber'} strong={!done}>
        {done ? (
          <>
            ✓ 位置 <b className="font-code">{LEFT}</b>..<b className="font-code">{RIGHT}</b> 已逆序为 [
            {[...HEAD.slice(LEFT - 1, RIGHT)].reverse().join(', ')}]
          </>
        ) : (
          <>
            琥珀色块 = 待反转区间：位置 <b className="font-code">{LEFT}</b>..<b className="font-code">{RIGHT}</b>（节点{' '}
            <b className="font-code">{HEAD[LEFT - 1]}</b>..<b className="font-code">{HEAD[RIGHT - 1]}</b>）
          </>
        )}
      </Badge>

      <Badges className="justify-center">
        <Stat label="pre（前驱）" value={nameOf(step.pre)} tone="teal" />
        <Stat label="cur（逆序段尾）" value={nameOf(step.cur)} tone="teal" />
        <Stat label={`已头插 / ${INSERTS}`} value={step.inserted} tone="amber" />
        {done ? (
          <Answer>
            反转后链表 [<b className="font-code">{readAll(step.order)}</b>]
          </Answer>
        ) : (
          step.next && <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function ReverseLinkedListIiDemo() {
  const steps = useMemo(buildSteps, [])
  const answer = readAll(steps[steps.length - 1].order)
  return (
    <DemoShell
      title="dummy 哨兵 + 头插法，一趟反转区间"
      info={`输入：head = [${HEAD.join(', ')}]、left = ${LEFT}、right = ${RIGHT}（题解示例 1，输出 [${answer}]）。只演示这一个官方示例：它规模最小，又同时含有「pre 从 dummy 走 left - 1 = ${LEFT - 1} 步定位」和「头插 right - left = ${INSERTS} 次」两个阶段，共 ${steps.length} 步。半透明琥珀色块圈出待反转区间并以 left / right 旗标夹住两端，琥珀加粗的边表示本步刚被改接的 next；left == right 时头插 0 次、链表原样返回，本示例不含该退化情形。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '待反转区间色块 / 本步被改接的边（加粗）' },
        { color: TONE.teal, label: 'pre 区间前驱 · cur 逆序段尾' },
        { color: TONE.muted, label: '区间外的节点：不在本次反转范围内' },
        { color: TONE.easy, label: '头插结束，区间已逆序（读出答案）' },
      ]}
    />
  )
}
