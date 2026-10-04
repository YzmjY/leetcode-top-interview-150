import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 99. 添加与搜索单词 - 数据结构设计 —— 模式 E：字典树 + 通配符 DFS 分支枚举 */
/* ------------------------------------------------------------------ */

/** 题解官方示例的完整操作序列与期望输出（照抄题解，不增删） */
const WORDS = ['bad', 'dad', 'mad']
const QUERIES = ['pad', 'bad', '.ad', 'b..']
const EXPECTED = [false, true, true, true]
const OP_LABEL = [
  ...WORDS.map((w) => `addWord("${w}")`),
  ...QUERIES.map((w) => `search("${w}")`),
]
const EXP_TEXT = `[${WORDS.map(() => 'null').join(', ')}, ${EXPECTED.join(', ')}]`

interface TNode {
  id: number
  ch: string
  parent: number | null
  isEnd: boolean
}

interface TrieSnap {
  nodes: Record<number, TNode>
  /** children[id][letter] = 子节点 id（按字母序插入） */
  links: Record<number, Record<string, number>>
  order: number[]
  rootId: number
}

interface LogEntry {
  label: string
  result: string
  done: boolean
}

interface Step {
  phase: 'init' | 'add' | 'search' | 'done'
  /** 当前操作在 OP_LABEL 中的下标；init / done 为 -1 */
  opIndex: number
  /** 操作日志快照 */
  log: LogEntry[]
  trie: TrieSnap
  word: string
  /** 已匹配 / 已插入的字符个数 */
  matched: number
  /** 本步正在比较的字符下标 */
  index: number
  /** 该下标处是通配符 '.' */
  isWild: boolean
  /** '.' 枚举到的非空子节点字母，按字母序 */
  candidates: string[]
  current: number | null
  path: number[]
  matchedNodes: number[]
  failedNodes: number[]
  newNodes: number[]
  endNodes: number[]
  failed: boolean
  result: boolean | null
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  let nextId = 0
  const nodes: Record<number, TNode> = {}
  const links: Record<number, Record<string, number>> = {}
  const order: number[] = []

  const makeNode = (ch: string, parent: number | null): number => {
    const id = nextId++
    nodes[id] = { id, ch, parent, isEnd: false }
    links[id] = {}
    order.push(id)
    return id
  }

  const rootId = makeNode('', null)

  const snapshot = (): TrieSnap => ({
    nodes: { ...nodes },
    links: Object.fromEntries(Object.entries(links).map(([k, v]) => [k, { ...v }])),
    order: order.slice(),
    rootId,
  })

  const steps: Step[] = []
  const log: { label: string; result: string; done: boolean }[] = []
  let newNodes: number[] = []
  let endNodes: number[] = []
  let index = -1
  let matched = 0
  let isWild = false
  let candidates: string[] = []
  let current: number | null = rootId
  let path: number[] = [rootId]
  let matchedNodes: number[] = []
  let failedNodes: number[] = []
  let failed = false
  let result: boolean | null = null

  const push = (phase: Step['phase'], opIndex: number, word: string, note: string) => {
    steps.push({
      phase,
      opIndex,
      log: log.map((l) => ({ ...l })),
      trie: snapshot(),
      word,
      matched,
      index,
      isWild,
      candidates: candidates.slice(),
      current,
      path: path.slice(),
      matchedNodes: matchedNodes.slice(),
      failedNodes: failedNodes.slice(),
      newNodes: newNodes.slice(),
      endNodes: endNodes.slice(),
      failed,
      result,
      note,
      next: '',
    })
  }

  push(
    'init',
    -1,
    '',
    `观察：WordDictionary 就是一棵字典树，本演示按官方序列依次插入 ${WORDS.map((w) => `"${w}"`).join('、')} 三个词。判断：addWord 与普通 Trie 完全一致，难点在 search —— "." 可以是任意字母，遇到它无法确定唯一后继。动作：从空的根节点开始，按 ${OP_LABEL.join(' → ')} 逐步执行。为什么：三个词共享前缀 'a'、'd'，只用到 10 个节点；而 "." 必须枚举当前节点的全部非空子节点才能穷举候选。`
  )

