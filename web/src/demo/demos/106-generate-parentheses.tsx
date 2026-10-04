import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 106. 括号生成 —— 模式 E：递归决策树 + 左右括号剩余数量剪枝              */
/*                                                                    */
/* 每个节点是一段合法的括号前缀：圆内写「left,right」（已用的左右括号     */
/* 数），圆上写这段前缀本身；第 k 层的节点恰好有 k 个字符（k = left+right）*/
/* 同一状态会被多条路径复用（如 (1,0) 既在 "(" 下也在 "()" 下），所以状态 */
/* 图是 DAG：公共父节点用虚线边重复指向同一个圆。DFS 的调用序与第一次    */
/* 访问序一致，布局沿用模式 E 的「x 按第一次访问序展开、y 按层」。        */
/* ------------------------------------------------------------------ */

/** 题解示例 1：n = 3（输出 5 个合法组合，全部展示，不引入更大的示例） */
const N = 3
const N_MAX = 2 * N

interface State {
  id: string
  left: number
  right: number
}

function rawKids(node: State, memo: Map<string, State[]>): State[] {
  const cached = memo.get(node.id)
  if (cached) return cached
  const kids: State[] = []
  if (node.left < N) kids.push({ id: `${node.id}L`, left: node.left + 1, right: node.right })
  if (node.right < node.left) kids.push({ id: `${node.id}R`, left: node.left, right: node.right + 1 })
  memo.set(node.id, kids)
  return kids
}

const ROOT: State = { id: 'r', left: 0, right: 0 }

/** 全部状态定义（首次访问序 = DFS 调用序） */
const STATE_ORDER: string[] = []
const STATE_DEF = new Map<string, State>()
const KIDS = new Map<string, State[]>()
/** 递归树的边：父 → 子；同一对父子只保留一条（子节点在布局里只画一个圆） */
const EDGES: { id: string; parent: string; child: string }[] = []

function discover(node: State, memo: Map<string, State[]>) {
  STATE_DEF.set(node.id, node)
  STATE_ORDER.push(node.id)
  const kids = rawKids(node, memo)
  KIDS.set(node.id, kids)
  for (const kid of kids) {
    EDGES.push({ id: `${node.id}>${kid.id}`, parent: node.id, child: kid.id })
    discover(kid, memo)
  }
}
discover(ROOT, new Map<string, State[]>())

/** 每个状态的前缀字符串；子状态只比父状态多一个字符，可以直接推出 */
const TEXT_OF = new Map<string, string>([[ROOT.id, '']])
STATE_ORDER.forEach((id) => {
  const node = STATE_DEF.get(id) as State
  const text = TEXT_OF.get(id) as string
  for (const kid of KIDS.get(id) as State[]) {
    TEXT_OF.set(kid.id, text + (kid.left > node.left ? '(' : ')'))
  }
})

/** 中序展开：同一层状态的 x 槽位按中序顺序分配 */
const ORDER: string[] = []
function inorder(id: string) {
  const node = STATE_DEF.get(id) as State
  const kids = KIDS.get(id) as State[]
  const leftKid = kids.find((k) => k.left > node.left)
  const rightKid = kids.find((k) => k.left === node.left)
  if (leftKid) inorder(leftKid.id)
  ORDER.push(id)
  if (rightKid) inorder(rightKid.id)
}
inorder(ROOT.id)

const DEPTH_OF = new Map<string, number>()
STATE_ORDER.forEach((id) => {
  const node = STATE_DEF.get(id) as State
  DEPTH_OF.set(id, node.left + node.right)
})

/* ---------------- 步骤数据 ---------------- */

interface Step {
  phase: 'init' | 'node' | 'done'
  /** 本步正在展开的状态；done 步为 null */
  cur: string | null
  /** 递归路径（根 → 当前状态）上的全部状态 id */
  path: string[]
  /** 已收进结果集的完整合法路径上的全部状态 id */
  solved: string[]
  /** 已经进入过的状态 id（含当前状态） */
  entered: string[]
  /** 子树已整棵试完、已经回溯的状态 id */
  closed: string[]
  note: string
}

const t = (id: string | null) => (id === null ? '' : (TEXT_OF.get(id) as string))

