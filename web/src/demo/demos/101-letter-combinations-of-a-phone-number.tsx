import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 101. 电话号码的字母组合 —— 模式 E：递归决策树 + 已选路径文字标签      */
/* ------------------------------------------------------------------ */

/** 题解示例 1：digits = "23"，输出 9 个组合（全展开约 3^4 会爆步数，故用最小示例） */
const DIGITS = '23'

/** 题解给出的电话按键映射（'0'、'1' 不对应任何字母） */
const PHONE: Record<string, string> = {
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
}

/* ---------------- 决策树的静态几何（递归树：第 k 层深度固定） ---------------- */

interface TreeNode {
  key: string
  /** 该节点代表的已选路径（根为空串） */
  path: string
  /** 进入该节点所需的层号：根为 -1，第 k 层节点为 k */
  depth: number
  x: number
  y: number
  parent: string | null
}

const DIGIT_LIST = DIGITS.split('')

/** 叶子按顺序等距铺开，父节点取子节点横坐标的中点，保证是规整的递归树 */
const LEAF_STEP = 70
const LEAF_X0 = 60 + LEAF_STEP / 2
const LEVEL_Y = [40, 118, 196]

const NODES: TreeNode[] = []
const CHILDREN: Record<string, string[]> = {}
const NODE_OF: Record<string, TreeNode> = {}

function addNode(node: TreeNode) {
  NODES.push(node)
  NODE_OF[node.key] = node
  CHILDREN[node.key] = []
  if (node.parent !== null) CHILDREN[node.parent].push(node.key)
}

addNode({ key: 'root', path: '', depth: -1, x: 0, y: LEVEL_Y[0], parent: null })

const LAYER1: string[] = []
for (const ch of PHONE[DIGIT_LIST[0]]) {
  const key = ch
  addNode({ key, path: ch, depth: 0, x: 0, y: LEVEL_Y[1], parent: 'root' })
  LAYER1.push(key)
}

const LEAVES: string[] = []
for (const key of LAYER1) {
  for (const ch of PHONE[DIGIT_LIST[1]]) {
    const leafKey = `${key}${ch}`
    addNode({ key: leafKey, path: leafKey, depth: 1, x: 0, y: LEVEL_Y[2], parent: key })
    LEAVES.push(leafKey)
  }
}

LEAVES.forEach((key, i) => {
  NODE_OF[key].x = LEAF_X0 + i * LEAF_STEP
})
LAYER1.forEach((key) => {
  const kids = CHILDREN[key].map((k) => NODE_OF[k].x)
  NODE_OF[key].x = (Math.min(...kids) + Math.max(...kids)) / 2
})
NODE_OF['root'].x = (Math.min(...LAYER1.map((k) => NODE_OF[k].x)) + Math.max(...LAYER1.map((k) => NODE_OF[k].x))) / 2

const EDGES = NODES.filter((n) => n.parent !== null).map((n) => ({
  key: n.key,
  x1: NODE_OF[n.parent as string].x,
  y1: NODE_OF[n.parent as string].y,
  x2: n.x,
  y2: n.y,
}))

/* ---------------- 步骤数据 ---------------- */

type CursorState = 'current' | 'back' | 'ok' | 'idle'

interface Candidate {
  letter: string
  state: 'tried' | 'current' | 'rest'
}

interface Step {
  phase: 'init' | 'choose' | 'collect' | 'undo' | 'done'
  /** 本步聚焦的节点 key；done 步为 null */
  cur: string | null
  /** index = 当前正在决定第几位 */
  index: number
  /** path 快照：定长缓冲区，'' 表示该位还没写入 */
  path: string[]
  /** 已收集的组合（不可变快照） */
  results: string[]
  /** 本层候选字母（全部列出，便于看清「已试过 / 当前 / 还没试」） */
  candidates: Candidate[]
  note: string
  /** 下一步动作，由后一个快照统一回填，保证与步骤数据一致 */
  next: string
}

