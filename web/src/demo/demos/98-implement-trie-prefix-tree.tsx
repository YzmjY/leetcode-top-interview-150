import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 98. 实现 Trie（前缀树）—— 模式 E：字典树（节点圆 + 字符边，逐字符下行）   */
/* ------------------------------------------------------------------ */

/** 题解唯一官方示例的操作序列：Trie() 之后的 6 次调用，参数逐一对应 */
const OPS: { op: 'insert' | 'search' | 'startsWith'; word: string }[] = [
  { op: 'insert', word: 'apple' },
  { op: 'search', word: 'apple' },
  { op: 'search', word: 'app' },
  { op: 'startsWith', word: 'app' },
  { op: 'insert', word: 'app' },
  { op: 'search', word: 'app' },
]

/** 题解示例的期望返回值（info 与 done 步据此核对） */
const EXPECTED = '[null, true, false, true, null, true]'

interface TrieNode {
  id: string
  /** 根节点为空串 */
  ch: string
  parent: string | null
  children: Record<string, string>
  isEnd: boolean
  depth: number
}

interface LogEntry {
  op: string
  result: string
}

interface Step {
  phase: 'init' | 'char' | 'mark' | 'result' | 'done'
  /** 当前操作在 OPS 中的下标；init 为 -1 */
  opIndex: number
  opName: 'insert' | 'search' | 'startsWith' | null
  opLabel: string | null
  word: string
  /** 已成功匹配的字符数 */
  matched: number
  /** 本次操作走过的节点 id（根在首位，不可变快照） */
  chain: string[]
  /** 指针当前所在节点 */
  cur: string
  /** 本步新建的节点 id；没有新建则为 null */
  created: string | null
  /** 该步已存在的节点 id（创建顺序，不可变快照） */
  existing: string[]
  /** 该步 isEnd = true 的节点 id（不可变快照） */
  ends: string[]
  nodeCount: number
  /** 'null' | 'true' | 'false'；操作尚未结束时为 null */
  result: string | null
  /** 截至该步的操作记录（不可变快照） */
  log: LogEntry[]
  /** 正在进行的操作在 log 中的下标；-1 表示没有 */
  logActive: number
  note: string
  /** 下一步动作，由后一个快照统一回填（供 Hint 使用） */
  next: string
}

/** 下一步动作：只描述「接下来做什么」，prefix「下一步：」由 Hint 硬编码 */
function hintFor(s: Step): string {
  if (s.phase === 'char') {
    const i = s.matched - 1
    const ch = s.word[i]
    return s.created !== null
      ? `执行 ${s.opLabel} 的第 ${i + 1} 个字符 '${ch}'：子节点不存在，新建节点后指针下移`
      : `执行 ${s.opLabel} 的第 ${i + 1} 个字符 '${ch}'：沿已存在的边下移指针`
  }
  if (s.phase === 'mark') {
    return `把 ${s.opLabel} 末节点的 isEnd 置为 true`
  }
  if (s.phase === 'result') {
    return s.opName === 'search'
      ? `停在 "${s.word}" 的末节点上，检查它的 isEnd`
      : `节点已走到 "${s.word}" 末尾，startsWith 不看 isEnd，直接返回 true`
  }
  return '6 次调用全部结束，核对返回值并给出结论'
}