function buildSteps(): Step[] {
  const steps: Step[] = []
  const path: string[] = []
  const solved = new Set<string>()
  const entered = new Set<string>()
  const closed = new Set<string>()
  let order = 0

  const snap = (phase: Step['phase'], cur: string | null, note: string): Step => ({
    phase,
    cur,
    path: path.slice(),
    solved: [...solved],
    entered: [...entered],
    closed: [...closed],
    note,
  })

  function dfs(id: string) {
    const { left, right } = STATE_DEF.get(id) as State
    const prefix = t(id)
    const kids = KIDS.get(id) as State[]
    const canLeft = kids.some((k) => k.left > left)
    const canRight = kids.some((k) => k.left === left)
    const isRoot = id === ROOT.id
    order += 1
    path.push(id)
    entered.add(id)

    const head = `观察：第 ${order} 次调用到达 \`${left},${right}\`，当前前缀 "${prefix.length > 0 ? prefix : '空'}"，已用 ${left} 个左括号、${right} 个右括号。`
    let note: string

    if (left === N && right === N) {
      note =
        head +
        `判断：left == n 且 right == n，当前前缀长度已有 2n = ${N_MAX}，过程中又始终满足 left ≥ right，所以它已经是一条完整合法串。` +
        `动作：把 "${prefix}" 收进结果集，然后回溯，回到上一层继续试它剩下的分支。` +
        `为什么：这是递归的收集出口，n = ${N} 时它会被命中 5 次，正是全部合法组合的个数。`
    } else if (!canLeft && !canRight) {
      note =
        head +
        `判断：left == n，再放左括号会超过 n 个；而 right == left，放右括号会让这个前缀的右括号多于左括号，必然非法。` +
        `动作：两个分支都不能走，直接回溯，回到上一层继续试它剩下的分支。` +
        `为什么：${N} 个左括号已经全部用完，而此处右括号数只到 ${right}，后面再也凑不出配对的左括号，这条路走不成合法串，剪掉它不会漏解。`
    } else if (!canLeft) {
      note =
        head +
        `判断：left == n，再放左括号就超过 n 个，所以左分支不合法；right = ${right} < left = ${left}，放右括号合法。` +
        `动作：跳过左括号分支，放一个右括号进入 \`${left},${right + 1}\`，前缀变 "${prefix})"。` +
        `为什么：合法串总共只有 n 个左括号，它们已经用满，左分支再试也只会多出左括号。`
    } else if (!canRight) {
      note =
        head +
        `判断：left = ${left} < n，放左括号合法；但 right = ${right} == left = ${left}，此刻放右括号会让前缀的右括号多于左括号，非法。` +
        `动作：跳过右括号分支，放一个左括号进入 \`${left + 1},${right}\`，前缀变 "${prefix}("。` +
        `为什么：右括号的条件是 right < left 而不是 right < n，漏掉这条约束就会生成 "())(" 这类非法串，剪枝必须在这里发生。`
    } else {
      note =
        head +
        `判断：left = ${left} < n，放左括号合法；right = ${right} < left = ${left}，放右括号也合法。` +
        `动作：先试左括号分支，等它的整棵子树返回后再试右括号分支。` +
        `为什么：两个分支的先后只影响结果顺序，先左后右得到的正是题解示例给出的顺序。`
    }

    steps.push(snap(isRoot ? 'init' : 'node', id, note))

    for (const kid of kids) dfs(kid.id)

    closed.add(id)
    path.pop()
  }

  dfs(ROOT.id)

  const answerText = [...solved].map((p) => `"${p}"`).join('、')
  steps.push(
    snap(
      'done',
      null,
      `观察：回溯结束，${solved.size} 条根到叶路径全部停在 left = right = n = ${N}，结果集共 ${solved.size} 个。` +
        `判断：输出 ${answerText} 与题解示例 1 完全一致，个数正好是第 ${N} 个卡特兰数 C_${N} = ${solved.size}。` +
        `动作：答案 = 按路径字符串读出的这 ${solved.size} 个组合，每个合法串恰好对应一条「每一步选左还是选右」的路径。` +
        `为什么：每个状态只展开一次、每个合法串只拼接 2n 次，时间 O(C_n × n)；递归栈最深 2n，空间 O(n)。`
    )
  )
  return steps
}

