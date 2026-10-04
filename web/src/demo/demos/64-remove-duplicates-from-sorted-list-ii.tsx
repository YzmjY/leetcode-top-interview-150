import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE, type Tone } from './stage'

/* ------------------------------------------------------------------ */
/* 64. 删除排序链表中的重复元素 II —— 模式 D：dummy 哨兵 + 向前看两格整段删除 */
/* ------------------------------------------------------------------ */

/** 题解示例 1：head = [1, 2, 3, 3, 4, 4, 5]，输出 [1, 2, 5] */
const HEAD = [1, 2, 3, 3, 4, 4, 5]
/** 舞台节点 id：0 = dummy 哨兵，1..7 = 下标 0..6，NIL = nil 终止符 */
const NIL = HEAD.length + 1

function valOf(id: number): number {
  return HEAD[id - 1]
}

/** 短名字：dummy / 下标 k / nil */
function nameOf(id: number): string {
  if (id === 0) return 'dummy'
  if (id === NIL) return 'nil'
  return `下标 ${id - 1}`
}

/** 带值的节点描述 */
function nodeOf(id: number): string {
  return id === NIL ? 'nil' : `${nameOf(id)}（值 ${valOf(id)}）`
}

/** 未判断的节点：灰底，与 TONE.muted 同色值 */
const DIM_NODE = 'bg-[hsl(var(--ink)/0.18)] text-ink-soft opacity-100'
/** 待整段删除的重复节点：hard 红 + 划线 */
const RUN_NODE =
  'border-[hsl(var(--hard))] bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))] line-through'

type Phase = 'init' | 'keep' | 'dupe' | 'delete' | 'cleared' | 'done'

interface Step {
  phase: Phase
  /** 当前链表（含 dummy）按 next 顺序排列的节点 id，不可变快照 */
  chain: number[]
  /** cur 所在节点 id */
  cur: number
  /** 本步比较的两个节点 id；init / cleared / done 为 null */
  pair: [number, number] | null
  /** 本步正在整段删除的重复值（delete / cleared 步沿用），null 表示当前没有重复段 */
  dupeVal: number | null
  /** 本步刚摘掉的节点 id，只有 delete 步非 null */
  victim: number | null
  /** 累计被摘掉的节点 id */
  removed: number[]
  /** 本步刚走过 / 改接的那条 next 边的起点节点 id */
  edgeFrom: number | null
  /** 下一步动作，由后一个快照统一回填 */
  next: string
  hintTone: Tone
  note: string
}

