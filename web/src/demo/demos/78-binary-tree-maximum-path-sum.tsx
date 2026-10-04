import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 78. 二叉树中的最大路径和 —— 模式 E：树 + 后序递归（自底向上汇总）      */
/* 每个节点记两个量：贡献给父节点的 gain（只能单边）                     */
/*                   以该节点为拐点的路径和（两侧可同时取）              */
/* ------------------------------------------------------------------ */

/** 题解示例 2 的层序数组（null 表示该位置没有节点），5 个真实节点，答案 42 */
const LEVELS: (number | null)[] = [-10, 9, 20, null, null, 15, 7]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

const ROOT_ID = 'R'

function buildTree(level: (number | null)[], i: number, id: string): TreeNode | null {
  if (i >= level.length) return null
  const val = level[i]
  if (val === null) return null
  return {
    id,
    val,
    left: buildTree(level, 2 * i + 1, `${id}L`),
    right: buildTree(level, 2 * i + 2, `${id}R`),
  }
}

const ROOT = buildTree(LEVELS, 0, ROOT_ID)

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
const PARENT_OF: Record<string, string> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number, parent: string | null) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  if (parent) PARENT_OF[node.id] = parent
  collect(node.left, depth + 1, node.id)
  ORDER.push(node.id)
  collect(node.right, depth + 1, node.id)
}
collect(ROOT, 0, null)

/** maxSum 的初值是「负无穷」（题解用 -1<<31），不能是 0 */
const NEG_INF = '−∞'
const fmtSum = (v: number | null) => (v === null ? NEG_INF : String(v))

interface Step {
  phase: 'init' | 'enter' | 'return' | 'done'
  /** 本步正在进入 / 正在回溯的节点 id；init 与 done 为 null */
  cur: string | null
  /** 已算出的「贡献给父节点的值」gain（不可变快照） */
  gains: Record<string, number>
  /** 已算出的「以该节点为拐点的路径和」（不可变快照） */
  paths: Record<string, number>
  /** 递归调用栈，栈顶在末尾 */
  stack: string[]
  /** 全局最大路径和；null 表示 −∞ */
  maxSum: number | null
  /** 当前最优路径的节点 id，按路径顺序 */
  bestPath: string[]
  note: string
  /** 下一步动作；由后一个快照统一回填，保证 Hint 说的是真正的下一步 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const gains: Record<string, number> = {}
  const paths: Record<string, number> = {}
  const stack: string[] = []
  /** 每个节点向下延伸的最优单边链，用来拼出「以它为拐点」的完整路径 */
  const down: Record<string, string[]> = {}
  let maxSum: number | null = null
  let bestPath: string[] = []
  let firstLeafSeen = false

  const snap = (phase: Step['phase'], cur: string | null, note: string): Step => ({
    phase,
    cur,
    gains: { ...gains },
    paths: { ...paths },
    stack: stack.slice(),
    maxSum,
    bestPath: bestPath.slice(),
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      `观察：输入 root = ${INPUT_TEXT}，只有 ${ORDER.length} 个真实节点，9 是根 -10 的左孩子（叶子）。` +
        `判断：任意一条路径都有一个离根最近的最高点，所以枚举每个节点当拐点即可，而候选值只能由子树自底向上推出来，必须走后序。` +
        `动作：maxSum 从 −∞ 起步（题解用 -1<<31），每个节点同时算两个量——gain = val + max(0, 左gain, 右gain)（只走单边，交给父节点），拐点路径和 = val + max(0, 左gain) + max(0, 右gain)（两侧可同时取）。` +
        `为什么：maxSum 不能初始化为 0，否则整棵树全负时会错（如 [-3] 应返回 -3）；负贡献要取 max(0, ·)，否则会把父节点拖低。`
    )
  )