  /* ---------------- addWord ---------------- */
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i]
    const opIndex = i
    log.push({ label: OP_LABEL[opIndex], result: '进行中', done: false })
    const li = log.length - 1

    let node = rootId
    current = rootId
    path = [rootId]
    matchedNodes = [rootId]
    failedNodes = []
    failed = false
    result = null
    isWild = false
    candidates = []
    index = -1
    matched = 0

    for (let k = 0; k < w.length; k++) {
      const ch = w[k]
      let nxt = links[node][ch]
      const created = nxt === undefined
      if (created) {
        nxt = makeNode(ch, node)
        links[node][ch] = nxt
        newNodes = [...newNodes, nxt]
      }
      node = nxt
      path = [...path, nxt]
      matchedNodes = [...matchedNodes, nxt]
      current = nxt
      index = k
      matched = k + 1
      if (k < w.length - 1) {
        push(
          'add',
          opIndex,
          w,
          created
            ? `观察：前缀 "${w.slice(0, k)}" 已经在树里，但这一层没有字母 '${ch}' 的子节点。判断："${w}" 是第一次走到这里，必须新建节点才能放下第 ${k + 1} 个字符。动作：新建 '${ch}' 节点并挂到当前节点下，指针下移，已插入前缀变成 "${w.slice(0, k + 1)}"。为什么：新增节点只挂在访问到的那个父节点上，共享前缀的复用要等后面插入 "dad"、"mad" 时才会体现（三个词总共只用 10 个节点）。`
            : `观察：当前节点已经有字母 '${ch}' 的子节点，来自更早插入的单词。判断：这段前缀别的词已经建好，不需要重复创建。动作：直接复用该子节点并下移指针，已插入前缀变成 "${w.slice(0, k + 1)}"。为什么：复用而不是新建，正是 addWord 只需 O(L)、字典树能省空间的原因。`
        )
      }
    }

    nodes[node].isEnd = true
    if (!endNodes.includes(node)) endNodes = [...endNodes, node]
    log[li] = { ...log[li], result: 'null', done: true }
    result = null
    push(
      'add',
      opIndex,
      w,
      `观察：${w.length} 个字符都已挂好，"${w}" 的末节点是第 ${w.length} 层的 '${w[w.length - 1]}' 节点（本步刚把它接上）。判断：只有末节点被标记为单词结尾，根到它的这条路径才算一个完整单词。动作：把它置为 isEnd = true，节点外因此多出一圈绿色虚线环；addWord 无返回值，操作日志里记 null。为什么：只建链不标记的话，长度更短的 "ba" 这种前缀也会被误判成已添加的词。`
    )
  }

  /* ---------------- search ---------------- */
  /** 返回 true 表示本次 search 命中并提前结束 */
  const dfs = (node: number, w: string, k: number, opIndex: number): boolean => {
    if (k === w.length) {
      const ok = nodes[node].isEnd
      matched = k
      current = node
      if (ok) {
        matchedNodes = path.slice()
        result = true
        log[opIndex] = { ...log[opIndex], result: 'true', done: true }
        push(
          'search',
          opIndex,
          w,
          `观察：模式的 ${w.length} 个字符已经全部匹配完，指针停在节点 '${nodes[node].ch}' 上。判断：这个节点带 isEnd 标记，说明 "${w}" 确实被 addWord 添加过。动作：整个 search 立即返回 true，绿色路径上的节点保留为命中状态。为什么：终止条件必须是「下标走完且落点 isEnd」；只检查下标的话，节点 'a' 这种中间节点也会被当成词。`
        )
        return true
      }
      failed = true
      failedNodes = failedNodes.includes(node) ? failedNodes : [...failedNodes, node]
      result = false
      log[opIndex] = { ...log[opIndex], result: 'false', done: true }
      push(
        'search',
        opIndex,
        w,
        `观察：模式的 ${w.length} 个字符也被这条路径走完了，指针同样停在节点 '${nodes[node].ch}' 上。判断：该节点没有 isEnd 标记，路径存在但不能构成单词 "${w}"。动作：本分支返回 false，回溯到上一层继续尝试其它候选分支。为什么：若在这里返回 true，长度不相等的模式就会被误判为匹配，所以 index 走完时返回的必须是 isEnd。`
      )
      return false
    }

    const ch = w[k]
    if (ch === '.') {
      const avail = Object.keys(links[node]).sort()
      isWild = true
      candidates = avail
      matched = k
      index = k
      push(
        'search',
        opIndex,
        w,
        avail.length === 0
          ? `观察：第 ${k + 1} 个字符是 "."，它本可以匹配任意字母，但指针所在的 '${nodes[node].ch}' 节点没有任何子节点。判断：通配符也无处可去，这条分支必然失败。动作：候选列表为空，直接返回 false 并回溯到上一层。为什么：字典树只创建真正用到的子节点，没有子节点就等于不存在以该前缀开头的词。`
          : `观察：第 ${k + 1} 个字符是 "."，它可以是任意字母，指针停在节点 '${nodes[node].ch}' 上。判断：当前节点的非空子节点有 ${avail.join('、')} 这些（按字母序枚举），每个字母都是一条候选分支。动作：按字母序依次尝试 ${avail.map((c) => `'${c}'`).join('、')}，任意一条返回 true 整体就返回 true。为什么：只有把候选全部试完才能断定无解，这正是通配符必须 DFS 枚举、不能只试第一条分支的原因。`
      )
      if (avail.length === 0) return false

      for (const c of avail) {
        const child = links[node][c]
        current = child
        path = [...path, child]
        matched = k + 1
        isWild = true
        candidates = avail
        push(
          'search',
          opIndex,
          w,
          `观察："." 先假设它匹配字母 '${c}'，进入子节点 '${c}' 的子树（本步在试的就是这条分支，指针先停在父节点 '${nodes[node].ch}' 上）。判断：若这次假设成立，剩下的后缀 "${w.slice(k + 1)}" 只需在 '${c}' 的子树里继续匹配。动作：把下标推到第 ${k + 1} 位递归进 '${c}' 分支，${avail.filter((x) => x !== c).length ? `其余候选 ${avail.filter((x) => x !== c).map((x) => `'${x}'`).join('、')} 先留着待试` : '它是当前节点唯一的候选，没有再可回退的兄弟分支'}。为什么：DFS 深度优先，一条分支失败就回溯到当前节点换下一个候选；命中即返回 true，后面的候选就不用再试了。`
        )
        if (dfs(child, w, k + 1, opIndex)) return true
        failedNodes = failedNodes.includes(child) ? failedNodes : [...failedNodes, child]
        current = node
        path = path.slice(0, path.indexOf(child))
      }

      matched = k
      failed = true
      push(
        'search',
        opIndex,
        w,
        `观察：节点 '${nodes[node].ch}' 下 ${avail.map((c) => `'${c}'`).join('、')} 这几条候选分支全部返回了 false。判断：所有候选都被剪掉，第 ${k + 1} 位的 "." 无论取哪个字母都走不通。动作：本层返回 false，回溯到上一层去换它的下一个候选分支。为什么：任意一条分支真能通向完整单词都会被上层拦下并返回 true；全部失败才说明模式 "${w}" 不在字典里。`
      )
      return false
    }

    const nxtId = links[node][ch]
    index = k
    isWild = false
    candidates = []
    if (nxtId === undefined) {
      failed = true
      current = node
      failedNodes = failedNodes.includes(node) ? failedNodes : [...failedNodes, node]
      result = false
      log[opIndex] = { ...log[opIndex], result: 'false', done: true }
      push(
        'search',
        opIndex,
        w,
        `观察：第 ${k + 1} 个字符需要字母 '${ch}'，但节点 '${nodes[node].ch}' 下只有 ${Object.keys(links[node]).join('、') || '（没有子节点）'}，没有 '${ch}' 这条边。判断：精确字符位的匹配节点唯一，缺边就说明该词从未被添加。动作：直接返回 false，模式剩下的 ${w.length - k - 1} 个字符一个字都不用再看。为什么：字典树里的单词必须表现为从根开始的一条边序列，'${ch}' 这条边不存在，后面怎么走都补不回来。`
      )
      return false
    }

    const nxt = nxtId
    matched = k + 1
    current = nxt
    path = [...path, nxt]
    matchedNodes = [...matchedNodes, nxt]
    push(
      'search',
      opIndex,
      w,
      `观察：第 ${k + 1} 个字符 '${ch}' 与当前节点的子节点完全一致，指针下移到 '${ch}'。判断：精确字符位上能与模式匹配的节点唯一（children['${ch}']），只走这一条边既完备也没有冗余。动作：把下标推进到 ${k + 1}，继续在 '${ch}' 的子树里匹配后缀 "${w.slice(k + 1)}"。为什么：不需要枚举兄弟分支，这也是不含通配符时 search 只有 O(L) 的原因。`
    )
    return dfs(nxt, w, k + 1, opIndex)
  }

  for (let i = 0; i < QUERIES.length; i++) {
    const w = QUERIES[i]
    const opIndex = WORDS.length + i
    log.push({ label: OP_LABEL[opIndex], result: '进行中', done: false })
    failed = false
    result = null
    isWild = false
    candidates = []
    failedNodes = []
    matchedNodes = []
    path = [rootId]
    matched = 0
    index = -1
    current = rootId
    dfs(rootId, w, 0, opIndex)
  }

  const actual = log.filter((l) => l.label.startsWith('search')).map((l) => l.result === 'true')
  const okAll = actual.length === EXPECTED.length && actual.every((v, i) => v === EXPECTED[i])

  matched = 0
  index = -1
  isWild = false
  candidates = []
  current = rootId
  path = [rootId]
  matchedNodes = []
  failedNodes = []
  failed = false
  result = null
  push(
    'done',
    -1,
    '',
    `观察：全部操作执行完毕，四次 search 的返回值依次是 ${actual.join('、')}，与题解输出 ${EXP_TEXT} 一致${okAll ? '' : '（不一致，请检查）'}。判断：共享前缀 "ad" 只被建立一次，search("pad") 因为根下没有 'p' 这条边在第一步就被剪掉，".ad" 与 "b.." 则通过枚举非空子节点各命中一条完整路径。动作：答案直接读操作日志里 search 的返回值：search("pad") = false、search("bad") = true、search(".ad") = true、search("b..") = true。为什么：每遇到一个 "." 就要在它的非空子节点上分叉，最坏 O(26^K × L)，但字典树会剪掉不存在的分支，实际远小于该上界；空间是 O(总节点数)，共 10 个节点。`
  )

  // 「下一步动作」统一由后一个快照回填，保证 Hint 与步骤数据完全一致
  for (let i = 0; i < steps.length - 1; i++) {
    const s = steps[i]
    const b = steps[i + 1]
    if (s.phase === 'done') {
      s.next = ''
    } else if (b.phase === 'done') {
      s.next = '操作序列执行完毕，汇总四次 search 的返回值'
    } else if (b.phase === 'add' && b.opIndex === s.opIndex) {
      s.next =
        b.matched > s.matched
          ? `插入 "${b.word}" 第 ${b.matched} 个字符 '${b.word[b.index]}'（${b.newNodes.length > s.newNodes.length ? '需新建节点' : '复用已有节点'}）`
          : `把 "${b.word}" 末节点的 isEnd 置为 true`
    } else if (b.phase === 'add') {
      s.next = `开始 ${OP_LABEL[b.opIndex]}，从根节点逐字符下行`
    } else if (b.phase === 'search' && b.opIndex === s.opIndex) {
      // 当前已匹配到第 (b.matched - 1) 个字符，b.candidates 里放的是 '.'
      // 将要试的那个字母（快照不带试到哪一条，因此统一取第一个候选）
      const stepCh = b.word.slice(b.matched - 1, b.matched)
      if (b.result === false && b.index === 0 && b.matched === 0) {
        s.next = `字符 '${b.word[0]}' 在根节点下没有对应的边，search 直接返回 false`
      } else if (b.isWild && b.failed) {
        s.next = `"." 的全部候选都失败了，回溯到上一层`
      } else if (b.matched > s.matched) {
        s.next = b.isWild
          ? `"." 在本节点假设匹配 '${b.candidates.length ? b.candidates[0] : stepCh}' 并递归进去`
          : `字符 '${stepCh}' 与子节点一致，指针下移到 '${stepCh}'`
      } else if (b.isWild) {
        s.next =
          b.candidates.length > 1
            ? `"." 位置按字母序枚举非空子节点 ${b.candidates.map((c) => `'${c}'`).join('、')}，先试 '${b.candidates[0]}'`
            : `"." 位置枚举非空子节点 ${b.candidates.length ? b.candidates.map((c) => `'${c}'`).join('、') : '（无候选）'}`
      } else if (b.failed) {
        s.next = `${b.trie.nodes[b.current ?? b.trie.rootId].ch === '' ? '根节点' : `节点 '${b.trie.nodes[b.current ?? b.trie.rootId].ch}'`}的落点没有 isEnd 标记，本分支返回 false 并回溯`
      } else {
        s.next = '模式已走完，检查落点的 isEnd 是否为 true'
      }
    } else {
      s.next = `开始 ${OP_LABEL[b.opIndex]}，从根节点开始匹配`
    }
  }

  return steps
}

