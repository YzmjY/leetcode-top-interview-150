import { useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 66. 分隔链表 —— 模式 D：两条哨兵子链分装，收尾断尾后首尾拼接          */
/* ------------------------------------------------------------------ */

/** 题解示例 1：head = [1, 4, 3, 2, 5, 2]、x = 3 → [1, 2, 2, 4, 3, 5] */
const VALS = [1, 4, 3, 2, 5, 2]
const X = 3
const N = VALS.length

type Side = 'small' | 'large'

interface Step {
  phase: 'init' | 'classify' | 'end' | 'cut' | 'join' | 'done'
  /** 本步刚判定归链的原链表节点下标；init / end / cut / join / done 为 -1 */
  picked: number
  /** 刚判定节点归入的链 */
  side: Side | null
  /** head 当前指向的节点下标；null = head 已经走到 nil */
  cur: number | null
  /** 两条子链上按尾插顺序排列的节点下标（不含哨兵） */
  small: number[]
  large: number[]
  /** 大链尾的旧指针是否已经用 large.Next = nil 断开 */
  cut: boolean
  /** 是否已经执行 small.Next = largeDummy.Next */
  joined: boolean
  note: string
  /** 真正的下一步动作，由后一个快照回填，供 Hint 使用 */
  next: string
}

/** 真跑一遍「两个哨兵 → 逐节点尾插分装 → large.Next = nil → 拼接」 */
function buildSteps(): Step[] {
  const steps: Step[] = []
  const small: number[] = []
  const large: number[] = []

  const push = (
    phase: Step['phase'],
    picked: number,
    side: Side | null,
    cur: number | null,
    cut: boolean,
    joined: boolean,
    note: string
  ) => {
    steps.push({
      phase,
      picked,
      side,
      cur,
      small: small.slice(),
      large: large.slice(),
      cut,
      joined,
      note,
      next: '',
    })
  }

  push(
    'init',
    -1,
    null,
    0,
    false,
    false,
    `观察：head = [${VALS.join(', ')}]、x = ${X}，共 ${N} 个节点。判断：要求所有 val < ${X} 的节点排在 val ≥ ${X} 的节点之前，并且两段内部各自保持原相对顺序——这正是稳定分区。动作：两个哨兵 smallDummy、largeDummy 分别作为两条链的表头，尾指针 small、large 都先停在哨兵上，head 从下标 0（值 ${VALS[0]}）开始逐个考察。为什么：哨兵让「挂进来的第一条节点」不需要特判，返回值固定是 smallDummy.Next。`
  )

  for (let j = 0; j < N; j++) {
    const v = VALS[j]
    const side: Side = v < X ? 'small' : 'large'
    const bucket = side === 'small' ? small : large
    bucket.push(j)
    const cur = j + 1 < N ? j + 1 : null
    const chain = bucket.map((id) => VALS[id]).join(' → ')
    const rest =
      cur === null
        ? 'head 前移后变成 nil，遍历结束'
        : `head 前移到下标 ${cur}（值 ${VALS[cur]}）`
    const judge =
      v < X
        ? `${v} < x = ${X} 成立，节点 ${v} 归 small 链`
        : v === X
          ? `${v} < x = ${X} 不成立——${v} 恰好等于 x，按题目「大于或等于 x」的约定归 large 链`
          : `${v} < x = ${X} 不成立，节点 ${v} 归 large 链`
    const why =
      side === 'small'
        ? `尾插只改 small 尾节点的 next、不动链内已有的节点，所以 ${chain} 的先后顺序与原链表一致，而且接入的是原节点、没有新建`
        : `判定只有 val < x 一个分支，走 else 的节点不会漏；尾插不会修改被接入节点自己的 next——节点 ${v} 的 next 此刻仍指着${j + 1 < N ? `下标 ${j + 1} 的节点 ${VALS[j + 1]}` : ' nil（它就是原链表的尾节点）'}，这条旧指针留到收尾时统一处理`

    push(
      'classify',
      j,
      side,
      cur,
      false,
      false,
      `观察：head 指向下标 ${j} 的节点 ${v}。判断：${judge}，接入后 ${side} 链是 ${chain}。动作：${side}.Next = 节点 ${v}、${side} 前移到它，${rest}。为什么：${why}。`
    )
  }

  const lastLarge = large[large.length - 1]
  const staleSucc = lastLarge + 1
  push(
    'end',
    -1,
    null,
    null,
    false,
    false,
    `观察：head 已经是 nil，small 链 = ${small.map((id) => VALS[id]).join(' → ')}，large 链 = ${large.map((id) => VALS[id]).join(' → ')}。判断：large 尾指针停在节点 ${VALS[lastLarge]} 上，而它的 next 仍指着下标 ${staleSucc} 的节点 ${VALS[staleSucc]}——那个节点已经被分到 small 链。动作：收尾按题解的顺序先做 large.Next = nil 断掉这条旧指针，再做 small.Next = largeDummy.Next 拼接。为什么：本步直接拼接的话，链会从 ${VALS[lastLarge]} 绕回 small 链的节点 ${VALS[staleSucc]} 形成环，所以 large.Next = nil 必须写在拼接之前。`
  )

  push(
    'cut',
    -1,
    null,
    null,
    true,
    false,
    `观察：已执行 large.Next = nil，尾指针 large 仍停在节点 ${VALS[lastLarge]} 上，但它不再指向节点 ${VALS[staleSucc]}。判断：大链此时是一条以 nil 收口的独立链 ${large.map((id) => VALS[id]).join(' → ')}。动作：接着可以把 small 链尾接到 largeDummy.Next，也就是大链的头节点 ${VALS[large[0]]}。为什么：置空的是尾指针 large 的 next，而不是哨兵 largeDummy 的 next——哨兵的 next 正是大链的头，把它置空会整条丢掉大链。`
  )

  const smallTail = small[small.length - 1]
  push(
    'join',
    -1,
    null,
    null,
    true,
    true,
    `观察：已执行 small.Next = largeDummy.Next，small 尾节点（下标 ${smallTail}，值 ${VALS[smallTail]}）的 next 从 nil 改成了大链头节点 ${VALS[large[0]]}。判断：小链整体在前、大链整体在后，两段内部的先后顺序都没有被动过。动作：返回 smallDummy.Next，也就是从节点 ${VALS[small[0]]} 开始的这条链。为什么：拼接只改了两条链之间的连接关系，没有增删节点，结果链包含全部 ${N} 个原节点。`
  )

  push(
    'done',
    -1,
    null,
    null,
    true,
    true,
    `结论：返回 smallDummy.Next，结果 = [${[...small, ...large].map((id) => VALS[id]).join(', ')}]。判断：前 ${small.length} 个节点全部 < ${X}、后 ${large.length} 个节点全部 ≥ ${X}，且两段内部保持原相对顺序，满足「所有小于 x 的节点都出现在大于或等于 x 的节点之前」且保留初始相对位置。为什么复杂度是 O(n) / O(1)：每个节点只被考察一次、只有常数次指针改写，没有新建节点，额外空间只用两个哨兵和两个尾指针。`
  )

  // Hint 的「下一步：」前缀由组件硬编码，这里用后一个快照回填真正的下一步动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'classify' && b.side !== null) {
      const v = VALS[b.picked]
      s.next = `考察下标 ${b.picked} 的节点 ${v}：${v} < x = ${X} ${b.side === 'small' ? '成立' : '不成立'}，把它接到 ${b.side} 链尾`
    } else if (b.phase === 'end') {
      s.next = 'head 已经走到 nil，遍历结束，进入收尾'
    } else if (b.phase === 'cut') {
      s.next = `先做 large.Next = nil，断开大链尾节点 ${VALS[lastLarge]} 的旧指针`
    } else if (b.phase === 'join') {
      s.next = '再做 small.Next = largeDummy.Next，把两条链首尾相接'
    } else {
      s.next = '返回 smallDummy.Next，读出结果链'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 已从原链表分拣走的节点：18% ink 灰底 + 虚线边（与 TONE.muted 同值） */
const TAKEN = 'border-dashed bg-[hsl(var(--ink)/0.18)] text-ink-soft'

function RowLabel({ children }: { children: string }) {
  return (
    <div className="mt-6 flex h-11 w-11 shrink-0 items-center justify-end pr-1">
      <span className="font-code text-[11px] font-bold text-ink-soft">{children}</span>
    </div>
  )
}

/** 链尾的 nil 收口；label 用来挂 head 旗标 */
function NilNode({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <Flag label={label} tone="ink" />
      <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border px-2 font-code text-xs text-ink-soft">
        nil
      </div>
    </div>
  )
}

/** 子链尾端：真的为 nil / next 还没被后面的节点覆盖 / 旧指针已经指向 small 链节点 */
type ChainEnd = { kind: 'nil' } | { kind: 'pending' } | { kind: 'stale'; id: number }

function chainEndView(end: ChainEnd) {
  if (end.kind === 'nil') {
    return (
      <div className="flex items-start">
        <div className="mt-6 flex h-11 items-center">
          <Link />
        </div>
        <NilNode />
      </div>
    )
  }
  if (end.kind === 'pending') {
    return (
      <div className="mt-6 flex h-11 items-center">
        <Link />
        <span className="whitespace-nowrap font-code text-[10px] text-ink-soft">next 未改写</span>
      </div>
    )
  }
  return (
    <div className="flex items-start">
      <div className="mt-6 flex h-11 items-center">
        <Link />
      </div>
      <div className="flex flex-col items-center">
        <span
          className="flex h-6 items-end whitespace-nowrap text-[10px] font-bold leading-none"
          style={{ color: TONE.hard }}
        >
          旧指针→small 链
        </span>
        <div
          className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed px-2 font-code text-sm font-semibold"
          style={{ borderColor: TONE.hard, color: TONE.hard }}
        >
          {VALS[end.id]}
        </div>
        <span className="mt-1 font-code text-[10px] text-ink-soft">{end.id}</span>
      </div>
    </div>
  )
}

/** 一条子链：dummy 哨兵在左，节点按尾插顺序向右排；name 兼作尾指针旗标 */
function SubChainRow({
  name,
  ids,
  tone,
  end,
}: {
  name: string
  ids: number[]
  tone: 'amber' | 'teal'
  end: ReactNode
}) {
  const tail = ids.length > 0 ? ids[ids.length - 1] : null
  return (
    <div className="flex w-full items-start gap-2">
      <RowLabel>{name}</RowLabel>
      <div className="flex min-w-0 flex-wrap items-start">
        <div className="flex flex-col items-center">
          <Flag label={tail === null ? name : 'dummy'} tone={tail === null ? tone : 'ink'} />
          <Node className="border-dashed px-2 text-[11px] font-normal text-ink-soft">dummy</Node>
        </div>
        {ids.map((id) => (
          <div key={id} className="flex items-start">
            <div className="mt-6 flex h-11 items-center">
              <Link />
            </div>
            <div className="flex flex-col items-center">
              <Flag label={id === tail ? name : undefined} tone={tone} />
              <Node state={tone === 'amber' ? 'active' : 'teal'}>{VALS[id]}</Node>
            </div>
          </div>
        ))}
        {end}
      </div>
    </div>
  )
}

function Stage(step: Step) {
  const isAssigned = (i: number) => step.small.includes(i) || step.large.includes(i)
  const smallTail = step.small.length > 0 ? step.small[step.small.length - 1] : null
  const largeTail = step.large.length > 0 ? step.large[step.large.length - 1] : null

  /** small 链尾端：拼接后指到大链头，否则按指针事实画 nil / 未改写 */
  const smallEnd: ReactNode = step.joined ? (
    <div className="mt-6 flex h-11 items-center gap-1">
      <Link active />
      <span
        className="whitespace-nowrap font-code text-[10px] font-bold"
        style={{ color: TONE.amber }}
      >
        → {step.large.length > 0 ? `节点 ${VALS[step.large[0]]}` : 'nil'}（largeDummy.Next）
      </span>
    </div>
  ) : (
    chainEndView(smallTail === null || smallTail === N - 1 ? { kind: 'nil' } : { kind: 'pending' })
  )

  /** large 链尾端：尾节点的 next 若已指向 small 链节点，就是那条必须先断开的旧指针 */
  const largeEnd: ChainEnd =
    step.cut || largeTail === null || largeTail === N - 1
      ? { kind: 'nil' }
      : step.small.includes(largeTail + 1)
        ? { kind: 'stale', id: largeTail + 1 }
        : { kind: 'pending' }

  const mergedIds = [...step.small, ...step.large]
  const smallCount = step.small.length

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 原链表：head 旗标指向本步待考察的节点，已分拣的节点留在原位变灰虚线 */}
      <div className="flex w-full items-start gap-2">
        <RowLabel>原链表</RowLabel>
        <div className="flex min-w-0 flex-wrap items-start">
          {VALS.map((v, i) => (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className="mt-6 flex h-11 items-center">
                  <Link />
                </div>
              )}
              <div className="flex flex-col items-center">
                <Flag label={step.cur === i ? 'head' : undefined} tone="ink" />
                <Node className={isAssigned(i) ? TAKEN : undefined}>{v}</Node>
                <span
                  className={
                    step.picked === i
                      ? 'mt-1 font-code text-[10px] font-bold text-ink'
                      : 'mt-1 font-code text-[10px] text-ink-soft'
                  }
                >
                  {i}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-start">
            <div className="mt-6 flex h-11 items-center">
              <Link />
            </div>
            <NilNode label={step.cur === null ? 'head' : undefined} />
          </div>
        </div>
      </div>

      {/* small 子链：哨兵 smallDummy + 尾指针 small */}
      <SubChainRow name="small" ids={step.small} tone="amber" end={smallEnd} />

      {/* large 子链：哨兵 largeDummy + 尾指针 large */}
      <SubChainRow name="large" ids={step.large} tone="teal" end={chainEndView(largeEnd)} />

      {/* 拼接结果：smallDummy.Next，左段 val < x、右段 val ≥ x，接点用加粗边标出 */}
      {step.joined && (
        <div className="flex w-full items-start gap-2">
          <RowLabel>结果</RowLabel>
          <div className="flex min-w-0 flex-wrap items-start">
            {mergedIds.map((id, i) => (
              <div key={id} className="flex items-start">
                {i > 0 && (
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-6 items-end whitespace-nowrap text-[10px] font-bold leading-none"
                      style={i === smallCount ? { color: TONE.amber } : undefined}
                    >
                      {i === smallCount ? '拼接点' : ''}
                    </span>
                    <div className="flex h-11 items-center">
                      <Link active={i === smallCount} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <Flag />
                  <Node state={i < smallCount ? 'active' : 'teal'}>{VALS[id]}</Node>
                </div>
              </div>
            ))}
            <div className="flex items-start">
              <div className="mt-6 flex h-11 items-center">
                <Link />
              </div>
              <NilNode />
            </div>
          </div>
        </div>
      )}

      <Badges className="justify-center">
        <Stat label="head" value={step.cur === null ? 'nil' : VALS[step.cur]} tone="ink" />
        <Stat label="small 链" value={step.small.length} tone="amber" />
        <Stat label="large 链" value={step.large.length} tone="teal" />
        {step.phase === 'done' ? (
          <Answer>
            结果 <b className="font-code">[{mergedIds.map((id) => VALS[id]).join(', ')}]</b>
          </Answer>
        ) : (
          <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function PartitionListDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="两条哨兵链分装，断尾后首尾拼接（稳定分区）"
      info={`输入取题解示例 1：head = [${VALS.join(', ')}]、x = ${X} → 输出 [1, 2, 2, 4, 3, 5]，共 ${steps.length} 步。示例 2（head = [2, 1]、x = 2）节点更少，但演示不出本题最容易漏掉的一步：大链尾节点的 next 仍指向原链表中的后继（本例是节点 5 → 节点 2，而节点 2 已被分到 small 链），看不到 large.Next = nil 的必要性，所以采用示例 1。上排是原链表，head 旗标指向本步待考察的节点，节点下方是下标（刚考察过的下标加粗），已分拣的节点留在原位变灰虚线；中间两排是以 smallDummy、largeDummy 为哨兵的两条子链，旗标 small / large 是各自的尾指针，行尾「next 未改写」表示该尾节点的 next 还保留着原链表里的后继、红色虚节点则表示这条旧指针已经指向 small 链的节点；拼接步之后追加 smallDummy.Next 这一行结果，两段分别用 amber、teal 上色，接点用加粗边标出。`}
      steps={steps}
      autoMs={1500}
      stageMinHeight={430}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'small 链节点（val < x）= 结果左段；加粗边为拼接点' },
        { color: TONE.teal, label: 'large 链节点（val ≥ x）= 结果右段' },
        { color: TONE.ink, label: 'head 旗标：本步待考察的原链表节点' },
        { color: TONE.muted, label: '原链表中已分拣走的节点（虚线灰）' },
        { color: TONE.hard, label: '大链尾未断开的旧指针：指向 small 链节点' },
      ]}
    />
  )
}
