import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 65. 旋转链表 —— 模式 D：先首尾相连成环，再从 n - k%n 处剪断           */
/* ------------------------------------------------------------------ */

/** 题解示例 1：head = [1,2,3,4,5]，k = 2，输出 [4,5,1,2,3] */
const VALS = [1, 2, 3, 4, 5]
const K_IN = 2

const N = VALS.length
/** 取模后真正需要右移的步数 */
const K = K_IN % N
/** 新头节点在原链表中的下标：正数第 n - k + 1 个 = 倒数第 k 个 */
const NEW_HEAD = N - K
/** 新尾节点在原链表中的下标：正数第 n - k 个 */
const NEW_TAIL = N - K - 1

interface Step {
  phase: 'init' | 'traverse' | 'ring' | 'done'
  /** 节点展示顺序（原链表下标），断开前恒为 [0,1,2,3,4] */
  order: number[]
  /** 第一阶段已访问的节点下标（tail 走过的位置） */
  visited: number[]
  /** 取模后的 k；未算出为 null */
  k: number | null
  /** 原尾节点下标 */
  tail: number
  /** 新尾节点下标（断点），未定位为 null */
  newTail: number | null
  /** 新头节点下标，未定位为 null */
  newHead: number | null
  note: string
  /** 下一步动作，由后一个快照回填，供 Hint 使用；done 步为空 */
  next: string
}

