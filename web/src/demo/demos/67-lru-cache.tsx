import { Fragment, useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Link, Node, Stat, TONE } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 67. LRU 缓存 —— 模式 G：哈希表（key → 节点下标）+ 双向链表两行视图     */
/* 上行哈希表负责 O(1) 定位，下行双向链表按 MRU → LRU 排列；            */
/* get 命中与 put 都要头插刷新，超容时从 tail 端摘除并同步删哈希表。     */
/* ------------------------------------------------------------------ */

type Op = { type: 'put'; key: number; val: number } | { type: 'get'; key: number }

/** 题解官方示例：capacity = 2，9 个操作，期望输出 [null,null,null,1,null,-1,null,-1,3,4] */
const CAPACITY = 2
const OPS: Op[] = [
  { type: 'put', key: 1, val: 1 },
  { type: 'put', key: 2, val: 2 },
  { type: 'get', key: 1 },
  { type: 'put', key: 3, val: 3 },
  { type: 'get', key: 2 },
  { type: 'put', key: 4, val: 4 },
  { type: 'get', key: 1 },
  { type: 'get', key: 3 },
  { type: 'get', key: 4 },
]

function opLabel(op: Op): string {
  return op.type === 'put' ? `put(${op.key}, ${op.val})` : `get(${op.key})`
}

interface Step {
  phase: 'init' | 'put-new' | 'evict' | 'move-out' | 'move-in' | 'get-miss' | 'done'
  /** 链表节点 key，从左（head 侧 = MRU）到右（tail 侧 = LRU） */
  order: number[]
  /** 哈希表中的 key，按升序展示（哈希表本身无序） */
  keys: number[]
  /** key → value 快照（节点上要显示值） */
  vals: Record<number, number>
  /** 本步操作的 key */
  activeKey: number | null
  /** put 新键写入的 value */
  putVal: number | null
  /** move-out 步：已被 removeNode 摘下、尚未 addToHead 的 key */
  detached: number | null
  evictedKey: number | null
  evictedVal: number | null
  /** get 的返回值（-1 = 未命中），put 为 null */
  ret: number | null
  size: number
  opIndex: number
  opLabel: string | null
  returns: number[]
  note: string
  /** 下一步动作，最后按后一个快照统一回填（Hint 前缀「下一步：」是硬编码的） */
  next: string
}

interface SnapExtra {
  activeKey?: number
  putVal?: number
  detached?: number
  evictedKey?: number
  evictedVal?: number
  ret?: number
}