/** 「下一步」文案由后一个快照推导，保证 Hint 与步骤数据完全一致 */
function buildHints(steps: Step[]): string[] {
  return steps.map((s, i) => {
    const b = steps[i + 1]
    if (!b) return ''
    if (b.phase === 'done') return `回溯结束，输出结果集里的 ${steps[steps.length - 1].solved.length} 个合法组合`
    const curId = s.cur as string
    const cur = STATE_DEF.get(curId) as State
    const next = STATE_DEF.get(b.cur as string) as State
    const curText = t(curId)
    const nextText = t(b.cur)
    if (nextText.length <= curText.length) {
      return `以 "${curText}" 为前缀的分支都试完了，回溯到上一层 "${nextText}"，换它剩下的另一条分支`
    }
    return next.left > cur.left
      ? `放左括号进入 \`${next.left},${next.right}\`，前缀变 "${nextText}"`
      : `放右括号进入 \`${next.left},${next.right}\`，前缀变 "${nextText}"`
  })
}

/* ---------------- 舞台渲染 ---------------- */

const W = 900
const PAD_L = 36
const PAD_R = 36
const NODE_R = 20
const TOP = 62
const LEVEL_GAP = 72
const SLOTS = ORDER.length + 2
const H = TOP + N_MAX * LEVEL_GAP

const COL_OF = new Map<string, number>(ORDER.map((id, k) => [id, k] as const))
const X_OF = new Map<string, number>(
  ORDER.map((id) => [
    id,
    PAD_L + ((W - PAD_L - PAD_R) / SLOTS) * ((COL_OF.get(id) as number) + 1.5),
  ])
)

type NodeState = 'idle' | 'easy' | 'live' | 'current' | 'dead'

const FILL: Record<NodeState, string> = {
  idle: 'hsl(var(--paper))',
  easy: 'hsl(var(--easy-soft))',
  live: 'hsl(var(--amber-soft))',
  current: 'hsl(var(--amber-soft))',
  dead: 'hsl(var(--hard-soft))',
}

const STROKE: Record<NodeState, string> = {
  idle: 'hsl(var(--border))',
  easy: TONE.easy,
  live: TONE.amber,
  current: TONE.amber,
  dead: TONE.hard,
}

const STROKE_W: Record<NodeState, number> = {
  idle: 1.6,
  easy: 2.5,
  live: 2.6,
  current: 3.2,
  dead: 2.8,
}

const COUNT_FILL: Record<NodeState, string> = {
  idle: 'hsl(var(--ink-soft))',
  easy: TONE.easy,
  live: TONE.amber,
  current: TONE.amber,
  dead: TONE.hard,
}

type TextState = 'solved' | 'onPath' | 'entered' | 'pending'

const TEXT_FILL: Record<TextState, string> = {
  solved: TONE.easy,
  onPath: TONE.amber,
  entered: TONE.teal,
  pending: 'hsl(var(--ink-soft))',
}

