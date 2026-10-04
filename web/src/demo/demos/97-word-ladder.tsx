import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 97. 单词接龙 —— 模式 F：图 + 逐层 BFS                                  */
/* 同层单词画成一排，每条边标明「差一个字符」；当前层 amber、已访问 teal、  */
/* 命中 endWord 用 easy 绿加光晕并给结论。坐标全部手写，不做力导向布局。    */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」，答案 5） */
const BEGIN = 'hit'
const END = 'cog'
const WORD_LIST = ['hot', 'dot', 'dog', 'lot', 'log', 'cog']
const WORD_SET = new Set(WORD_LIST)
const WORDS = [BEGIN, ...WORD_LIST]
const L = BEGIN.length

/** 题解示例 1 给出的最短转换序列（5 个单词、4 条边） */
const SHORTEST_PATH = ['hit', 'hot', 'dot', 'dog', 'cog']

/** 字典图里的全部边：两个词只差一个字母就连一条无向边 */
const DICT_EDGES: [string, string][] = [
  ['hit', 'hot'],
  ['hot', 'dot'],
  ['hot', 'lot'],
  ['dot', 'dog'],
  ['lot', 'log'],
  ['dog', 'cog'],
  ['log', 'cog'],
  ['dot', 'lot'],
  ['dog', 'log'],
]

const EDGES = DICT_EDGES.map(([from, to]) => ({ key: `${from}>${to}`, from, to }))

/** 最终最短路径上的搜索树边（done 与命中步用绿色标出） */
const PATH_KEYS = ['hit>hot', 'hot>dot', 'dot>dog', 'dog>cog']

/** 逐个位置枚举 a~z（跳过原字母），返回落在 wordList 里的候选词，顺序与题解代码一致 */
function dictNeighbors(word: string): string[] {
  const out: string[] = []
  for (let i = 0; i < L; i++) {
    const original = word[i]
    for (let c = 97; c <= 122; c++) {
      const ch = String.fromCharCode(c)
      if (ch === original) continue
      const next = word.slice(0, i) + ch + word.slice(i + 1)
      if (WORD_SET.has(next)) out.push(next)
    }
  }
  return out
}

/** 两个只差一个字母的词的差异位置（0 基）与字母 */
function diffOf(a: string, b: string) {
  for (let i = 0; i < L; i++) {
    if (a[i] !== b[i]) return { pos: i, fromCh: a[i], toCh: b[i] }
  }
  return { pos: -1, fromCh: '', toCh: '' }
}

interface Step {
  phase: 'init' | 'expand' | 'hit' | 'done'
  /** 已访问的词（按首次访问顺序，含当前层） */
  visited: string[]
  /** 每个已访问词的单词数 d（beginWord 记为 1） */
  dist: Record<string, number>
  /** 本步正在扩展的那一层（队列内容） */
  frontier: string[]
  /** 本步出队扩展的词 */
  current: string | null
  /** BFS 首次到达时定下的搜索树边，形如 "hit>hot" */
  tree: string[]
  /** 本步刚发现的那条树边 */
  active: { from: string; to: string } | null
  /** 命中 endWord 的词 */
  hit: string | null
  /** 答案（最短转换序列的单词数） */
  answer: number | null
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  hint: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const dist: Record<string, number> = { [BEGIN]: 1 }
  const queue: string[] = [BEGIN]
  const tree: string[] = []

  const snap = (
    phase: Step['phase'],
    note: string,
    current: string | null,
    frontier: string[],
    active: { from: string; to: string } | null,
    hit: string | null,
    answer: number | null
  ) => {
    steps.push({
      phase,
      note,
      current,
      frontier: frontier.slice(),
      visited: Object.keys(dist),
      dist: { ...dist },
      tree: tree.slice(),
      active,
      hit,
      answer,
      hint: '',
    })
  }

  snap(
    'init',
    `观察：beginWord = "${BEGIN}"，endWord = "${END}"，wordList 共 ${WORD_LIST.length} 个词，且 endWord 在字典里（不在就直接返回 0）。判断：把每个词看作节点、只差一个字母就连一条边，题目就变成求 ${BEGIN} 到 ${END} 的最短路径上的单词数，起点记 d = 1。动作：${BEGIN} 入队并标记已访问，队列 = [${BEGIN}]。为什么：BFS 按层推进，某个词第一次被访问时的层数就是它到 ${BEGIN} 的最少单词数。`,
    null,
    [BEGIN],
    null,
    null,
    null
  )

  let answer: number | null = null
  let hitWord: string | null = null
  let qi = 0