  function dfs(id: string): number {
    const { val, left, right } = NODES[id]
    const hasKid = Boolean(left || right)
    const kids =
      left && right
        ? `左孩子是 ${left.val}、右孩子是 ${right.val}`
        : left
          ? `只有左孩子 ${left.val}，右孩子为空`
          : right
            ? `左孩子为空，只有右孩子 ${right.val}`
            : '没有孩子，是叶子'

    stack.push(id)
    steps.push(
      snap(
        'enter',
        id,
        `观察：进入 dfs(${val})，它${kids}，此刻 maxSum = ${fmtSum(maxSum)}。` +
          `判断：${
            hasKid
              ? '后序必须先拿到两棵子树的贡献，才能算出经过它的拐点路径和与要交还给父节点的 gain'
              : '两个子调用都会命中空节点并返回 0，所以它的左右贡献都是 max(0, 0) = 0'
          }。` +
          `动作：${
            left && right
              ? `先递归左子树 dfs(${left.val})，等它返回后再递归右子树 dfs(${right.val})`
              : left
                ? `先递归左子树 dfs(${left.val})，返回后再回到自己汇总`
                : right
                  ? `先递归右子树 dfs(${right.val})，返回后再回到自己汇总`
                  : '两个子调用都返回 0，直接用 val + 0 + 0 汇总'
          }。` +
          `为什么：${
            hasKid
              ? '向上只能交还单边贡献、不能把两侧相加，所以必须先等子树算完'
              : '叶子没有可选的向下分支，返回值只能是它自己 val + 0'
          }。`
      )
    )

    const rawL = left ? dfs(left.id) : 0
    const rawR = right ? dfs(right.id) : 0
    const lg = Math.max(0, rawL)
    const rg = Math.max(0, rawR)
    const curPath = val + lg + rg
    const prevMax = maxSum
    const beat = prevMax === null || curPath > prevMax

    const downL = left && rawL > 0 ? down[left.id] : []
    const downR = right && rawR > 0 ? down[right.id] : []

    if (beat) {
      maxSum = curPath
      bestPath = [...downL, id, ...downR]
    }
    const gain = val + Math.max(lg, rg)
    gains[id] = gain
    paths[id] = curPath
    down[id] = [id, ...(lg >= rg ? downL : downR)]
    stack.pop()

    const pathOf = bestPath.map((b) => VAL_OF[b]).join(' → ')
    const par = PARENT_OF[id]
    const isLeaf = !hasKid
    const firstLeaf = isLeaf && !firstLeafSeen
    if (isLeaf) firstLeafSeen = true

    const trunc = (raw: number, g: number) =>
      raw < 0
        ? `返回 ${raw} 为负，被 max(0, ·) 截断成 ${g}`
        : `返回 ${raw} 为正，max(0, ${raw}) = ${g}，没有发生截断`

    const cut =
      left && right
        ? `两个贡献分别是 max(0, ${rawL}) = ${lg}、max(0, ${rawR}) = ${rg}`
        : left
          ? `左贡献 max(0, ${rawL}) = ${lg}（${trunc(rawL, lg)}），右子树为空贡献 0`
          : right
            ? `右贡献 max(0, ${rawR}) = ${rg}（${trunc(rawR, rg)}），左子树为空贡献 0`
            : `两个贡献都是 max(0, 0) = 0` +
              (firstLeaf
                ? '——子树返回若为负数，这里同样会被截断成 0，父节点就不接这条分支'
                : '')

    const obs =
      left && right
        ? `观察：${val} 拿到左子树返回的 ${rawL} 与右子树返回的 ${rawR}，${cut}` +
          (rawL < 0 || rawR < 0 ? '，返回为负的那一侧被截断成 0。' : '，本例两侧返回都为正，没有发生截断。')
        : left || right
          ? `观察：${val} 只有一侧子树，${cut}。`
          : `观察：${val} 的左右子调用都命中空节点返回 0，${cut}。`

    const judge =
      `判断：拐点路径和 = ${val} + ${lg} + ${rg} = ${curPath}，` +
      (beat
        ? `大于当前 maxSum = ${fmtSum(prevMax)}，刷新为 ${curPath}，最优路径记为 ${pathOf}`
        : `没有超过 maxSum = ${fmtSum(prevMax)}，答案不变`) +
      '。'

    const act =
      `动作：向上返回 gain = ${val} + max(${lg}, ${rg}) = ${gain}` +
      (par ? ` 给父节点 ${VAL_OF[par]}。` : '，这是 dfs(root) 的返回值，遍历就此结束。')

    const why = par
      ? beat
        ? `为什么：gain 只能带单边向上，而 ${curPath} 是「以 ${val} 为拐点」的候选，只有拐点处才允许两侧同时相加。`
        : `为什么：拐点值与 gain 是两个不同的量——${curPath} 没能刷新答案，但 gain = ${gain} 仍要交给父节点 ${VAL_OF[par]} 供它的拐点值使用。`
      : beat
        ? `为什么：根这次自己就是最优拐点，最优路径 ${pathOf} 穿过它，dfs 结束。`
        : `为什么：路径不必经过根——最优的 ${pathOf} 落在子树内部，根只是又试了一个拐点，dfs 结束。`

    steps.push(snap('return', id, obs + judge + act + why))
    return gain
  }