function Stage({ step, hint }: { step: Step; hint: string }) {
  const onPath = new Set(step.path)
  const solved = new Set(step.solved)
  const entered = new Set(step.entered)
  const closed = new Set(step.closed)

  const x = (id: string) => X_OF.get(id) as number
  const y = (id: string) => TOP + (DEPTH_OF.get(id) as number) * LEVEL_GAP

  const textState = (id: string): TextState => {
    if (solved.has(id)) return 'solved'
    if (onPath.has(id)) return 'onPath'
    if (entered.has(id)) return 'entered'
    return 'pending'
  }

  const stateOf = (id: string): NodeState => {
    if (id === step.cur) return 'current'
    if (onPath.has(id)) return 'live'
    if (entered.has(id) && solved.has(id)) return 'easy'
    return 'idle'
  }

  /** 本步走到的状态：用来判定 Badge 文案（left == n / right == left） */
  const curState = step.cur === null ? null : (STATE_DEF.get(step.cur) as State)
  const collected = [...solved].length

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        role="img"
        aria-label="括号生成的递归决策树：圆内是已用的左右括号数，圆上是该状态的前缀字符串"
      >
        {/* 1. 边：先画暗色边，再画当前递归路径上的高亮边（后画的压住先画的） */}
        {EDGES.map((e) => {
          const onActivePath = onPath.has(e.parent) && onPath.has(e.child)
          if (onActivePath) return null
          const skipsLevel =
            (DEPTH_OF.get(e.child) as number) - (DEPTH_OF.get(e.parent) as number) > 1
          return (
            <line
              key={e.id}
              x1={x(e.parent)}
              y1={y(e.parent)}
              x2={x(e.child)}
              y2={y(e.child)}
              stroke="hsl(var(--border))"
              strokeWidth={1.6}
              strokeDasharray={skipsLevel ? '4 4' : undefined}
              opacity={0.7}
            />
          )
        })}
        {EDGES.map((e) => {
          const onActivePath = onPath.has(e.parent) && onPath.has(e.child)
          if (!onActivePath) return null
          const isLast = e.child === step.cur
          return (
            <line
              key={`${e.id}-on`}
              x1={x(e.parent)}
              y1={y(e.parent)}
              x2={x(e.child)}
              y2={y(e.child)}
              stroke={isLast ? TONE.amber : TONE.medium}
              strokeWidth={isLast ? 3 : 2}
            />
          )
        })}

        {/* 2. 节点圆：圆内写「已用左括号数,已用右括号数」 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const node = STATE_DEF.get(id) as State
          return (
            <g key={id} className="demo-water">
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
              />
              <text
                x={x(id)}
                y={y(id) + 4}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                className="font-code"
                fill={COUNT_FILL[st]}
              >
                {node.left},{node.right}
              </text>
            </g>
          )
        })}

        {/* 3. 前缀字符串 + 状态文字：状态不靠颜色单独区分 */}
        {ORDER.map((id) => {
          const st = textState(id)
          const node = STATE_DEF.get(id) as State
          const isLeaf = node.left === N && node.right === N
          const isClosed = closed.has(id) && id !== step.cur
          return (
            <g key={`label-${id}`}>
              <text
                x={x(id)}
                y={y(id) - NODE_R - 7}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={TEXT_FILL[st]}
              >
                "{t(id)}"
              </text>
              {id === step.cur && (
                <text
                  x={x(id) + NODE_R + 7}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.amber}
                >
                  当前
                </text>
              )}
              {isClosed && !isLeaf && (
                <text
                  x={x(id) + NODE_R + 7}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="600"
                  className="font-code"
                  fill={TONE.teal}
                >
                  试完
                </text>
              )}
              {isLeaf && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 24}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill={solved.has(id) ? TONE.easy : TONE.hard}
                >
                  {solved.has(id) ? '✓ 完整合法串' : '✕ right 已达 left，无法补完'}
                </text>
              )}
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          圆内 = 已用 (left,right)，圆上 = 该状态的前缀；第 k 层恰好 k 个字符，虚线边 = 同一状态被另一条路径复用
        </text>
      </svg>

      <Badges className="justify-center">
        <Stat
          label="当前 left,right"
          value={curState === null ? '—' : `${curState.left},${curState.right}`}
          tone="amber"
        />
        <Stat label="已收集合法串" value={collected} tone="easy" />
        {curState === null ? (
          <Badge tone="easy">搜索结束，状态图全部试完</Badge>
        ) : curState.right === curState.left ? (
          <Badge tone="hard">right == left，右括号分支非法</Badge>
        ) : curState.left === N ? (
          <Badge tone="medium">left == n，左括号分支已封死</Badge>
        ) : (
          <Badge tone="teal">两个分支都合法，先试左括号</Badge>
        )}
        {step.phase !== 'done' && hint && <Hint>{hint}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            <b className="font-code">{[...solved].map((p) => `"${p}"`).join('、')}</b>
            （<b className="font-code">{collected}</b> 个）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function GenerateParenthesesDemo() {
  const steps = useMemo(buildSteps, [])
  const hints = useMemo(() => buildHints(steps), [steps])
  return (
    <DemoShell
      title="递归决策树：边生成边剪枝"
      info={`输入：n = ${N}（题解示例 1，输出 ["((()))","(()())","(())()","()(())","()()()"]）。为完整看清剪枝与回溯，这里只用最小规模示例——n = 1 只有 1 条路径、n = 2 只有 3 个状态，都看不出「right == left 封死右分支」这一关键剪枝；n = 3 的状态图共 ${ORDER.length} 个状态、递归调用 ${steps.length - 1} 次，是这个算法的第一个完整示例，含 2 处被剪掉的非法分支，因此只演示 n = 3。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s, i) => <Stage step={s} hint={hints[i]} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前状态 / 当前递归路径上的状态' },
        { color: TONE.teal, label: '已经试过（子分支全部展开完毕）' },
        { color: TONE.easy, label: '已收集的完整合法串（✓ 标在叶节点）' },
        { color: TONE.hard, label: '✕ left 已满且 right == left，无法补完' },
        { color: TONE.muted, label: '还没有访问过的状态' },
      ]}
    />
  )
}