/* ---------------- 舞台渲染（模式 E：SVG 节点圆 + 直线边） ---------------- */

const COL_W = 84
const ROW_H = 78
const PAD_L = 46
const PAD_Y = 46
const NODE_R = 21

/** x 按中序展开的槽位深度分层、y 取子树叶子均值，与模式 E 参照实现一致 */
function layoutOf(trie: TrieSnap) {
  const pos: Record<number, { x: number; y: number }> = {}
  const kids: Record<number, number[]> = {}
  let leaf = 0
  let maxDepth = 0

  const walk = (id: number, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth)
    const cs = Object.keys(trie.links[id] ?? {})
      .sort()
      .map((k) => trie.links[id][k])
    kids[id] = cs
    const y = cs.length
      ? cs.map((c) => walk(c, depth + 1)).reduce((a, b) => a + b, 0) / cs.length
      : (() => {
          const yy = PAD_Y + leaf * ROW_H
          leaf += 1
          return yy
        })()
    pos[id] = { x: PAD_L + depth * COL_W, y }
    return y
  }
  walk(trie.rootId, 0)

  return {
    pos,
    kids,
    W: PAD_L * 2 + maxDepth * COL_W,
    H: PAD_Y * 2 + Math.max(leaf - 1, 0) * ROW_H,
  }
}