function buildSteps(): { steps: Step[]; nodes: Record<string, TrieNode>; rootId: string } {
  const steps: Step[] = []
  const nodes: Record<string, TrieNode> = {}
  let nextId = 0

  const makeNode = (ch: string, parent: TrieNode | null): TrieNode => {
    const node: TrieNode = {
      id: `n${nextId++}`,
      ch,
      parent: parent ? parent.id : null,
      children: {},
      isEnd: false,
      depth: parent ? parent.depth + 1 : 0,
    }
    nodes[node.id] = node
    return node
  }

  const root = makeNode('', null)
  /** 已存在的节点（创建顺序），每步 .slice() 成不可变快照 */
  const existing: string[] = [root.id]
  /** isEnd = true 的节点 */
  const ends: string[] = []
  const log: LogEntry[] = []

  const snap = (
    phase: Step['phase'],
    note: string,
    extra: {
      opIndex?: number
      opName?: Step['opName']
      opLabel?: string | null
      word?: string
      matched?: number
      chain?: string[]
      cur?: string
      created?: string | null
      result?: string | null
      logActive?: number
    } = {}
  ): void => {
    steps.push({
      phase,
      opIndex: extra.opIndex ?? -1,
      opName: extra.opName ?? null,
      opLabel: extra.opLabel ?? null,
      word: extra.word ?? '',
      matched: extra.matched ?? 0,
      chain: (extra.chain ?? [root.id]).slice(),
      cur: extra.cur ?? root.id,
      created: extra.created ?? null,
      existing: existing.slice(),
      ends: ends.slice(),
      nodeCount: existing.length,
      result: extra.result ?? null,
      log: log.map((e) => ({ ...e })),
      logActive: extra.logActive ?? -1,
      note,
      next: '',
    })
  }

  snap(
    'init',
    `观察：初始只有根节点，它不表示任何字母、isEnd 恒为 false；每个节点用 ch - 'a' 得到的下标指向 26 个子节点中的一个。判断：「单词在 Trie 中」等价于从根沿字符走到底且终点 isEnd = true，「前缀存在」等价于只沿字符走到底、不看 isEnd。动作：按题解示例顺序依次执行 ${OPS.map((o) => `${o.op}("${o.word}")`).join('、')}。为什么：只有 isEnd 能区分「某个词本身被插入过」和「它只是别的词的前缀」——这就是本题的核心考点。`
  )

  /** 最后一次调用留下的路径与指针，供 done 步复用 */
  let lastChain: string[] = [root.id]
  let lastCur: string = root.id

  OPS.forEach((item, oi) => {
    const label = `${item.op}("${item.word}")`
    log.push({ op: label, result: '进行中' })
    const li = log.length - 1

    if (item.op === 'insert') {
      let node = root
      const chain = [root.id]
      let createdAny = false

      for (let i = 0; i < item.word.length; i++) {
        const ch = item.word[i]
        const prevId = node.children[ch] as string | undefined
        const isNew = prevId === undefined
        const fromLabel = node.ch === '' ? '根节点' : `节点 '${node.ch}'`
        const nxt = isNew ? makeNode(ch, node) : nodes[prevId]
        if (isNew) {
          node.children[ch] = nxt.id
          existing.push(nxt.id)
          createdAny = true
        }
        node = nxt
        chain.push(node.id)
        const idx = ch.charCodeAt(0) - 'a'.charCodeAt(0)
        const prefix = item.word.slice(0, i + 1)

        snap(
          'char',
          isNew
            ? `观察：insert("${item.word}") 处理第 ${i + 1} 个字符 '${ch}'（idx = '${ch}' - 'a' = ${idx}），${fromLabel}下还没有 '${ch}' 这个子节点。判断：前缀 "${prefix}" 是第一次出现，这条路径必须补出来。动作：新建节点 '${ch}'（琥珀填充），挂到${fromLabel}下并把指针下移到这里。为什么：从根到任意节点的路径恰好拼出一个前缀，缺失的节点补上后结构不变量才成立。`
            : `观察：insert("${item.word}") 处理第 ${i + 1} 个字符 '${ch}'（idx = '${ch}' - 'a' = ${idx}），${fromLabel}下已经有 '${ch}' 这个子节点。判断：前缀 "${prefix}" 已被之前的 insert 建好，不需要新建任何节点。动作：指针沿这条已有的字符边下移。为什么：已有节点一律复用，重复插入同一单词不会产生新节点，所以 insert 是幂等的。`,
          {
            opIndex: oi,
            opName: item.op,
            opLabel: label,
            word: item.word,
            matched: i + 1,
            chain,
            cur: node.id,
            created: isNew ? node.id : null,
            logActive: li,
          }
        )
      }

      node.isEnd = true
      ends.push(node.id)
      log[li].result = 'null'

      snap(
        'mark',
        createdAny
          ? `观察：insert("${item.word}") 的 ${item.word.length} 个字符全部走完，指针停在 '${node.ch}' 节点上。判断：isEnd 只能标在最后一个字符对应的节点上，标记之后 "${item.word}" 才真正是一个完整单词。动作：把该节点的 isEnd 置为 true，节点外出现绿色细环、节点下方标出 isEnd = true，insert 返回 null。为什么：若在途中提前标记，更短的前缀也会被 search 误判成单词。`
          : `观察：insert("${item.word}") 的 ${item.word.length} 个字符全部复用已有节点，一个节点也没有新建。判断：指针停在 "${item.word}" 对应的 '${node.ch}' 节点（深度 ${node.depth}），它此前只是 "apple" 的中间节点、isEnd 为 false。动作：把它的 isEnd 置为 true，insert 返回 null。为什么：共享前缀的中间节点加上 isEnd 就能同时表示两个单词，且与插入顺序无关。`,
        {
          opIndex: oi,
          opName: item.op,
          opLabel: label,
          word: item.word,
          matched: item.word.length,
          chain,
          cur: node.id,
          result: 'null',
          logActive: li,
        }
      )
      return
    }

    // search / startsWith：同一个 searchPrefix 过程，只是最终判据不同
    let node = root
    const chain = [root.id]

    for (let i = 0; i < item.word.length; i++) {
      const ch = item.word[i]
      const nxtId = node.children[ch] as string | undefined
      if (nxtId === undefined) {
        // 固定示例中不会发生："app"/"apple" 的路径都已由 insert("apple") 建立
        throw new Error(`示例数据异常：${label} 在节点 ${node.id} 下缺少 '${ch}' 子节点`)
      }
      const fromLabel = node.ch === '' ? '根节点' : `节点 '${node.ch}'`
      node = nodes[nxtId]
      chain.push(node.id)
      const idx = ch.charCodeAt(0) - 'a'.charCodeAt(0)

      snap(
        'char',
        `观察：${label} 处理第 ${i + 1} 个字符 '${ch}'（idx = '${ch}' - 'a' = ${idx}），指针当前在${fromLabel}上。判断：${fromLabel}下存在 '${ch}' 这个子节点，这一位对得上。动作：指针沿这条边下移到前缀 "${item.word.slice(0, i + 1)}" 对应的节点。为什么：searchPrefix 只在子节点为空时才返回 nil，能一路走到底才说明这个前缀存在。`,
        {
          opIndex: oi,
          opName: item.op,
          opLabel: label,
          word: item.word,
          matched: i + 1,
          chain,
          cur: node.id,
          logActive: li,
        }
      )
    }

    const res = item.op === 'search' ? node.isEnd : true
    log[li].result = String(res)
    lastChain = chain.slice()
    lastCur = node.id

    snap(
      'result',
      item.op === 'startsWith'
        ? `观察：startsWith("${item.word}") 的 ${item.word.length} 个字符同样全部匹配，指针停在同一个 '${node.ch}' 节点上。判断：startsWith 只要求 searchPrefix 返回非空节点，完全不看 isEnd。动作：返回 true。为什么："${item.word}" 虽然是 "apple" 的前缀而不是独立单词，但「某个已插入单词以它开头」这一条件已经成立。`
        : res
          ? `观察：search("${item.word}") 的 ${item.word.length} 个字符全部匹配，指针停在 '${node.ch}' 节点上。判断：search 要求「节点存在」与「isEnd = true」两条同时成立，而 "${item.word}" 此前已被 insert("${item.word}") 插入过，isEnd 已经是 true。动作：返回 true。为什么：路径走通只说明它是某个已插入单词的前缀，isEnd 才说明它本身也是完整单词。`
          : `观察：search("${item.word}") 的 ${item.word.length} 个字符全部匹配，指针停在 '${node.ch}' 节点（深度 ${node.depth}）上。判断：该节点的 isEnd 仍是 false——到这一步为止只 insert 过 "apple"，还没有插入过 "${item.word}"。动作：返回 false。为什么：路径存在只说明 "${item.word}" 是 "apple" 的前缀；这正是 search 与 startsWith 的唯一区别，也是本题最容易写错的地方。`,
      {
        opIndex: oi,
        opName: item.op,
        opLabel: label,
        word: item.word,
        matched: item.word.length,
        chain,
        cur: node.id,
        result: String(res),
        logActive: li,
      }
    )
  })

  const lastIndex = OPS.length - 1
  const endChs = ends.map((id) => `'${nodes[id].ch}'`).join(' 和 ')
  snap(
    'done',
    `观察：6 次调用执行完毕，Trie 共 ${existing.length} 个节点（根 + a、p、p、l、e），其中 ${ends.length} 个 isEnd = true：${endChs}（分别是 "apple" 和 "app" 的词尾）。判断：操作记录里 6 次调用的返回值依次是 ${EXPECTED}，与题解输出完全一致，关键一跃是 insert("app") 只把共享路径的中间节点标成了词尾。动作：答案 = search("app") = true，读法就是「沿字符走到 "app" 的末节点，它的 isEnd 为 true」。为什么：每次操作只沿字符走一遍，时间 O(L)（L 为单词/前缀长度）；每个节点固定 26 个指针，空间 O(总节点数 × 26)。`,
    {
      opIndex: lastIndex,
      opName: OPS[lastIndex].op,
      opLabel: `${OPS[lastIndex].op}("${OPS[lastIndex].word}")`,
      word: OPS[lastIndex].word,
      matched: OPS[lastIndex].word.length,
      chain: lastChain,
      cur: lastCur,
      result: 'true',
      logActive: -1,
    }
  )

  // 「下一步动作」由后一个快照统一回填，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (b) s.next = hintFor(b)
  })

  return { steps, nodes, rootId: root.id }
}