  dfs(ROOT_ID)

  const finalPath = bestPath.map((b) => VAL_OF[b])
  /** 最优路径的拐点 = 路径上离根最近的节点（深度最小） */
  const pivot = bestPath.reduce((a, b) => (DEPTH_OF[a] <= DEPTH_OF[b] ? a : b), bestPath[0])
  steps.push(
    snap(
      'done',
      null,
      `观察：后序遍历结束，maxSum = ${fmtSum(maxSum)}，最优路径 ${finalPath.join(' → ')}。` +
        `判断：${finalPath.join(' + ')} = ${fmtSum(maxSum)}，正是节点 ${VAL_OF[pivot]} 处的拐点路径和，也与题解示例 2 的输出 42 一致。` +
        `动作：返回 maxSum = ${fmtSum(maxSum)}。` +
        `为什么：每个节点只被访问一次，时间 O(n)，递归栈最深等于树高 h，空间 O(h)；本例所有子树的 gain 都为正，max(0, ·) 一次也没真正截断，但 maxSum 从 −∞ 起步保证了整棵树全负时仍能返回最大的单节点值。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const nx = steps[i + 1]
    if (!nx) return
    if (nx.phase === 'done') {
      s.next = `输出后序遍历结束后的 maxSum = ${fmtSum(nx.maxSum)}`
      return
    }
    const id = nx.cur
    if (id === null) return
    if (nx.phase === 'enter') {
      if (s.cur === null) {
        s.next = `从根节点 dfs(${VAL_OF[id]}) 开始后序遍历`
      } else {
        const side =
          NODES[s.cur].left?.id === id ? '左' : NODES[s.cur].right?.id === id ? '右' : null
        s.next = side
          ? `递归进入${side}子树 dfs(${VAL_OF[id]})`
          : `子调用返回后继续递归进入 dfs(${VAL_OF[id]})`
      }
    } else {
      s.next = `汇总节点 ${VAL_OF[id]} 的左右贡献，算出 gain 与以它为拐点的路径和`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 300
const PAD_L = 60
const PAD_R = 60
const NODE_R = 22
const TOP = 84
const LEVEL_GAP = 74

type NodeState = 'current' | 'best' | 'computed' | 'stack' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  best: 'hsl(var(--easy-soft))',
  computed: 'hsl(var(--teal-soft))',
  stack: 'hsl(var(--paper))',
  idle: 'hsl(var(--paper))',
}

const STROKE: Record<NodeState, string> = {
  current: TONE.amber,
  best: TONE.easy,
  computed: TONE.teal,
  stack: TONE.medium,
  idle: TONE.muted,
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  best: 2.5,
  computed: 2.5,
  stack: 2,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: TONE.amber,
  best: TONE.easy,
  computed: TONE.teal,
  stack: 'hsl(var(--ink))',
  idle: 'hsl(var(--ink))',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const onBest = new Set(step.bestPath)
  const bestEdge = new Set<string>()
  step.bestPath.forEach((id, k) => {
    const nxt = step.bestPath[k + 1]
    if (nxt) bestEdge.add([id, nxt].sort().join('|'))
  })

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (onBest.has(id)) return 'best'
    if (id in step.gains) return 'computed'
    if (step.stack.includes(id)) return 'stack'
    return 'idle'
  }

  const curVal = step.cur === null ? null : VAL_OF[step.cur]
  /** done 步没有「当前节点」，此时展示 dfs(root) 交还的 gain，与答案 42 区分 */
  const curGain =
    step.phase === 'done'
      ? String(step.gains[ROOT_ID])
      : step.cur !== null && step.cur in step.gains
        ? String(step.gains[step.cur])
        : null

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：中心到中心，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const onPath = bestEdge.has([id, child.id].sort().join('|'))
              const st = stateOf(child.id)
              const color = onPath
                ? TONE.easy
                : st === 'current'
                  ? TONE.amber
                  : st === 'best' || st === 'computed'
                    ? TONE.teal
                    : 'hsl(var(--border))'
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={color}
                  strokeWidth={onPath ? 3.5 : st === 'current' ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 当前最优路径的外环：绿环在节点圆之下，不遮值 */}
        {ORDER.filter((id) => onBest.has(id)).map((id) => (
          <circle
            key={`ring-${id}`}
            cx={x(id)}
            cy={y(id)}
            r={NODE_R + 6}
            fill="none"
            stroke={TONE.easy}
            strokeWidth={2.5}
          />
        ))}

        {/* 3. 节点圆与值 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
                strokeDasharray={st === 'stack' ? '5 4' : undefined}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 4. 两种数值分别标注：上方 = 贡献给父节点的 gain，下方 = 以它为拐点的路径和 */}
        {ORDER.map((id) => (
          <g key={`num-${id}`}>
            {id in step.gains && (
              <text
                x={x(id)}
                y={y(id) - NODE_R - 9}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={TONE.teal}
              >
                贡献 {step.gains[id]}
              </text>
            )}
            {id in step.paths && (
              <text
                x={x(id)}
                y={y(id) + NODE_R + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={step.paths[id] === step.maxSum ? TONE.easy : 'hsl(var(--ink-soft))'}
              >
                拐点 {step.paths[id]}
              </text>
            )}
          </g>
        ))}

        {/* 5. 状态文字：不靠颜色也能区分节点状态 */}
        {step.cur !== null && (
          <text
            x={x(step.cur) + NODE_R + 8}
            y={y(step.cur) + 4}
            textAnchor="start"
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={TONE.amber}
          >
            {step.phase === 'return' ? '回溯' : '进入'}
          </text>
        )}
        {ORDER.filter((id) => stateOf(id) === 'stack').map((id) => (
          <text
            key={`stack-${id}`}
            x={x(id) + NODE_R + 8}
            y={y(id) + 4}
            textAnchor="start"
            fontSize="11"
            fontWeight="600"
            className="font-code"
            fill={TONE.medium}
          >
            栈中
          </text>
        ))}

        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          空节点不画在舞台上（贡献记为 0）；上 = 交还父节点的 gain，下 = 以它为拐点的路径和
        </text>
      </svg>

      {/* 递归调用栈（栈顶在右侧，另有文字标注） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">递归调用栈</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">
            {step.phase === 'done' ? '（已全部返回）' : '（空）'}
          </span>
        ) : (
          step.stack.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              {k > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={
                  k === step.stack.length - 1
                    ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                    : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                }
              >
                dfs({VAL_OF[id]})
              </span>
              {k === step.stack.length - 1 && (
                <span className="text-[10px] text-ink-soft">栈顶</span>
              )}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前节点" value={curVal ?? '—'} tone="amber" />
        <Stat label="它交还的 gain" value={curGain ?? '待算'} tone="teal" />
        <Stat label="最大路径和 maxSum" value={fmtSum(step.maxSum)} tone="easy" />
        {step.phase !== 'done' && step.next && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            最大路径和 = <b className="font-code">{fmtSum(step.maxSum)}</b>（路径{' '}
            <b className="font-code">{step.bestPath.map((id) => VAL_OF[id]).join(' → ')}</b>）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function BinaryTreeMaximumPathSumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="后序返回单边贡献，同时更新最大路径和"
      info={`root = ${INPUT_TEXT}（题解示例 2 的层序数组，null 为空节点；${ORDER.length} 个真实节点，共 ${steps.length} 步。示例 1 的 [1,2,3] 没有负值节点、最优路径又刚好经过根，代表性不如示例 2，所以这里用示例 2）。节点上方 teal 小字是「贡献给父节点的值」gain = val + max(0, 左gain, 右gain)，只能走单边；下方小字是「以该节点为拐点的路径和」= val + max(0, 左gain) + max(0, 右gain)，两侧可以同时取。负贡献一律截断为 0；本示例每个子树返回都为正，所以截断规则只在讲解里出现、没有真正触发。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前节点（进入 / 回溯）' },
        { color: TONE.medium, label: '递归中：已进入、子树未算完（虚线圆）' },
        { color: TONE.teal, label: '已算出 gain（上方 teal 小字）' },
        { color: TONE.easy, label: '当前最优路径（绿环 / 绿边 / 绿拐点值）' },
        { color: TONE.muted, label: '尚未访问' },
      ]}
    />
  )
}