type NState = 'cur' | 'ok' | 'bad' | 'path' | 'idle'

const RING: Record<NState, string> = {
  cur: 'hsl(var(--amber))',
  ok: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  path: 'hsl(var(--teal))',
  idle: 'hsl(var(--border))',
}

const FILL: Record<NState, string> = {
  cur: 'hsl(var(--amber-soft))',
  ok: 'hsl(var(--easy-soft))',
  bad: 'hsl(var(--hard-soft))',
  path: 'hsl(var(--amber-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const TEXT: Record<NState, string> = {
  cur: 'hsl(var(--amber))',
  ok: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  path: 'hsl(var(--ink))',
  idle: 'hsl(var(--ink-soft))',
}

const EDGE: Record<NState, string> = {
  cur: 'hsl(var(--teal))',
  ok: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  path: 'hsl(var(--teal))',
  idle: 'hsl(var(--border))',
}

/** 单元格状态：ok=本步已匹配到（绿）、new=本步正在试的通配符候选（青）、bad=失败/落空（红） */
function cellStateOf(step: Step, i: number): CellState {
  if (step.phase === 'init' || step.phase === 'done' || step.word === '') return 'idle'
  if (i >= step.word.length) return 'dim'
  if (step.phase === 'add') return i < step.matched ? 'ok' : 'dim'
  if (i < step.matched) return 'ok'
  if (i === step.index) return step.failed ? 'bad' : step.word[i] === '.' ? 'new' : 'active'
  return 'dim'
}