/* ---------------- 舞台渲染（模式 E：SVG 节点圆 + 字符边） ---------------- */

const NODE_R = 22
const GAP_X = 78
const PAD_L = 48
const PAD_R = 48
const TOP = 64
const LEAF_GAP = 66
const PAD_B = 74

const BUILT = buildSteps()
const STEPS = BUILT.steps
const NODES = BUILT.nodes

/** 手写坐标：x 按深度展开（根在最左），y 由子树叶子顺序分配（同一个 step 渲染结果一致） */
function layoutTrie() {
  const pos: Record<string, { x: number; y: number }> = {}
  let leaves = 0
  let maxDepth = 0

  const walk = (id: string): number => {
    const node = NODES[id]
    maxDepth = Math.max(maxDepth, node.depth)
    const keys = Object.keys(node.children).sort()
    let y: number
    if (keys.length === 0) {
      y = TOP + leaves * LEAF_GAP
      leaves += 1
    } else {
      const ys = keys.map((k) => walk(node.children[k]))
      y = ys.reduce((a, b) => a + b, 0) / ys.length
    }
    pos[id] = { x: PAD_L + node.depth * GAP_X, y }
    return y
  }
  walk(BUILT.rootId)

  return {
    pos,
    width: PAD_L + maxDepth * GAP_X + PAD_R,
    height: TOP + Math.max(leaves - 1, 0) * LEAF_GAP + PAD_B,
  }
}