function candidatesAt(index: number, curIdx: number): Candidate[] {
  if (index < 0 || index >= DIGITS.length) return []
  return PHONE[DIGIT_LIST[index]].split('').map((letter, i) => ({
    letter,
    state: i < curIdx ? 'tried' : i === curIdx ? 'current' : 'rest',
  }))
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const path: string[] = new Array(DIGITS.length).fill('')
  const results: string[] = []

  const snap = (
    phase: Step['phase'],
    cur: string | null,
    index: number,
    curIdx: number,
    note: string
  ): Step => ({
    phase,
    cur,
    index,
    path: path.slice(),
    results: results.slice(),
    candidates: candidatesAt(index, curIdx),
    note,
    next: '',
  })

  const LEN = DIGITS.length

  steps.push(
    snap(
      'init',
      'root',
      0,
      -1,
      `观察：digits = "23"，2 → "abc"、3 → "def"，每组字母各选一个就有 3 × 3 = 9 个组合。判断：第 0 位的选择只影响它下面的分支，所以分两层回溯即可 —— 第 k 层只决定 path[k]。动作：从第 0 层开始，把 path 当成两个空槽位，逐层写入一个字母，路径满了就收集。为什么：这样枚举既不重复（每个下标恰好赋值一次）也不遗漏（每层都把所有字母试完），结果长度必然等于 ${LEN}。`
    )
  )

  function backtrack(index: number) {
    if (index === LEN) {
      const word = path.join('')
      results.push(word)
      steps.push(
        snap(
          'collect',
          word,
          LEN,
          -1,
          `观察：递归走到第 ${LEN} 层，递归出口判定 index == len(digits) 成立，路径 "${word}" 的每一位都已确定。判断：path 里 ${LEN} 个槽位全部填满，得到一个完整组合。动作：把 path 复制成字符串 "${word}" 收进结果集，已收集 ${results.length} 个，然后返回第 ${index - 1} 层继续换字母。为什么：只有 index 走到 ${LEN} 才收集，所以每个结果的长度都恰好是 ${LEN}，不会出现半截的字符串。`
        )
      )
      return
    }

    const digit = DIGIT_LIST[index]
    const letters = PHONE[digit]
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i]
      path[index] = ch
      steps.push(
        snap(
          'choose',
          path.slice(0, index + 1).join(''),
          index,
          i,
          `观察：第 ${index} 层拿到 digits[${index}] = '${digit}'，候选字母是 "${letters}"，本次取第 ${i + 1} 个字母 '${ch}'。判断：写入 path[${index}] 后当前已选路径变成 "${path.slice(0, index + 1).join('')}"，${letters.slice(i + 1).length > 0 ? `本层还剩 ${letters.slice(i + 1).length} 个字母没试` : '本层字母已试到最后一个'}。动作：以这条路径为前缀继续递归 backtrack(${index + 1})。为什么：每个组合只由「每一位选哪个字母」决定，逐层固定一位才能把笛卡尔积枚举完整。`
        )
      )

      backtrack(index + 1)

      steps.push(
        snap(
          'undo',
          path.slice(0, index).join(''),
          index,
          i,
          `观察：以 '${ch}' 开头的分支已全部走完，路径 "${path.slice(0, index + 1).join('')}" 不再往下扩展，第 ${index + 1} 层已经返回。判断：${index === 0 && i === letters.length - 1 ? '这是本层最后一个字母，该层不再产生新组合' : `本层还要接着试 '${letters[i + 1] ?? ch}'`}。动作：把选择权还给第 ${index} 层的循环，下一次循环用新字母覆盖 path[${index}]。为什么：path 是定长缓冲区，第 ${index} 位被反复覆盖，递归返回后不需要显式撤销，这就是回溯里的「撤销选择」。`
        )
      )
    }
    path[index] = ''
  }

  backtrack(0)

  steps.push(
    snap(
      'done',
      null,
      LEN,
      -1,
      `观察：两层递归全部返回，9 个分支各收集到一个组合。判断：从 '2' 的集合和 '3' 的集合中各取一个字母恰好有 9 种取法，结果集已满。动作：答案 = [${results.join(', ')}]，共 ${results.length} 个。为什么：枚举完备且每层只赋值一次，所以既不重复也不遗漏；时间 O(3^N × 4^M)（N 为 3 字母的数字个数、M 为 4 字母的），这里 3 × 3 = 9，递归栈最深只有 ${LEN} 层，空间 O(len(digits))。`
    )
  )

  // Hint 文案由后一个快照回填，保证「下一步」与真实步骤完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'choose') s.next = `第 ${b.index} 层写入 '${b.path[b.index]}'`
    else if (b.phase === 'collect') s.next = `路径已满，把 "${b.results[b.results.length - 1]}" 收进结果集`
    else if (b.phase === 'undo') s.next = `撤销 path[${b.index}] 上的 '${b.path[b.index]}'，回到第 ${b.index} 层换下一个字母`
    else s.next = '所有分支都已走完，输出结果集'
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 282
const R = 20