/** 真实跑一遍「求长度 → 取模 → 成环 → 走 n-k-1 步到新尾 → 断环」 */
function buildSteps(): Step[] {
  const steps: Step[] = []
  let visited: number[] = []
  let tail = 0
  let n = 1
  let k: number | null = null
  let newTail: number | null = null
  let newHead: number | null = null

  const push = (s: Omit<Step, 'order' | 'visited' | 'k' | 'tail' | 'newTail' | 'newHead' | 'next'>, extra?: Partial<Step>) => {
    steps.push({
      order: VALS.map((_, i) => i),
      visited: visited.slice(),
      k,
      tail,
      newTail,
      newHead,
      next: '',
      ...s,
      ...extra,
    })
  }

  visited = [0]
  push({
    phase: 'init',
    note: `观察：head = [${VALS.join(', ')}]、k = ${K_IN}，head 指向节点 ${VALS[0]}，tail 也从节点 ${VALS[0]} 出发，长度计数 n = 1。判断：k 可以大到 2×10^9，不能逐次把尾节点搬到头部，必须先求出长度再取模。动作：让 tail 顺着 next 走到表尾数出 n——先取模、后成环的顺序不能颠倒。`,
  })

  while (tail < N - 1) {
    tail += 1
    n += 1
    visited = [...visited, tail]
    push({
      phase: 'traverse',
      note: `观察：tail 沿 next 前进一步到节点 ${VALS[tail]}，长度计数 n = ${n}，还差 ${N - n} 个节点没数。判断：tail.Next 仍不为 nil，说明尾节点还没到。动作：tail 继续后移一位。为什么：只有先知道 n，才能把 k 折成 k % n。`,
    })
  }

  push({
    phase: 'traverse',
    note: `观察：tail 停在节点 ${VALS[tail]}，tail.Next = nil，遍历结束，长度 n = ${N}。判断：n 已确定，可以消掉整圈旋转。动作：计算 k = k % n = ${K_IN} % ${N} = ${K}，并把它与 0 比较。为什么：右移 n 位等于没动，所以只有余数这一步真正需要执行。`,
  })

  k = K_IN % N
  push({
    phase: 'traverse',
    note: `观察：k % n = ${K_IN} % ${N} = ${k} ≠ 0。判断：链表确实要旋转 ${k} 位，而不是旋转整数圈。动作：准备执行 tail.Next = head 把链表接成环。为什么：这一步必须在确认 k ≠ 0 之后做——若先成环再发现 k % n = 0 就返回，会返回一条带环的链表；余数为 0 时应原地返回 head。`,
  })

  push({
    phase: 'ring',
    note: `观察：执行 tail.Next = head 后，尾节点 ${VALS[N - 1]} 的 next 指回节点 ${VALS[0]}，整条链变成一个环。判断：环上任意节点都能顺着 next 走到任何位置，不必再从头扫描。动作：newTail 从 head 出发走向正数第 n - k = ${N - K} 个节点，它就是要剪断的位置。为什么：结果 B + A 里前段 A 有 n - k 个节点，A 的最后一个节点正是环上的断点。`,
  })

  for (let i = 1; i <= N - K - 1; i++) {
    newTail = i
    push({
      phase: 'ring',
      note: `观察：newTail 从 head 出发走了第 ${i} 步，落在节点 ${VALS[i]}。判断：共需走 n - k - 1 = ${N - K - 1} 步，当前还差 ${N - K - 1 - i} 步。动作：newTail 继续沿 next 后移。为什么：新尾节点是正数第 n - k 个节点，从第 1 个节点出发只需走 n - k - 1 次，多走一步断点就会落到后段 B 中间。`,
    })
  }

  newHead = NEW_HEAD
  push({
    phase: 'ring',
    note: `观察：newTail 停在环上的节点 ${VALS[newTail ?? 0]}，它的 next 指向节点 ${VALS[NEW_HEAD]}。判断：节点 ${VALS[NEW_HEAD]} 是原链表正数第 n - k + 1 个、也是倒数第 k = ${k} 个节点，按定义它就是旋转后的头节点。动作：记下 newHead = 节点 ${VALS[NEW_HEAD]}，预备断环。`,
  })

  const newOrder = [...VALS.map((_, i) => i).slice(NEW_HEAD), ...VALS.map((_, i) => i).slice(0, NEW_HEAD)]
  push(
    {
      phase: 'done',
      note: `观察：执行 newTail.Next = nil 后环被剪断，从 newHead 读出的顺序是 ${newOrder.map((i) => VALS[i]).join(' → ')}，正好是原链表后 ${k} 个节点接到前 ${N - k} 个节点前面。判断：每个节点都向右挪了 k = ${k} 位，末尾溢出的 ${k} 个节点回到开头。动作：返回 newHead = 节点 ${VALS[NEW_HEAD]}，不能返回 head（head 现在落在链表中段）。为什么：第一趟求长度 O(n)、第二趟找断点 O(n-k) ≤ O(n)，与 k 的大小无关；全程只用了 tail / newTail / newHead 三个指针，额外空间 O(1)。`,
    },
    { order: newOrder },
  )

  // 「下一步动作」统一由后一个快照回填，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = `从 newTail 处剪断环，返回 newHead = 节点 ${VALS[NEW_HEAD]}`
    } else if (b.phase === 'ring' && b.newTail === null) {
      s.next = `tail.Next = head 接成环，再让 newTail 从 head 走向第 n - k 个节点`
    } else if (b.phase === 'ring' && b.newHead === null) {
      s.next = `newTail 沿 next 再走一步，找正数第 n - k 个节点`
    } else if (b.phase === 'ring') {
      s.next = `记下 newHead = newTail.Next，再执行 newTail.Next = nil 断环`
    } else if (b.k === null) {
      s.next = `tail 沿 next 后移到节点 ${VALS[b.tail]}，长度计数 n 加 1`
    } else {
      s.next = `取模 k = ${K_IN} % ${N} = ${b.k}，再判断它是否为 0`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

interface LinkInfo {
  active: boolean
  cut: boolean
  ring: boolean
  label: string | null
}

function Stage(step: Step) {
  const ring = step.phase === 'ring'
  const done = step.phase === 'done'
  /** k 还没算出 = 仍在第一阶段「数长度」，此时只有 tail 一个指针在动 */
  const traversing = step.k === null

  /** 本步被点亮的连接线（环的回边 / 断点被剪断处 / 正在走的边） */
  const linkInfo = (a: number, b: number): LinkInfo => {
    if (ring && b === step.newTail && step.newHead !== null) {
      return { active: false, cut: true, ring: false, label: '断点' }
    }
    if (ring && a === N - 1 && b === 0) {
      return { active: true, cut: false, ring: true, label: '环' }
    }
    if (done) {
      return { active: b === NEW_HEAD - 1, cut: false, ring: false, label: null }
    }
    if (step.phase === 'traverse' && step.k === null) {
      return { active: b === step.tail, cut: false, ring: false, label: null }
    }
    return { active: false, cut: false, ring: false, label: null }
  }

  const prefix = `前 n-k = ${N - K} 个节点 A`
  const suffix = `后 k = ${K} 个节点 B`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex max-w-full flex-wrap items-start justify-center gap-y-2">
        {step.order.map((id, pos) => {
          const isNewHead = step.newHead !== null && id === step.newHead
          const isNewTail = step.newTail !== null && id === step.newTail
          const isTail = id === step.tail

          const labels: string[] = []
          if (isNewHead) labels.push('newHead')
          if (isNewTail) labels.push('newTail')
          if (isTail && !isNewHead && !isNewTail) labels.push('tail')

          const state: 'idle' | 'active' | 'teal' | 'ok' | 'dim' = isNewTail
            ? 'ok'
            : isNewHead
              ? 'teal'
              : isTail
                ? 'active'
                : traversing
                  ? step.visited.includes(id)
                    ? 'dim'
                    : 'idle'
                  : id >= NEW_HEAD
                    ? 'active'
                    : 'dim'

          const connector = pos > 0 ? linkInfo(step.order[pos - 1], id) : null

          return (
            <div key={id} className="flex items-start">
              <div className="mt-6 flex h-11 items-center">
                {connector ? (
                  <>
                    <Link active={connector.active} />
                    {connector.ring && (
                      <span className="ml-1 text-[11px] leading-none text-ink-soft">⟲</span>
                    )}
                    {connector.cut && (
                      <span className="ml-1 text-[11px] font-bold leading-none text-ink-soft">
                        ✂
                      </span>
                    )}
                  </>
                ) : (
                  <span className="w-1" aria-hidden />
                )}
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-6 flex-col items-center justify-end leading-none">
                  {labels.length > 0 ? (
                    <>
                      <span
                        className="font-code text-[11px] font-bold"
                        style={{ color: isNewTail ? TONE.easy : isNewHead ? TONE.teal : TONE.amber }}
                      >
                        {labels.join('·')}
                      </span>
                      <span
                        className="mt-0.5 text-[8px]"
                        style={{ color: isNewTail ? TONE.easy : isNewHead ? TONE.teal : TONE.amber }}
                      >
                        ▼
                      </span>
                    </>
                  ) : (
                    <span aria-hidden>&nbsp;</span>
                  )}
                </div>
                <div
                  className="transition-opacity duration-300"
                  style={{ opacity: !traversing && !done && id < NEW_HEAD ? 0.4 : 1 }}
                >
                  <Node state={state}>{VALS[id]}</Node>
                </div>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{id}</span>
              </div>
            </div>
          )
        })}
      </div>

      {ring && (
        <Badge tone={step.newHead !== null ? 'medium' : 'easy'} strong={step.newHead === null}>
          {step.newHead !== null ? (
            <>
              ✂ 断点：newTail = 节点 <b className="font-code">{VALS[NEW_TAIL]}</b> 的 next 指向
              newHead = 节点 <b className="font-code">{VALS[NEW_HEAD]}</b>
            </>
          ) : (
            <>
              ⟲ 环已形成：尾节点 <b className="font-code">{VALS[N - 1]}</b> 的 next 指回头节点{' '}
              <b className="font-code">{VALS[0]}</b>
            </>
          )}
        </Badge>
      )}

      {!traversing && (
        <Badge>{`前段 A（${prefix}）已在链尾 · 后段 B（${suffix}）已在链头`}</Badge>
      )}

      <Badges className="justify-center">
        <Stat label="链表长度 n" value={N} tone="ink" />
        <Stat label="取模后 k" value={step.k === null ? '待计算' : step.k} tone="amber" />
        <Stat
          label="newTail 断点"
          value={step.newTail === null ? '待定位' : VALS[step.newTail]}
          tone="easy"
        />
        <Stat label="newHead 新头" value={step.newHead === null ? '待定位' : VALS[step.newHead]} tone="teal" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && <Answer>旋转结果 [{step.order.map((i) => VALS[i]).join(', ')}]</Answer>}
      </Badges>
    </div>
  )
}

export default function RotateListDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="首尾相接成环，在 n - k%n 处断开"
      info={`输入：head = [${VALS.join(', ')}]、k = ${K_IN}（题解示例 1，输出 [4,5,1,2,3]）。演示只用这一个规模最小的官方示例：先数出长度 n = ${N}、取模 k = ${K_IN} % ${N} = ${K}，再把尾节点接回头节点成环，从 head 走 n - k - 1 = ${N - K - 1} 步到新尾节点后断环，共 ${steps.length} 步。边界说明：当 k % n == 0（如题解示例 2 的 head = [0,1,2]、k = 4）时链表完全不变，代码在成环之前就原地返回 head——先成环再判断会返回一条带环的链表。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '后 k 个节点 B：旋转后移到链头' },
        { color: TONE.muted, label: '前 n-k 个节点 A：旋转后落到链尾（变淡）' },
        { color: TONE.teal, label: 'newHead 新头节点' },
        { color: TONE.easy, label: 'newTail 新尾节点（断点）' },
        { color: TONE.medium, label: 'tail 原尾节点（取模前用于求长度）' },
      ]}
    />
  )
}