const LAYOUT = layoutTrie()

/** 节点下方的小字：本步正在判定时直接写出判据，否则标出词尾 */
function belowLabel(id: string, step: Step, hasEnd: boolean): { text: string; color: string } | null {
  if (id === step.cur && (step.phase === 'mark' || step.phase === 'result')) {
    if (step.phase === 'result' && step.opName === 'startsWith') {
      return { text: '前缀存在', color: TONE.teal }
    }
    return { text: `isEnd = ${hasEnd}`, color: hasEnd ? TONE.easy : TONE.hard }
  }
  if (hasEnd) return { text: '词尾', color: TONE.easy }
  return null
}

function Stage(step: Step) {
  const chainSet = new Set(step.chain)
  const endSet = new Set(step.ends)
  const done = step.phase === 'done'
  const activeIdx = step.phase === 'char' ? step.matched - 1 : -1

  const cellState = (i: number): CellState =>
    i === activeIdx ? 'active' : i < step.matched ? 'ok' : 'dim'

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`} className="w-full select-none">
        {/* 1. 字符边：先画线，后画的节点圆会盖住端点 */}
        {step.existing.map((id) => {
          const parent = NODES[id].parent
          if (parent === null) return null
          const a = LAYOUT.pos[parent]
          const b = LAYOUT.pos[id]
          const onPath = chainSet.has(parent) && chainSet.has(id)
          const toCur = id === step.cur
          const color = toCur ? TONE.amber : onPath ? TONE.teal : 'hsl(var(--border))'
          return (
            <g key={`edge-${id}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={toCur ? 3 : onPath ? 2.5 : 2}
              />
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 9}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                className="font-code"
                fill={toCur ? TONE.amber : onPath ? TONE.teal : 'hsl(var(--ink-soft))'}
              >
                {NODES[id].ch}
              </text>
            </g>
          )
        })}

        {/* 2. 节点圆：isEnd 用外圈绿环，当前指针所在节点用琥珀描边 + 「当前」标注 */}
        {step.existing.map((id) => {
          const node = NODES[id]
          const p = LAYOUT.pos[id]
          const isCur = id === step.cur
          const onPath = chainSet.has(id)
          const hasEnd = endSet.has(id)
          const fill = isCur
            ? 'hsl(var(--amber-soft))'
            : onPath
              ? 'hsl(var(--teal-soft))'
              : 'hsl(var(--ink) / 0.18)'
          const stroke = isCur ? TONE.amber : onPath ? TONE.teal : 'hsl(var(--border))'
          const textFill = isCur ? TONE.amber : onPath ? TONE.teal : TONE.ink
          const below = belowLabel(id, step, hasEnd)
          return (
            <g key={`node-${id}`} className="demo-water">
              {hasEnd && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 5} fill="none" stroke={TONE.easy} strokeWidth={2.5} />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCur ? 3 : 2.5}
              />
              <text
                x={p.x}
                y={p.y + 6}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                className="font-code"
                fill={textFill}
              >
                {node.ch === '' ? '根' : node.ch}
              </text>
              {isCur && (
                <text
                  x={p.x}
                  y={p.y - NODE_R - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.amber}
                >
                  当前
                </text>
              )}
              {below && (
                <text
                  x={p.x}
                  y={p.y + NODE_R + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={below.color}
                >
                  {below.text}
                </text>
              )}
            </g>
          )
        })}

        {/* 3. 说明：只有已经创建出来的节点才画在舞台上 */}
        <text
          x={LAYOUT.width / 2}
          y={LAYOUT.height - 12}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          尚未创建的节点不画在舞台上；节点外的绿色细环表示 isEnd = true
        </text>
      </svg>

      {/* 当前操作的单词：逐字符状态 + 当前字符旗标 */}
      <div className="flex w-full flex-col items-center gap-1">
        <span className="text-[11px] text-ink-soft">
          {step.opIndex < 0 ? '尚未执行调用：' : `第 ${step.opIndex + 1}/${OPS.length} 次调用 `}
          <b className="font-code text-ink">{step.opLabel ?? '等待 insert("apple")'}</b>
          {step.result !== null && (
            <>
              {' '}
              返回{' '}
              <b
                className="font-code"
                style={{ color: step.result === 'true' ? TONE.easy : step.result === 'false' ? TONE.hard : TONE.ink }}
              >
                {step.result}
              </b>
            </>
          )}
        </span>
        {step.word !== '' && (
          <div
            className="grid w-full gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${step.word.length}, minmax(0, 1fr))`,
              maxWidth: `${step.word.length * 3.4}rem`,
            }}
          >
            {Array.from(step.word, (_, i) => (
              <div key={`flag-${i}`} className="flex h-6 items-end justify-center">
                {i === activeIdx && <Flag label={`i=${i}`} tone="amber" />}
              </div>
            ))}
            {Array.from(step.word, (ch, i) => (
              <Cell key={`char-${i}`} state={cellState(i)} size="sm" className="w-full min-w-0 sm:min-w-0">
                {ch}
              </Cell>
            ))}
          </div>
        )}
      </div>

      {/* 操作记录：越靠后越新的调用，进行中的一条用琥珀标出 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
        {step.log.length === 0 ? (
          <span className="font-code text-[10px] text-ink-soft">（还没有执行任何操作）</span>
        ) : (
          step.log.map((entry, k) => {
            const active = k === step.logActive
            const hit = entry.result === 'true'
            return (
              <span
                key={entry.op}
                className="rounded-md border px-1.5 py-0.5 font-code text-[10px]"
                style={{
                  borderColor: active ? 'hsl(var(--amber))' : 'hsl(var(--border))',
                  backgroundColor: active ? 'hsl(var(--amber-soft))' : 'hsl(var(--card))',
                  color: active ? TONE.amber : hit ? TONE.easy : 'hsl(var(--ink-soft))',
                }}
              >
                {entry.op} → {entry.result}
              </span>
            )
          })
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前操作" value={step.opLabel ?? '—'} tone="amber" />
        <Stat
          label="已匹配字符"
          value={step.word === '' ? '—' : `${step.matched}/${step.word.length}`}
          tone="teal"
        />
        <Stat label="节点数（含根）" value={step.nodeCount} tone={done ? 'easy' : 'ink'} />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">{step.opLabel} = true</b>；6 次调用返回{' '}
            <b className="font-code">{EXPECTED}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ImplementTriePrefixTreeDemo() {
  const steps = useMemo(() => STEPS, [])
  return (
    <DemoShell
      title="前缀树逐字符下行：节点圆 + 字符边 + isEnd"
      info={`输入取自题解的唯一示例：Trie() 之后依次 insert("apple")、search("apple")、search("app")、startsWith("app")、insert("app")、search("app")，期望输出 ${EXPECTED}。演示按字符逐层展开这 6 次调用，共 ${STEPS.length} 步；示例规模已是最小且有代表性的一组（apple 与 app 恰好覆盖「共享前缀」和「isEnd 区分单词与前缀」两个关键点），因此没有替换成更小的输入。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前指针所在节点（本步新建时用琥珀填充）' },
        { color: TONE.teal, label: '本次操作已走过的路径与字符边' },
        { color: TONE.easy, label: 'isEnd = true：绿色细环 + 「isEnd / 词尾」标注' },
        { color: TONE.hard, label: 'search 返回 false：路径存在但终点 isEnd = false' },
        { color: TONE.muted, label: '已存在但不在当前路径上的节点' },
      ]}
    />
  )
}