/** 跑一遍题解里的真实算法，每步存一个不可变快照（post-action） */
function buildSteps(): Step[] {
  const last = HEAD.length
  /** nxt[id] = 后继 id；nxt[NIL] = NIL 表示链尾 */
  const nxt: number[] = []
  nxt[0] = 1
  for (let id = 1; id <= last; id++) nxt[id] = id === last ? NIL : id + 1
  nxt[NIL] = NIL

  const steps: Step[] = []
  const removed: number[] = []
  let cur = 0

  /** 从 dummy 沿 next 走一遍，得到当前链表快照 */
  const chainOf = (): number[] => {
    const out: number[] = []
    let p = 0
    while (p !== NIL) {
      out.push(p)
      p = nxt[p]
    }
    out.push(NIL)
    return out
  }

  /** 不变量：dummy.Next..cur 这一段恰好是已确认保留的结果前缀 */
  const keptVals = (): number[] => {
    if (cur === 0) return []
    const out: number[] = []
    let p = nxt[0]
    while (p !== NIL) {
      out.push(valOf(p))
      if (p === cur) break
      p = nxt[p]
    }
    return out
  }

  const push = (
    phase: Phase,
    note: string,
    extra: Partial<Pick<Step, 'pair' | 'dupeVal' | 'victim' | 'edgeFrom'>> = {}
  ) => {
    steps.push({
      phase,
      chain: chainOf(),
      cur,
      pair: null,
      dupeVal: null,
      victim: null,
      removed: removed.slice(),
      edgeFrom: null,
      next: '',
      hintTone: 'teal',
      note,
      ...extra,
    })
  }

  push(
    'init',
    `观察：head = [${HEAD.join(', ')}] 已按升序排列，值相等的节点必然相邻，示例里 3 和 4 各连续出现两次。判断：头节点也可能整段被删（如 [1, 1, 1, 2, 3] → [2, 3]），所以先加哨兵 dummy，令 dummy.Next = head，cur 从 dummy 出发。动作：外层循环条件写成 cur.Next ≠ nil 且 cur.Next.Next ≠ nil，两个指针都够得着才可能凑出一对重复。为什么：有了 dummy，「删头节点」和「删中间节点」共用同一套逻辑，最后返回 dummy.Next 即可，不必单写分支。`
  )

  while (nxt[cur] !== NIL && nxt[nxt[cur]] !== NIL) {
    const a = nxt[cur]
    const b = nxt[a]

    if (valOf(a) === valOf(b)) {
      const val = valOf(a)
      push(
        'dupe',
        `观察：cur.Next = ${nodeOf(a)}、cur.Next.Next = ${nodeOf(b)}，两值相等。判断：值 ${val} 在原链表中至少出现两次，按题意要全部删除、一个不留（这正是与「重复元素保留一个」的第 83 题的区别）。动作：记下 val = ${val}，进入内层循环，从 cur.Next 起把值为 ${val} 的节点逐个跳过，cur 原地不动。为什么：cur 已经是「确定为结果」的最后一个节点，跳过整段后还要用同样的「向前看两格」检查新的 cur.Next，所以不能顺手前移。`,
        { pair: [a, b], dupeVal: val }
      )

      while (nxt[cur] !== NIL && valOf(nxt[cur]) === val) {
        const victim = nxt[cur]
        const survivor = nxt[victim]
        nxt[cur] = survivor
        removed.push(victim)
        push(
          'delete',
          `观察：cur.Next = ${nodeOf(victim)}，它的值等于 val = ${val}，不能保留。判断：被删节点的前驱正是 cur，只要把 cur.Next 改指它的后继 ${nameOf(survivor)} 就能摘掉它。动作：执行 cur.Next = cur.Next.Next，${nameOf(victim)}（值 ${val}）离开链表，累计已删除 ${removed.length} 个节点。为什么：删除的入口永远在前驱的 next 上，cur 因此从来不用被删；被摘节点自己残留的 next 已经不在链上，不影响结果。`,
          { dupeVal: val, victim, edgeFrom: cur }
        )
      }

      push(
        'cleared',
        `观察：cur.Next 现在是 ${nodeOf(nxt[cur])}，已经不等于 val = ${val}，值为 ${val} 的节点被清空了。判断：cur 没有前进，它仍然是已确认前缀 [${keptVals().join(', ')}] 的末尾。动作：${
          nxt[cur] !== NIL && nxt[nxt[cur]] !== NIL
            ? '用同一套「向前看两格」继续检查新的 cur.Next 与 cur.Next.Next'
            : '后面只剩不超过一个节点，外层循环条件不再满足，准备返回 dummy.Next'
        }。为什么：跳过整段后 cur.Next 换成了新节点，它可能同样重复；如果这里顺手写了 cur = cur.Next，就会漏删。`,
        { dupeVal: val }
      )
    } else {
      const from = cur
      cur = a
      push(
        'keep',
        `观察：cur.Next = ${nodeOf(a)}、cur.Next.Next = ${nodeOf(b)}，两值不相等。判断：由有序性，值 ${valOf(a)} 在剩余链表里只出现在这一个节点上，保留它不会留下重复。动作：cur 前进一步到 ${nameOf(a)}，已确认前缀扩成 [${keptVals().join(', ')}]。为什么：cur 永远停在「已确认唯一」的节点上，它只决定 cur.Next 的去留，自己不必被回头删除。`,
        { pair: [a, b], edgeFrom: from }
      )
    }
  }

  const tail = nxt[cur]
  const result: number[] = []
  for (let p = nxt[0]; p !== NIL; p = nxt[p]) result.push(valOf(p))

  push(
    'done',
    `观察：${
      tail === NIL
        ? 'cur.Next = nil（剩余节点已被删空），第一个循环条件不成立'
        : `cur.Next = ${nodeOf(tail)}，而 cur.Next.Next = nil，第二个循环条件不成立`
    }，外层循环退出。判断：${
      tail === NIL ? '后面已经没有剩余节点' : `后面只剩一个节点 ${nodeOf(tail)}`
    }，不可能再出现重复——真重复的话它前面早就被整段跳过了，因此无需额外处理。动作：返回 dummy.Next，结果链表是 [${result.join(', ')}]。为什么：cur 只前进不后退，每个节点最多被摘掉一次，时间 O(n)；全程只用 dummy、cur、val 三个变量，额外空间 O(1)。`
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.hintTone = 'easy'
      s.next = '循环条件不再满足：返回 dummy.Next，读出结果链表'
      return
    }
    const pairText = b.pair
      ? `cur.Next（${nameOf(b.pair[0])}，值 ${valOf(b.pair[0])}）与 cur.Next.Next（${nameOf(b.pair[1])}，值 ${valOf(b.pair[1])}）`
      : 'cur.Next 与 cur.Next.Next'
    if (b.phase === 'dupe') {
      s.hintTone = 'hard'
      s.next = `比较 ${pairText}：相等就把这个值整段删除`
    } else if (b.phase === 'delete') {
      s.hintTone = 'hard'
      s.next = `摘除 ${b.victim === null ? 'cur.Next' : nodeOf(b.victim)}：cur.Next = cur.Next.Next，cur 原地不动`
    } else if (b.phase === 'cleared') {
      s.next = '检查新的 cur.Next（cur 不前进），它可能同样重复'
    } else if (b.phase === 'keep') {
      s.next = `比较 ${pairText}：不相等就保留 cur.Next 并让 cur 前进一步`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const done = step.phase === 'done'
  const curPos = step.chain.indexOf(step.cur)
  const idNext = curPos + 1 < step.chain.length ? step.chain[curPos + 1] : null
  const idNext2 = curPos + 2 < step.chain.length ? step.chain[curPos + 2] : null

  /** 本步待整段删除的重复段中仍留在链上的部分，全部标 hard 红 */
  const runIds: number[] = []
  if (step.dupeVal !== null) {
    for (let k = curPos + 1; k < step.chain.length; k++) {
      const id = step.chain[k]
      if (id === NIL || valOf(id) !== step.dupeVal) break
      runIds.push(id)
    }
  }

  /** 不变量 dummy.Next..cur（含 cur）是已确认前缀，与 buildSteps 的 keptVals() 同口径 */
  const keptVals = step.chain.slice(1, curPos + 1).map(valOf)
  const resultVals = step.chain.filter((id) => id !== 0 && id !== NIL).map(valOf)

  const nodeState = (id: number, k: number): 'idle' | 'active' | 'teal' | 'ok' | 'dim' => {
    if (done) return id === 0 || id === NIL ? 'dim' : 'ok'
    if (runIds.includes(id)) return 'idle' // 实际样式由 className 覆盖成 hard 红
    if (id === step.cur) return 'active'
    if (id === 0 || id === NIL) return 'dim' // 哨兵与终端始终是灰底
    if (k >= 1 && k < curPos) return 'ok'
    if (id === idNext || id === idNext2) return 'teal'
    return 'dim'
  }

  /** 节点下方的文字状态，保证不靠颜色也能读懂 */
  const subOf = (id: number, k: number): string => {
    if (id === 0) return '哨兵'
    if (id === NIL) return '终端'
    if (done) return `下标 ${id - 1} · 保留`
    if (runIds.includes(id)) return `下标 ${id - 1} · 待删`
    if (id === step.cur) return `下标 ${id - 1} · cur`
    if (k < curPos) return `下标 ${id - 1} · 保留`
    if (id === idNext || id === idNext2) return `下标 ${id - 1} · 待判断`
    return `下标 ${id - 1} · 未判断`
  }

  const flagOf = (id: number): { label: string; tone: Tone } | null => {
    if (done) return null
    if (id === step.cur) return { label: 'cur', tone: 'amber' }
    if (id === idNext) return { label: 'cur.Next', tone: 'teal' }
    if (id === idNext2) return { label: 'cur.Next.Next', tone: 'teal' }
    return null
  }

  const pointerText = done
    ? `dummy.Next → [${resultVals.join(', ')}]`
    : `cur = ${nameOf(step.cur)} ｜ cur.Next = ${idNext === null ? '无' : nodeOf(idNext)} ｜ cur.Next.Next = ${
        idNext2 === null ? '无' : nodeOf(idNext2)
      }`

  const stateParts: string[] = []
  if (done) {
    stateParts.push(`保留（绿）[${resultVals.join(', ')}]`)
    stateParts.push(`已删除（红划线）${step.removed.length === 0 ? '无' : step.removed.map(valOf).join(', ')}`)
  } else {
    stateParts.push(`已确认前缀（含 cur，指针节点为琥珀）[${keptVals.join(', ')}]`)
    if (step.dupeVal !== null) stateParts.push(`本步待删（红）值 ${step.dupeVal}`)
    if (step.pair !== null) {
      stateParts.push(`本步比较 ${nameOf(step.pair[0])} 与 ${nameOf(step.pair[1])}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 节点行：指针旗标在节点上方，节点状态文字在下方 */}
      <div className="flex w-full flex-wrap items-start justify-center gap-y-2">
        {step.chain.map((id, k) => {
          const flag = flagOf(id)
          const sentinel = id === 0 || id === NIL
          const st = nodeState(id, k)
          /** 未判断 / 哨兵统一用与 TONE.muted 同值的灰底，red 段优先 */
          const cls = runIds.includes(id) ? RUN_NODE : st === 'dim' ? DIM_NODE : ''
          return (
            <div key={id} className="flex items-start">
              {k > 0 && (
                <div className="mt-6 flex h-11 items-center">
                  <Link active={step.chain[k - 1] === step.edgeFrom} />
                </div>
              )}
              <div className="flex flex-col items-center">
                <Flag label={flag?.label} tone={flag?.tone ?? 'amber'} />
                <Node state={st} className={sentinel ? `${cls} border-dashed`.trim() : cls || undefined}>
                  {id === 0 ? 'dummy' : id === NIL ? 'nil' : valOf(id)}
                </Node>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{subOf(id, k)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 颜色之外的第二重说明：指针位置与各颜色段的含义 */}
      <div className="flex w-full flex-col items-center gap-1 text-center leading-relaxed">
        <span className="w-full font-code text-[11px] break-words text-ink-soft">{pointerText}</span>
        <span className="w-full text-[11px] break-words text-ink-soft">{stateParts.join(' ｜ ')}</span>
      </div>

      {step.removed.length > 0 && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-ink-soft">已删除（重复值一个不留）：</span>
          {step.removed.map((id) => (
            <div key={id} className="flex flex-col items-center">
              <Node className={RUN_NODE}>{valOf(id)}</Node>
              <span className="mt-1 font-code text-[11px] text-ink-soft">下标 {id - 1}</span>
            </div>
          ))}
        </div>
      )}

      <Badges className="justify-center">
        <Stat label="cur" value={step.cur === 0 ? 'dummy' : `下标 ${step.cur - 1}`} tone="amber" />
        <Stat label="已删除" value={step.removed.length} tone="hard" />
        {step.phase === 'init' && <Badge>dummy.Next = head，cur 从 dummy 出发</Badge>}
        {step.phase === 'keep' && <Badge tone="easy">cur.Next 的值唯一：保留并前进一步</Badge>}
        {step.phase === 'dupe' && (
          <Badge tone="hard">
            发现重复值 <b className="font-code">{step.dupeVal}</b>：整段删除
          </Badge>
        )}
        {step.phase === 'delete' && (
          <Badge tone="hard">
            摘除 <b className="font-code">{step.victim === null ? '—' : valOf(step.victim)}</b>：cur.Next =
            cur.Next.Next
          </Badge>
        )}
        {step.phase === 'cleared' && (
          <Badge tone="easy">
            值 <b className="font-code">{step.dupeVal}</b> 已整段清空，cur 未前进
          </Badge>
        )}
        {done && <Badge tone="ink">时间 O(n) · 空间 O(1)</Badge>}
        {done ? (
          <Answer>
            结果链表 [<b className="font-code">{resultVals.join(', ')}</b>]
          </Answer>
        ) : step.next ? (
          <Hint tone={step.hintTone}>{step.next}</Hint>
        ) : null}
      </Badges>
    </div>
  )
}

export default function RemoveDuplicatesFromSortedListIIDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="dummy 哨兵 + 向前看两格，重复值整段删除"
      info={`输入：head = [${HEAD.join(', ')}]（题解示例 1，输出 [1, 2, 5]）。选这个示例是因为它同时含 3、4 两段连续重复，能完整看到「清空一整段后 cur 不前进、继续检查新的 cur.Next」；示例 2 [1, 1, 1, 2, 3] 更短，但只有一段重复，看不到这个环节。重复值一个不留，所以用 dummy 哨兵（如示例 2 会连头节点一起删掉，结果 [2, 3]）。共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'cur 指针：已确认前缀的末尾（琥珀）· 加粗边 = 本步走过 / 改接的 next' },
        { color: TONE.teal, label: 'cur.Next / cur.Next.Next 旗标：本步向前看的两格（待判断）' },
        { color: TONE.easy, label: '已确认保留的节点（结果前缀，绿）' },
        { color: TONE.hard, label: '重复段与已删除节点：整段删除，一个不留（红划线）' },
        { color: TONE.muted, label: '未判断的节点 · 哨兵 dummy 与 nil（灰底）' },
      ]}
    />
  )
}