  while (qi < queue.length) {
    const layerEnd = queue.length
    const layer = queue.slice(qi, layerEnd)

    for (let k = qi; k < layerEnd; k++) {
      const word = queue[k]
      const d = dist[word]

      // 出队时判断是否命中 endWord
      if (word === END) {
        answer = d
        hitWord = word
        snap(
          'hit',
          `观察：出队 ${word}（d = ${d}），它就是 endWord。判断：${d} 是 ${word} 第一次被访问时的层数，也就是最短转换序列的单词数。动作：返回 ${d}，不再扩展它的邻居。为什么：任何更短的序列都会在更小的层数上先被 BFS 发现，所以 ${d} 已经是最小值。`,
          word,
          [word],
          null,
          word,
          d
        )
        break
      }

      const cands = dictNeighbors(word)
      const fresh = cands.filter((n) => dist[n] === undefined)
      const seen = cands.filter((n) => dist[n] !== undefined)

      if (fresh.length === 0) {
        snap(
          'expand',
          `观察：出队 ${word}（d = ${d}），枚举 26×${L} 种候选后，${
            cands.length === 0 ? '字典里没有它的邻居' : `命中的 ${cands.join('、')} 都已访问过`
          }。判断：从 ${word} 出发不会再产生新词，它不会把搜索扩到下一层。动作：不入队任何词，继续处理本层剩下的词。为什么：visited 去重让每个词最多出队一次，重复到达的边直接跳过、不会绕圈。`,
          word,
          layer,
          null,
          null,
          null
        )
        continue
      }

      for (let j = 0; j < fresh.length; j++) {
        const next = fresh[j]
        const { pos, fromCh, toCh } = diffOf(word, next)
        dist[next] = d + 1
        tree.push(`${word}>${next}`)
        queue.push(next)
        const rest = fresh.slice(j + 1)
        snap(
          'expand',
          `观察：出队 ${word}（d = ${d}），逐个位置枚举 a~z（26×${L} = ${26 * L} 种写法，跳过原字母），命中的新词是 ${next}，它与 ${word} 只差第 ${pos + 1} 位的 ${fromCh}→${toCh}。判断：${next} 还没被访问过，d = ${d + 1}${rest.length > 0 ? `，同一次枚举里还有新词 ${rest.join('、')} 待处理` : ''}。动作：${
            seen.length > 0 ? `先跳过已访问的 ${seen.join('、')}，` : ''
          }把 ${next} 入队并记下搜索树边 ${word}→${next}。为什么：无权图里第一次到达就是最短距离，之后再到达不会更优。`,
          word,
          layer,
          { from: word, to: next },
          null,
          null
        )
      }
    }

    if (hitWord !== null) break
    qi = layerEnd
  }

  snap(
    'done',
    `观察：最短序列是 ${SHORTEST_PATH.join(' → ')}，共 ${SHORTEST_PATH.length} 个单词、${SHORTEST_PATH.length - 1} 条边，每条边都只差一个字母且中间词都在字典里。判断：题目要的是单词数而不是边数，所以答案是 ${answer}。动作：输出 ${answer}。为什么：每个词最多出队一次、出队时枚举 26×L 个候选，时间 O(N×L×26)；字典与 visited 占 O(N×L) 空间。`,
    null,
    [],
    null,
    hitWord,
    answer
  )