const FILL: Record<CursorState, string> = {
  current: 'hsl(var(--paper))',
  back: 'hsl(var(--teal-soft))',
  ok: 'hsl(var(--easy-soft))',
  idle: 'hsl(var(--paper))',
}

const STROKE: Record<CursorState, string> = {
  current: 'hsl(var(--amber))',
  back: 'hsl(var(--teal))',
  ok: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<CursorState, number> = {
  current: 3,
  back: 2,
  ok: 2,
  idle: 1.6,
}

const INK_FILL: Record<CursorState, string> = {
  current: 'hsl(var(--amber))',
  back: 'hsl(var(--teal))',
  ok: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

const STATE_LABEL: Record<CursorState, string> = {
  current: '当前',
  back: '已搜索',
  ok: '已收集',
  idle: '未访问',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const selected = step.path.filter((c) => c !== '')
  const currentPath = selected.join('')

  /** 已经走过的节点：已收集的叶子 + 当前节点到根的整条路径 */
  const known = new Set<string>(step.results)
  if (done) {
    NODES.forEach((n) => known.add(n.key))
  } else if (step.cur && step.cur !== 'root') {
    const cur = step.cur
    NODES.forEach((n) => {
      if (n.key !== 'root' && cur.startsWith(n.path)) known.add(n.key)
    })
  }

  const stateOf = (key: string): CursorState => {
    if (step.cur === key) return step.phase === 'undo' ? 'back' : 'current'
    if (key === 'root') return done ? 'back' : 'idle'
    if (known.has(key)) return key.length === DIGITS.length ? 'ok' : 'back'
    return 'idle'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：先画线，节点圆后画盖住端点 */}
        {EDGES.map((e) => {
          const child = stateOf(e.key)
          return (
            <line
              key={`edge-${e.key}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={
                child === 'current'
                  ? 'hsl(var(--amber))'
                  : child === 'idle'
                    ? 'hsl(var(--border))'
                    : 'hsl(var(--teal))'
              }
              strokeWidth={child === 'current' ? 2.5 : 2}
            />
          )
        })}

        {/* 2. 节点圆：圆内是这条路径上已经选好的字母 */}
        {NODES.map((n) => {
          const st = stateOf(n.key)
          return (
            <g key={`node-${n.key}`} className="demo-water">
              <circle
                cx={n.x}
                cy={n.y}
                r={R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
              />
              {n.key === 'root' ? (
                <text
                  x={n.x}
                  y={n.y + 5}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--ink-soft))"
                >
                  {'∅'}
                </text>
              ) : (
                <text
                  x={n.x}
                  y={n.y + 6}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="700"
                  className="font-code"
                  fill={INK_FILL[st]}
                >
                  {n.path}
                </text>
              )}
            </g>
          )
        })}

        {/* 3. 层号 + 状态文字标签（不靠颜色也能区分状态） */}
        {NODES.map((n) => {
          const st = stateOf(n.key)
          return (
            <g key={`label-${n.key}`}>
              <text
                x={n.x}
                y={n.y + R + 14}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                className="font-code"
                fill="hsl(var(--ink-soft))"
              >
                {n.key === 'root' ? 'backtrack(0)' : `第${n.depth}层`}
              </text>
              <text
                x={n.x + R + 6}
                y={n.y + 4}
                textAnchor="start"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={
                  st === 'current'
                    ? 'hsl(var(--amber))'
                    : st === 'back'
                      ? 'hsl(var(--teal))'
                      : 'hsl(var(--ink-soft))'
                }
              >
                {STATE_LABEL[st]}
              </text>
              {st === 'ok' && (
                <text
                  x={n.x - R - 6}
                  y={n.y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="800"
                  className="font-code"
                  fill="hsl(var(--easy))"
                >
                  ✓
                </text>
              )}
            </g>
          )
        })}

        {/* 4. 底部说明：树怎么读 */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          第 k 层固定第 k 位，根到叶的一条路径就是一个组合
        </text>
      </svg>

      {/* 已选路径槽位：path 数组的可视化 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-code text-[11px] text-ink-soft">已选路径 path</span>
        {DIGIT_LIST.map((_d, i) => (
          <Cell
            key={`path-${i}`}
            size="lg"
            state={step.path[i] ? (step.index === i ? 'active' : 'ok') : 'dim'}
            className="w-full min-w-0 sm:min-w-0"
          >
            {step.path[i] ? step.path[i] : '·'}
          </Cell>
        ))}
        <span className="flex flex-wrap items-center gap-1 font-code text-[11px] text-ink-soft">
          {DIGIT_LIST.map((d, i) => (
            <span key={`idx-${i}`}>
              {i > 0 && '·'}
              path[{i}]←'{d}'
            </span>
          ))}
        </span>
      </div>

      {/* 本层候选字母：全部列出，「已试过」被压暗，当前字母用 amber */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-code text-[11px] text-ink-soft">
          {step.index < DIGITS.length ? `第 ${step.index} 层候选（'${DIGIT_LIST[step.index]}'）` : '叶子层'}
        </span>
        {step.candidates.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">（没有候选字母）</span>
        ) : (
          step.candidates.map((c) => (
            <Cell
              key={`cand-${c.letter}`}
              state={c.state === 'tried' ? 'dim' : c.state === 'current' ? 'active' : 'idle'}
              className="w-full min-w-0 sm:min-w-0"
            >
              {c.letter}
            </Cell>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="已选路径" value={currentPath === '' ? '（空）' : `"${currentPath}"`} tone="amber" />
        <Stat label="已收集组合" value={`${step.results.length} / 9`} tone="easy" />
        <Badge tone="plain">
          结果{' '}
          <b className="font-code text-xs">
            {step.results.length === 0 ? '（还没有）' : step.results.join(' ')}
          </b>
        </Badge>
        {!done && step.next !== '' && <Hint tone="amber">{step.next}</Hint>}
        {done && <Answer>{`9 个组合：${step.results.join(' ')}`}</Answer>}
      </Badges>
    </div>
  )
}

export default function LetterCombinationsOfAPhoneNumberDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="递归决策树：每层选一个字母"
      info={`输入：digits = "23"（题解示例 1，输出 9 个组合）。取示例 1 是因为它规模最小又能同时展示「分支 + 回溯」：示例 3 的 "2" 只有一层、示例 2 的空串直接返回 []，都看不到撤销。每层固定一位，已选路径用文字串标在节点上。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前节点 / 本层正在选的字母' },
        { color: TONE.teal, label: '已搜索过的分支（回溯后）' },
        { color: TONE.easy, label: '已收集的完整组合（✓）' },
        { color: TONE.muted, label: '还没试的候选字母' },
      ]}
    />
  )
}