function Stage(step: Step) {
  const lay = useMemo(() => layoutOf(step.trie), [step.trie])
  const { pos, kids, W, H } = lay

  const stateOf = (id: number): NState => {
    if (step.failedNodes.includes(id)) return 'bad'
    if (step.matchedNodes.includes(id)) return 'ok'
    if (step.current === id) return 'cur'
    if (step.path.includes(id)) return 'path'
    return 'idle'
  }

  const prefix = step.word.slice(0, step.matched)
  const activeChar =
    step.index >= 0 && step.index < step.word.length ? step.word[step.index] : null
  const curCh = step.current === null ? null : step.trie.nodes[step.current].ch

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 图层顺序：先边、再节点圆、最后文字标签（参照 68-maximum-depth-of-binary-tree.tsx） */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {step.trie.order.map((id) =>
          kids[id].map((cid) => (
            <line
              key={`${id}-${cid}`}
              x1={pos[id].x + NODE_R}
              y1={pos[id].y}
              x2={pos[cid].x - NODE_R}
              y2={pos[cid].y}
              stroke={EDGE[stateOf(cid)]}
              strokeWidth={stateOf(cid) === 'idle' ? 2 : 3}
            />
          ))
        )}

        {step.trie.order.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              {step.endNodes.includes(id) && (
                <circle
                  cx={pos[id].x}
                  cy={pos[id].y}
                  r={NODE_R + 6}
                  fill="none"
                  stroke="hsl(var(--easy))"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )}
              {st === 'cur' && (
                <circle
                  cx={pos[id].x}
                  cy={pos[id].y}
                  r={NODE_R + 6}
                  fill="none"
                  stroke="hsl(var(--amber))"
                  strokeWidth={3}
                />
              )}
              <circle
                cx={pos[id].x}
                cy={pos[id].y}
                r={NODE_R}
                fill={FILL[st]}
                stroke={RING[st]}
                strokeWidth={st === 'cur' ? 3 : 2.5}
              />
              <text
                x={pos[id].x}
                y={pos[id].y + 6}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                className="font-code"
                fill={TEXT[st]}
              >
                {step.trie.nodes[id].ch === '' ? '根' : step.trie.nodes[id].ch}
              </text>
            </g>
          )
        })}

        {/* 状态文字标签：不靠颜色也能区分节点状态 */}
        {step.trie.order.map((id) => {
          const st = stateOf(id)
          const label = st === 'cur' ? '当前' : st === 'ok' ? '命中' : st === 'bad' ? '失败' : null
          if (!label) return null
          return (
            <text
              key={`lb-${id}`}
              x={pos[id].x}
              y={pos[id].y - NODE_R - 11}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={TEXT[st]}
            >
              {label}
            </text>
          )
        })}

        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          每个节点最多 26 个孩子，舞台只画真正被插入用到的边；绿色虚线环 = isEnd
        </text>
      </svg>

      {step.word !== '' && (
        <div className="flex w-full flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from(step.word).map((ch, i) => (
              <div key={`wf-${i}`} className="flex h-6 w-10 items-end justify-center">
                {i === step.index && (
                  <span className="text-[hsl(var(--ink-soft))]">
                    <Flag
                      label={ch === '.' ? '.' : 'i'}
                      tone={step.failed ? 'hard' : step.phase === 'add' ? 'teal' : 'amber'}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from(step.word).map((ch, i) => (
              <Cell key={`wc-${i}`} state={cellStateOf(step, i)} size="sm" className="w-10 shrink-0">
                {ch}
              </Cell>
            ))}
          </div>
          <span className="font-code text-[10px] text-ink-soft">
            {step.phase === 'add' ? 'addWord' : 'search'}("{step.word}") · 已匹配 {step.matched} /{' '}
            {step.word.length} 个字符
          </span>
        </div>
      )}

      <Badges className="justify-center">
        <Stat
          label="当前操作"
          value={step.opIndex < 0 ? '全部完成' : OP_LABEL[step.opIndex]}
          tone="amber"
        />
        {step.phase === 'add' && <Stat label="已插入前缀" value={`"${prefix}"`} tone="teal" />}
        {step.phase === 'search' && (
          <Stat label="已匹配前缀" value={`"${prefix}"`} tone={step.failed ? 'hard' : 'teal'} />
        )}
        {step.phase === 'search' && step.isWild && (
          <Badge tone={step.candidates.length ? 'teal' : 'hard'}>
            "." 的非空子节点：
            <b className="font-code text-xs">
              {step.candidates.length ? step.candidates.map((c) => `'${c}'`).join('、') : '空'}
            </b>
          </Badge>
        )}
        {step.phase === 'search' && !step.isWild && activeChar !== null && step.result !== true && (
          <Badge tone={step.failed ? 'hard' : 'easy'}>
            第 <b className="font-code text-xs">{step.index + 1}</b> 个字符 '
            <b className="font-code text-xs">{activeChar}</b>'
            {step.failed ? ' 没有对应子节点' : ' 与子节点一致'}
          </Badge>
        )}
        {step.phase === 'search' && step.result === true && (
          <Badge tone="easy">落点 isEnd = true，本次 search 返回 true</Badge>
        )}
        {step.next !== '' && step.result !== true && (
          <Hint tone={step.failed ? 'hard' : 'teal'}>{step.next}</Hint>
        )}
        {step.phase === 'done' && <Answer>{EXPECTED.map((_, i) => `search("${QUERIES[i]}") = ${EXPECTED[i]}`).join('，')}</Answer>}
      </Badges>

      {curCh !== null && step.index >= 0 && step.result !== true && (
        <span className="font-code text-[10px] text-ink-soft">
          指针停在节点 '{curCh}'（第 {step.index + 1} 个字符）
        </span>
      )}
    </div>
  )
}

export default function DesignAddAndSearchWordsDataStructureDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="字典树 + 通配符 '.' 的分支枚举"
      info={`输入取自题解官方示例：addWord("bad")、addWord("dad")、addWord("mad")，再依次 search("pad")、search("bad")、search(".ad")、search("b..")，期望输出 ${EXP_TEXT}，共 ${steps.length} 步。为看清每个字符的落点，舞台只画这三个词真正用到的 10 个节点（每个字典树节点理论上有 26 个孩子，空的那些不画）；'.' 位置按字母序枚举非空子节点，只要有一条分支成功就立刻返回 true。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.teal, label: '当前递归路径上的节点' },
        { color: TONE.amber, label: '本步正在处理的节点' },
        { color: TONE.easy, label: '匹配成功 / 单词结尾 isEnd（绿虚线环）' },
        { color: TONE.hard, label: '缺边或候选全败，返回 false 的分支' },
        { color: TONE.muted, label: '不在当前路径上的节点（灰）' },
      ]}
    />
  )
}