  // 「下一步动作」一律由后一个快照推导，保证 Hint 描述的是真正的下一步
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.hint = `给出结论：最短转换序列的单词数 = ${b.answer}`
    } else if (b.phase === 'hit') {
      s.hint = `出队 ${b.current}，判断它是否等于 endWord`
    } else if (b.active) {
      const { pos, fromCh, toCh } = diffOf(b.active.from, b.active.to)
      s.hint =
        b.current === s.current
          ? `继续检查 ${b.current} 的候选词，处理 ${b.active.to}（第 ${pos + 1} 位 ${fromCh}→${toCh}）`
          : `出队 ${b.current}，枚举候选词得到 ${b.active.to}（第 ${pos + 1} 位 ${fromCh}→${toCh}）`
    } else {
      s.hint = `出队 ${b.current}，枚举它的候选词，已访问的直接跳过`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 640
const H = 472
const NODE_R = 24

/** 手写坐标表（输入固定，禁止力导向布局）：y 为层高（单词数），同层一排 */
const POS: Record<string, { x: number; y: number }> = {
  hit: { x: 320, y: 56 },
  hot: { x: 320, y: 144 },
  dot: { x: 186, y: 232 },
  lot: { x: 454, y: 232 },
  dog: { x: 186, y: 320 },
  log: { x: 454, y: 320 },
  cog: { x: 320, y: 408 },
}

/** 层标签：d = 从 beginWord 起算的单词数 */
const LAYERS = [
  { d: 1, y: 56 },
  { d: 2, y: 144 },
  { d: 3, y: 232 },
  { d: 4, y: 320 },
  { d: 5, y: 408 },
]

/** 边差异标签坐标：手写，放在线段外侧，避开节点圆与状态文字 */
const EDGE_LABEL: Record<string, { x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = {
  'hit>hot': { x: 352, y: 102, anchor: 'start' },
  'hot>dot': { x: 240, y: 180, anchor: 'end' },
  'hot>lot': { x: 400, y: 180, anchor: 'start' },
  'dot>dog': { x: 214, y: 278, anchor: 'start' },
  'lot>log': { x: 426, y: 278, anchor: 'end' },
  'dog>cog': { x: 240, y: 366, anchor: 'end' },
  'log>cog': { x: 400, y: 366, anchor: 'start' },
  'dot>lot': { x: 320, y: 224, anchor: 'middle' },
  'dog>log': { x: 320, y: 312, anchor: 'middle' },
}

type NodeState = 'unvisited' | 'visited' | 'frontier' | 'current' | 'hit'

const NODE_SKIN: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  unvisited: { fill: 'hsl(var(--card))', stroke: 'hsl(var(--ink) / 0.35)', text: 'hsl(var(--ink-soft))' },
  visited: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  frontier: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  current: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  hit: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
}

/** 状态文字：不靠颜色也能读出这个词处于哪一步 */
const STATE_LABEL: Record<NodeState, string> = {
  unvisited: '未访问',
  visited: '已访问',
  frontier: '当前层',
  current: '扩展中',
  hit: '命中终点',
}

function Stage(step: Step) {
  const curD = step.current === null ? null : step.dist[step.current]
  const conclude = step.phase === 'hit' || step.phase === 'done'

  const stateOf = (w: string): NodeState => {
    if (step.hit === w) return 'hit'
    if (step.current === w) return 'current'
    if (step.frontier.includes(w)) return 'frontier'
    if (step.visited.includes(w)) return 'visited'
    return 'unvisited'
  }

  /** 边两端各留出节点半径，箭头才不会被圆盖住 */
  const stick = (from: string, to: string) => {
    const p = POS[from]
    const q = POS[to]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const off = NODE_R + 6
    return {
      x1: p.x + (dx / len) * off,
      y1: p.y + (dy / len) * off,
      x2: q.x - (dx / len) * off,
      y2: q.y - (dy / len) * off,
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          {[
            { id: 'wl-arrow-teal', color: TONE.teal },
            { id: 'wl-arrow-amber', color: TONE.amber },
            { id: 'wl-arrow-easy', color: TONE.easy },
          ].map((m) => (
            <marker
              key={m.id}
              id={m.id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,1 L10,5 L0,9 z" fill={m.color} />
            </marker>
          ))}
        </defs>

        {/* 0. 层说明与层标签 */}
        <text x={16} y={20} fontSize="11" fill="hsl(var(--ink-soft))">
          行 = 层，d = 到 beginWord 的单词数
        </text>
        {LAYERS.map((l) => (
          <text
            key={`layer-${l.d}`}
            x={16}
            y={l.y + 4}
            fontSize="12"
            fontWeight="600"
            className="font-code"
            fill="hsl(var(--ink-soft))"
          >
            d = {l.d}
          </text>
        ))}

        {/* 1. 边：带箭头 = BFS 首次到达定下的搜索树边（琥珀 = 本步新发现，绿 = 最短序列），
              灰线 = 字典里同样只差一个字母但还没用到的无向边 */}
        {EDGES.map((e) => {
          const inTree = step.tree.includes(e.key)
          const isActive = step.active !== null && step.active.from === e.from && step.active.to === e.to
          const directed = inTree || isActive
          const stroke = isActive
            ? TONE.amber
            : inTree
              ? conclude && PATH_KEYS.includes(e.key)
                ? TONE.easy
                : TONE.teal
              : 'hsl(var(--ink) / 0.35)'
          const marker = isActive
            ? 'url(#wl-arrow-amber)'
            : inTree
              ? conclude && PATH_KEYS.includes(e.key)
                ? 'url(#wl-arrow-easy)'
                : 'url(#wl-arrow-teal)'
              : undefined
          const { x1, y1, x2, y2 } = stick(e.from, e.to)
          return (
            <line
              key={`edge-${e.key}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={isActive ? 3.5 : directed ? 2.5 : 2}
              markerEnd={marker}
            />
          )
        })}

        {/* 2. 边标签：每条边都写明「差一个字符」的位置与字母 */}
        {EDGES.map((e) => {
          const diff = diffOf(e.from, e.to)
          const inTree = step.tree.includes(e.key)
          const isActive = step.active !== null && step.active.from === e.from && step.active.to === e.to
          const directed = inTree || isActive
          const at = EDGE_LABEL[e.key]
          const fill = isActive
            ? TONE.amber
            : inTree
              ? conclude && PATH_KEYS.includes(e.key)
                ? TONE.easy
                : TONE.teal
              : 'hsl(var(--ink-soft))'
          return (
            <text
              key={`label-${e.key}`}
              x={at.x}
              y={at.y}
              textAnchor={at.anchor}
              fontSize={directed ? 11 : 10}
              fontWeight="600"
              className="font-code"
              fill={fill}
            >
              {directed
                ? `${diff.pos + 1}:${diff.fromCh}→${diff.toCh}`
                : `第${diff.pos + 1}位不同`}
            </text>
          )
        })}

        {/* 3. 词节点：圆内是单词，上方是访问状态；命中 endWord 时加绿色光晕 */}
        {WORDS.map((w) => {
          const p = POS[w]
          const st = stateOf(w)
          const skin = NODE_SKIN[st]
          return (
            <g key={`node-${w}`}>
              {st === 'hit' && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={NODE_R + 11}
                    fill="none"
                    stroke={TONE.easy}
                    strokeWidth="2"
                    opacity="0.28"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={NODE_R + 6}
                    fill="none"
                    stroke={TONE.easy}
                    strokeWidth="3"
                    opacity="0.55"
                  />
                </>
              )}
              {st === 'current' && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 6} fill="none" stroke={TONE.amber} strokeWidth="3" />
              )}
              <circle cx={p.x} cy={p.y} r={NODE_R} fill={skin.fill} stroke={skin.stroke} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {w}
              </text>
              <text
                x={p.x}
                y={p.y - NODE_R - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={skin.text}
              >
                {STATE_LABEL[st]}
              </text>
            </g>
          )
        })}

        {/* 4. 命中后给出最短转换序列 */}
        {conclude && (
          <text
            x={W / 2}
            y={460}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            className="font-code"
            fill={TONE.easy}
          >
            {`最短序列：${SHORTEST_PATH.join(' → ')}（${SHORTEST_PATH.length} 个单词）`}
          </text>
        )}
      </svg>

      <Badges>
        <Stat label="出队单词" value={step.current ?? '—'} tone="amber" />
        <Stat label="当前单词数 d" value={curD ?? '—'} tone="medium" />
        <Stat label="已访问" value={`${step.visited.length} / ${WORDS.length}`} tone="teal" />
        {step.phase !== 'done' ? (
          <Hint>{step.hint}</Hint>
        ) : (
          <Answer>
            长度 = <b className="font-code">{step.answer}</b>（{SHORTEST_PATH.join(' → ')}，
            <b className="font-code">{SHORTEST_PATH.length}</b> 个单词 /{' '}
            <b className="font-code">{SHORTEST_PATH.length - 1}</b> 条边）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function WordLadderDemo() {
  const steps = useMemo(buildSteps, [])
  const answer = steps[steps.length - 1].answer
  return (
    <DemoShell
      title="逐层 BFS：同层一排，边只差一个字符"
      info={`输入取题解「示例 1」：beginWord = "${BEGIN}"，endWord = "${END}"，wordList = ${JSON.stringify(WORD_LIST)}，答案 ${answer}（题解给出的最短序列 ${SHORTEST_PATH.join(' → ')}）。演示题解「基础 BFS（朴素建图）」的单向逐层扩展，共 ${steps.length} 步（1 个初始步 + ${steps.length - 2} 个出队扩展步 + 1 个结论步）；带箭头的线是 BFS 首次到达时定下的搜索树边，灰线是字典里同样只差一个字母、但还没有用到的边，每个词上方的文字是它的访问状态。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前层（本步正在扩展的词带加粗圆环）' },
        { color: TONE.teal, label: '已访问的词 / 已走过的搜索树边' },
        { color: TONE.easy, label: '命中 endWord 的词与最短序列' },
        { color: 'hsl(var(--ink) / 0.35)', label: '未访问的词与还没用到的字典边' },
      ]}
    />
  )
}