function buildSteps(): Step[] {
  /* 真实结构：map = key → value，order[0] 是 head 侧的最近使用节点 */
  const map = new Map<number, number>()
  const order: number[] = []
  const returns: number[] = []
  const steps: Step[] = []

  const snap = (phase: Step['phase'], opIndex: number, extra: SnapExtra, note: string) => {
    const vals: Record<number, number> = {}
    map.forEach((v, k) => {
      vals[k] = v
    })
    steps.push({
      phase,
      order: order.slice(),
      keys: [...map.keys()].sort((a, b) => a - b),
      vals,
      activeKey: extra.activeKey ?? null,
      putVal: extra.putVal ?? null,
      detached: extra.detached ?? null,
      evictedKey: extra.evictedKey ?? null,
      evictedVal: extra.evictedVal ?? null,
      ret: extra.ret ?? null,
      size: map.size,
      opIndex,
      opLabel: opIndex >= 0 && opIndex < OPS.length ? opLabel(OPS[opIndex]) : null,
      returns: returns.slice(),
      note,
      next: '',
    })
  }

  const removeNode = (key: number) => {
    order.splice(order.indexOf(key), 1)
  }
  const addToHead = (key: number) => {
    order.unshift(key)
  }

  snap(
    'init',
    -1,
    {},
    `观察：capacity = ${CAPACITY}，输入是题解示例的 ${OPS.length} 个操作；head 与 tail 两个哨兵先互连（head.Next = tail），哈希表与链表都为空。判断：head 侧记最近使用（MRU）、tail 侧记最久未使用（LRU），哈希表把 key 映射到链表上的节点，两个结构必须一一对应。动作：从 put(1, 1) 开始执行，输出序列是 [null,null,null,1,null,-1,null,-1,3,4] 中的非 null 项。为什么：哈希表负责按 key O(1) 定位节点，双向链表负责 O(1) 摘除与头插，合起来 get / put 才都是平均 O(1)。`
  )

  OPS.forEach((op, k) => {
    if (op.type === 'put') {
      const old = map.get(op.key)

      if (old !== undefined) {
        /* key 已存在：只改值 + moveToHead，不新建节点、容量不变 */
        map.set(op.key, op.val)
        removeNode(op.key)
        snap(
          'move-out',
          k,
          { activeKey: op.key, putVal: op.val },
          `观察：put(${op.key}, ${op.val}) 在哈希表里命中，旧 value 是 ${old}。判断：key 已存在，不能新建节点，只需改值并刷新使用顺序。动作：先把 value 改成 ${op.val}，再用 removeNode 把它从原位置摘下，此刻链表是 [${order.join(' → ')}]。为什么：漏判「已存在」会插入重复节点，容量被无端撑大，淘汰逻辑也跟着错。`
        )
        addToHead(op.key)
        snap(
          'move-in',
          k,
          { activeKey: op.key, putVal: op.val },
          `观察：key ${op.key} 的节点已在链外，value 是 ${op.val}，哈希表项数仍是 ${map.size}。判断：moveToHead 的后半段就是把它插回 head 与 head.Next 之间。动作：addToHead 之后链表变成 [${order.join(' → ')}]，容量不变。为什么：键集合与节点集合都没变，哈希表与链表依然一一对应。`
        )
        return
      }

      /* key 不存在：新建节点 + addToHead，随后判断是否超容 */
      map.set(op.key, op.val)
      addToHead(op.key)
      const over = map.size > CAPACITY
      snap(
        'put-new',
        k,
        { activeKey: op.key, putVal: op.val },
        `观察：put(${op.key}, ${op.val}) 在哈希表里查不到 key ${op.key}。判断：这是新键，必须新建节点而不是改值。动作：把 ${op.key} 登记进哈希表，再 addToHead 插到 head 与 head.Next 之间，链表成为 [${order.join(' → ')}]（左端 MRU）。为什么：刚写入的键就是最近使用，且节点同时存 Key 和 Val，淘汰时才查得到该删哈希表里的哪个键${over ? `；此刻 size = ${map.size} 已超过 capacity = ${CAPACITY}` : ''}。`
      )

      if (over) {
        const victim = order[order.length - 1]
        const victimVal = map.get(victim) ?? 0
        removeNode(victim)
        map.delete(victim)
        snap(
          'evict',
          k,
          { activeKey: op.key, putVal: op.val, evictedKey: victim, evictedVal: victimVal },
          `观察：插入 key ${op.key} 之后哈希表有 ${map.size + 1} 项，超过 capacity = ${CAPACITY}，而 tail.Prev 正是链表最右端的 key ${victim}（value = ${victimVal}）。判断：排在最右端的 ${victim} 就是最久未使用，必须牺牲它。动作：removeTail() 把它从链表摘掉，紧接着 delete(cache, ${victim})——链表变成 [${order.join(' → ')}]，哈希表只剩 ${[...map.keys()].sort((a, b) => a - b).join('、')}。为什么：只摘链表不删哈希表会残留脏节点，之后的 get 会命中它并把它接回链表，缓存就坏了。`
        )
      }
      return
    }

    /* get */
    const v = map.get(op.key)
    if (v === undefined) {
      snap(
        'get-miss',
        k,
        { activeKey: op.key, ret: -1 },
        `观察：get(${op.key}) 在哈希表里查不到 key ${op.key}。判断：哈希表与链表一一对应，表里没有就意味着缓存里确实没有。动作：直接返回 -1，链表 [${order.join(' → ')}] 与哈希表都不改动。为什么：未命中不影响任何节点的使用顺序，所以淘汰次序也不变。`
      )
      returns.push(-1)
      return
    }

    removeNode(op.key)
    const rest = order.slice()
    snap(
      'move-out',
      k,
      { activeKey: op.key, detached: op.key },
      `观察：get(${op.key}) 在哈希表里命中，value = ${v}。判断：LRU 的语义是「读也算使用」，这个节点必须挪到 head 侧刷新位置。动作：先 removeNode，前后指针各改一次就把它摘下来，此刻它暂时不在链表上，链表只剩 [${rest.join(' → ')}]。为什么：双向链表带 Prev，删除任意节点都不用先找前驱，这正是「必须双向」的原因。`
    )
    addToHead(op.key)
    returns.push(v)
    snap(
      'move-in',
      k,
      { activeKey: op.key, ret: v },
      `观察：key ${op.key} 已从链上摘下，上一步链表是 [${rest.join(' → ')}]，而它在哈希表里的记录一直还在。判断：moveToHead 的后半段就是把它插回 head 与 head.Next 之间。动作：addToHead 后链表为 [${order.join(' → ')}]，get 返回 value = ${v}。为什么：刚被读过的节点离 tail 最远，绝不会成为下一个被逐出的节点。`
    )
  })

  const mru = order[0]
  const lru = order[order.length - 1]
  snap(
    'done',
    OPS.length,
    {},
    `观察：${OPS.length} 个操作全部执行完，get 依次返回 ${returns.join(' → ')}，正好是题解输出 [null,null,null,1,null,-1,null,-1,3,4] 中的非 null 项。判断：最终链表从 head 到 tail 是 [${order.join(' → ')}]，哈希表只剩 ${[...map.keys()].sort((a, b) => a - b).join('、')}，最近使用是 ${mru}=${map.get(mru)}，下一个会被淘汰的是 ${lru}=${map.get(lru)}。动作：读最终缓存，最近使用在前、最久未使用在后。为什么：get 与 put 都只做一次哈希查找加常数次指针改写，平均时间 O(1)，空间 O(capacity)。`
  )

  /* Hint 必须是「真正的下一步动作」：统一由后一个快照回填 */
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) {
      s.next = ''
    } else if (b.phase === 'done') {
      s.next = '操作序列结束，输出最终缓存与复杂度'
    } else if (b.phase === 'put-new') {
      s.next = `执行 put(${b.activeKey}, ${b.putVal})：未命中 → 新建节点并 addToHead`
    } else if (b.phase === 'evict') {
      s.next = `size 超过 capacity，removeTail() 摘掉 key ${b.evictedKey} 并 delete cache[${b.evictedKey}]`
    } else if (b.phase === 'move-out') {
      s.next =
        b.detached !== null
          ? `执行 get(${b.activeKey})：命中 → 先 removeNode 把节点从链上摘下`
          : `执行 put(${b.activeKey}, ${b.putVal})：命中 → 改值后 removeNode`
    } else if (b.phase === 'move-in') {
      s.next =
        b.ret !== null
          ? `addToHead 把 key ${b.activeKey} 插到 head 之后，返回 value ${b.ret}`
          : `addToHead 把 key ${b.activeKey} 插到 head 之后`
    } else if (b.phase === 'get-miss') {
      s.next = `执行 get(${b.activeKey})：哈希表查不到，返回 -1`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type NodeState = 'idle' | 'active' | 'teal' | 'ok' | 'dim'

const NODE_MEDIUM =
  'border-[hsl(var(--medium))] bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]'
const NODE_HARD =
  'border-[hsl(var(--hard))] bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))] line-through'

const LABEL_AMBER = 'text-[hsl(var(--amber))]'
const LABEL_TEAL = 'text-[hsl(var(--teal))]'
const LABEL_EASY = 'text-[hsl(var(--easy))]'
const LABEL_MEDIUM = 'text-[hsl(var(--medium))]'

interface NodeView {
  state: NodeState
  className?: string
  label: string
  labelClass: string
}

/** 节点角色：本步新建（青）/ 本步操作（琥珀）/ 头部 MRU（绿）/ 尾部 LRU（黄） */
function viewOf(step: Step, key: number, i: number): NodeView {
  const last = step.order.length - 1
  if (key === step.activeKey && (step.phase === 'put-new' || step.phase === 'evict')) {
    return { state: 'teal', label: '本步新插入', labelClass: LABEL_TEAL }
  }
  if (key === step.activeKey && step.phase === 'move-in') {
    return { state: 'active', label: '移到头部（MRU）', labelClass: LABEL_AMBER }
  }
  if (i === 0) {
    return {
      state: 'ok',
      label: i === last ? '最近使用（也是尾部）' : '最近使用（MRU）',
      labelClass: LABEL_EASY,
    }
  }
  if (i === last) {
    return {
      state: 'idle',
      className: NODE_MEDIUM,
      label: '最久未使用（LRU）',
      labelClass: LABEL_MEDIUM,
    }
  }
  return { state: 'idle', label: '中间节点', labelClass: 'text-ink-soft' }
}

/** 哨兵节点：虚线框、不存数据，只是让头插与摘尾都不必判空 */
function Sentinel({ side }: { side: 'head' | 'tail' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border bg-secondary px-2 font-code text-[10px] text-ink-soft">
        {side}
      </div>
      <span className="flex h-4 items-center text-[10px] leading-none text-ink-soft">
        {side === 'head' ? 'MRU 侧' : 'LRU 侧'}
      </span>
    </div>
  )
}

function HashRow({ step }: { step: Step }) {
  const miss = step.phase === 'get-miss'
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-ink">哈希表 cache：key → 节点下标</span>
        {miss ? (
          <Badge tone="hard">
            查 key <b className="font-code">{step.activeKey}</b> 未命中 → 返回{' '}
            <b className="font-code">-1</b>
          </Badge>
        ) : (
          <span className="text-[10px] text-ink-soft">
            下标 = 该节点在下方链表中的位置（0 = head 侧）
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {step.keys.length === 0 ? (
          <span className="text-[11px] text-ink-soft">（空表）</span>
        ) : (
          step.keys.map((k) => {
            const idx = step.order.indexOf(k)
            return (
              <Cell
                key={k}
                size="sm"
                state={k === step.activeKey ? 'active' : 'idle'}
                className="h-auto w-16 min-w-0 shrink-0 flex-col gap-0 py-1"
              >
                <span className="font-code text-[13px] font-semibold">{k}</span>
                <span className="font-code text-[10px] text-ink-soft">
                  {idx >= 0 ? `#${idx}` : '摘除中'}
                </span>
              </Cell>
            )
          })
        )}
      </div>
    </div>
  )
}

function ListRow({ step }: { step: Step }) {
  const inserting = step.phase === 'put-new' || step.phase === 'move-in'
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-ink">
          双向链表：head 侧 = 最近使用 → tail 侧 = 最久未使用
        </span>
        <span className="text-[10px] text-ink-soft">节点同时存 Key 与 Val</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-y-2">
        <Sentinel side="head" />
        {step.order.map((k, i) => {
          const v = viewOf(step, k, i)
          return (
            <Fragment key={k}>
              <Link active={inserting && i <= 1} />
              <div className="flex flex-col items-center gap-1">
                <Node state={v.state} className={v.className}>
                  {`${k}:${step.vals[k]}`}
                </Node>
                <span
                  className={cn(
                    'flex h-4 items-center font-code text-[10px] leading-none',
                    v.labelClass
                  )}
                >
                  {v.label}
                </span>
              </div>
            </Fragment>
          )
        })}
        <Link />
        <Sentinel side="tail" />
      </div>
    </div>
  )
}

/** 本步动作通道：高度固定，步骤切换时舞台不跳动 */
function chipOf(step: Step): ReactNode {
  if (step.phase === 'put-new') {
    return <Badge tone="teal">＋ 登记哈希表 + addToHead 插到 head 之后，成为最近使用</Badge>
  }
  if (step.phase === 'evict' && step.evictedKey !== null) {
    return (
      <>
        <Node className={cn(NODE_HARD, 'fade-up')}>{`${step.evictedKey}:${step.evictedVal}`}</Node>
        <Badge tone="hard">
          － removeTail() 摘除 key <b className="font-code">{step.evictedKey}</b>，再 delete
          哈希表里对应的条目
        </Badge>
      </>
    )
  }
  if (step.phase === 'move-out' && step.detached !== null) {
    return (
      <>
        <Node state="active" className="border-dashed fade-up">
          {`${step.detached}:${step.vals[step.detached]}`}
        </Node>
        <Badge tone="amber">removeNode：前后指针各改一次就摘下，O(1)</Badge>
      </>
    )
  }
  if (step.phase === 'move-in') {
    return <Badge tone="amber">addToHead：插到 head 与 head.Next 之间，刷新为最近使用</Badge>
  }
  if (step.phase === 'get-miss') {
    return <Badge tone="hard">哈希表查不到 → 返回 -1，链表与哈希表都不动</Badge>
  }
  return null
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const isPut = step.opLabel !== null && step.opLabel.startsWith('put')
  const last = step.order.length - 1
  const mru = step.order.length > 0 ? `${step.order[0]}:${step.vals[step.order[0]]}` : '—'
  const lru = step.order.length > 0 ? `${step.order[last]}:${step.vals[step.order[last]]}` : '—'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 上行：哈希表 key → 节点下标 */}
      <HashRow step={step} />

      {/* 中行：本步的指针动作 */}
      <div className="flex min-h-11 flex-wrap items-center justify-center gap-2">{chipOf(step)}</div>

      {/* 下行：双向链表 head（MRU）→ tail（LRU） */}
      <ListRow step={step} />

      <Badges className="justify-center">
        <Badge tone={step.opLabel === null ? 'plain' : 'amber'}>
          当前操作{' '}
          <b className="font-code">
            {step.opLabel ?? (done ? '操作序列结束' : `初始化（capacity = ${CAPACITY}）`)}
          </b>
        </Badge>
        <Stat
          label="缓存大小"
          value={`${step.size} / ${CAPACITY}`}
          tone={step.size > CAPACITY ? 'hard' : 'amber'}
        />
        {step.ret !== null ? (
          <Stat label="get 返回" value={step.ret} tone={step.ret === -1 ? 'hard' : 'easy'} />
        ) : isPut ? (
          <Badge tone="plain">
            哈希表项数 <b className="font-code">{step.size}</b>，put 无返回值
          </Badge>
        ) : done || step.phase === 'init' ? (
          <Badge tone={done ? 'easy' : 'plain'}>哈希表与链表一一对应</Badge>
        ) : (
          <Badge tone="amber">get 命中，本步先摘节点</Badge>
        )}
        {done ? (
          <Answer>
            get 依次返回 <b className="font-code">{step.returns.join(' → ')}</b>；最近使用{' '}
            <b className="font-code">{mru}</b>、最久未使用 <b className="font-code">{lru}</b>
          </Answer>
        ) : (
          step.next && <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function LruCacheDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="哈希表 + 双向链表，get / put 均摊 O(1)"
      info={`输入（题解官方示例）：capacity = ${CAPACITY}，依次执行 put(1, 1)、put(2, 2)、get(1)、put(3, 3)、get(2)、put(4, 4)、get(1)、get(3)、get(4)，期望返回 [null,null,null,1,null,-1,null,-1,3,4]。演示共 ${steps.length} 步：每次 get 命中拆成 removeNode 与 addToHead 两步，每次 put 新键拆成「addToHead 插入」与「超容 removeTail 淘汰」两步；输入内容与操作顺序未作改动，本示例里没有 put 命中已有 key 的情形。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.easy, label: '链表头 = 最近使用（MRU 端）' },
        { color: TONE.amber, label: '本步操作的 key / 节点（get 命中 → moveToHead）' },
        { color: TONE.teal, label: '本步新建的节点（put 新键 → addToHead）' },
        { color: TONE.medium, label: '链表尾 = 最久未使用（淘汰从这端删）' },
        { color: TONE.hard, label: '未命中返回 -1 / 被 removeTail 逐出的节点' },
      ]}
    />
  )
}
