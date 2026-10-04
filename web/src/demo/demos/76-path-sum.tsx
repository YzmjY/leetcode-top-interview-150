import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 76. 路径总和 —— 模式 E：树 + 自顶向下 DFS（边走边扣剩余目标）          */
/* ------------------------------------------------------------------ */

/** 官方示例 1：层序数组，null 表示该位置没有节点；targetSum = 22，输出 true */
const LEVELS: (number | null)[] = [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]
const TARGET = 22
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(',')}]`

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

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

const ROOT = buildTree(LEVELS, 0, 'R') as TreeNode

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  collect(node.left, depth + 1)
  ORDER.push(node.id)
  collect(node.right, depth + 1)
}
collect(ROOT, 0)

/** 题解示例 1 的答案路径：5 → 4 → 11 → 2，和为 22（节点 id，从根到目标叶子） */
const ANSWER_PATH: string[] = []
{
  const stack: string[] = []
  const walk = (node: TreeNode | null, remain: number): boolean => {
    if (!node) return false
    stack.push(node.id)
    const next = remain - node.val
    if (!node.left && !node.right) {
      if (next === 0) {
        ANSWER_PATH.push(...stack)
        return true
      }
    } else {
      for (const child of [node.left, node.right]) {
        if (walk(child, next)) return true
      }
    }
    stack.pop()
    return false
  }
  walk(ROOT, TARGET)
}
/** 去重后的答案路径节点 id（从根到目标叶子） */
const FOUND_IDS = Array.from(new Set(ANSWER_PATH))

/** 只用于给 Hint 生成「下一步动作」文字，不参与渲染 */
function childLabel(child: TreeNode | null): string {
  return child ? `dfs(${child.val})` : '空分支'
}

interface Step {
  phase: 'init' | 'enter' | 'leaf' | 'propagate' | 'done'
  /** 本步正在处理的节点 id；done 为 null */
  cur: string | null
  /** 根到当前节点的节点 id（不可变快照，根在首位） */
  path: string[]
  /** 当前节点的剩余目标 remain = targetSum − 路径上已走过的节点值之和 */
  remain: number
  /** 已走路径的和 = targetSum − remain */
  sum: number
  /** 本步判定为「走不通」的叶子 id */
  failedLeaf: string | null
  /** 命中目标和时整条路径转为绿的那一步 */
  hit: boolean
  note: string
  /** 下一步动作（最后按后一个快照统一回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []

  const snap = (s: Omit<Step, 'next'>): Step => {
    steps.push({
      ...s,
      path: s.path.slice(),
      next: '',
    })
    return steps[steps.length - 1]
  }

  function dfs(id: string, path: string[]): boolean {
    const node = NODES[id]
    const { val, left, right } = node
    const p = path.concat(id)
    const remain = TARGET - p.reduce((acc, n) => acc + VAL_OF[n], 0)
    const walk = p.map((n) => VAL_OF[n]).join(' → ')

    if (!left && !right) {
      const ok = remain === 0
      snap({
        phase: 'leaf',
        cur: id,
        path: p,
        remain,
        sum: TARGET - remain,
        failedLeaf: ok ? null : id,
        hit: ok,
        note: ok
          ? `观察：节点 ${val} 没有子节点，是叶子，路径 ${walk} 的和恰为 ${TARGET}，remain = 0。判断：叶子上的唯一路径就是这条，已经命中目标和。动作：返回 true，并把这条路径标成绿色。为什么：目标只在叶子处结算，中途的 remain 为 0 不能算命中。`
          : `观察：节点 ${val} 没有子节点，是叶子，路径 ${walk} 的和为 ${TARGET - remain}，remain = ${remain}。判断：叶子就是这条路径的终点，和与目标不等，这条路走不通。动作：返回 false，撤销 ${val} 的高亮并回溯到父节点 ${VAL_OF[id.slice(0, -1)]}。为什么：继续往下没有节点可走，remain 不为 0 只能否掉整条路径。`,
      })
      return ok
    }

    snap({
      phase: 'enter',
      cur: id,
      path: p,
      remain,
      sum: TARGET - remain,
      failedLeaf: null,
      hit: false,
      note: `观察：进入节点 ${val}，它${left && right ? `左孩子是 ${left.val}、右孩子是 ${right.val}` : left ? `只有左孩子 ${left.val}` : `只有右孩子 ${right!.val}`}，路径和累加到 ${TARGET - remain}。判断：${
        left && right ? `还要继续往下走，remain = ${remain} 交给两个孩子分别验证` : `还要继续往下走，remain = ${remain} 交给唯一的孩子验证`
      }。动作：先把 ${val} 放进当前路径（琥珀色链），再带着 remain = ${remain} 递归下一个节点。为什么：任何根到叶路径都必然经过当前节点，所以「当前路径」在递归期间必须保持完整。`,
    })

    for (const child of [left, right]) {
      if (!child) continue
      if (dfs(child.id, p)) return true
      snap({
        phase: 'propagate',
        cur: id,
        path: p,
        remain,
        sum: TARGET - remain,
        failedLeaf: null,
        hit: false,
        note: `观察：子树 dfs(${child.val}) 返回 false，节点 ${val} 这一侧没有任何剩余目标为 0 的叶子。判断：还有${child === left && right ? `右孩子 ${right.val}` : '其他分支'}没有试过，${val} 暂时不返回。动作：撤销子树上失败分支的高亮，回到节点 ${val} 继续下一分支。为什么：代码是 hasPathSum(left) || hasPathSum(right)，一边不成立不能直接否掉整个节点。`,
      })
    }

    return false
  }

  snap({
    phase: 'init',
    cur: ROOT.id,
    path: [ROOT.id],
    remain: TARGET,
    sum: 0,
    failedLeaf: null,
    hit: false,
    note: `观察：输入 root = ${INPUT_TEXT}（层序表示，null 为空节点），targetSum = ${TARGET}。判断：路径必须从根走到叶子，所以自顶向下传递「剩余目标」remain，根节点处 remain = ${TARGET}。动作：带着 remain = ${TARGET} 进入根节点 ${ROOT.val}，每往下走一层就减去该节点的值。为什么：走到叶子时只要 remain 恰好为 0，这条根到叶路径的和就等于 targetSum，不必额外记录路径和；注意 remain 中途为 0 时不能提前返回 true，节点值可能为负，也不能因为 remain 变小就剪枝。`,
  })

  const found = dfs(ROOT.id, [])

  const answerVals = FOUND_IDS.map((n) => VAL_OF[n]).join(' → ')
  const answerSum = FOUND_IDS.reduce((acc, n) => acc + VAL_OF[n], 0)

  snap({
    phase: 'done',
    cur: null,
    path: FOUND_IDS,
    remain: 0,
    sum: answerSum,
    failedLeaf: null,
    hit: true,
    note: found
      ? `观察：DFS 在叶子 ${VAL_OF[FOUND_IDS[FOUND_IDS.length - 1]]} 命中，随后 true 沿 ${FOUND_IDS.slice(0, -1).reverse().map((n) => VAL_OF[n]).join(' → ')} 逐层上传到根节点。判断：存在根到叶路径 ${answerVals}，和为 ${answerSum} = targetSum，所以 hasPathSum = true。动作：答案为真，读出来就是这条路径 ${answerVals}；对照示例 [1,2,3] 配 targetSum = 5 时两条路径和为 3、4，都会返回 false。为什么：每个节点最多访问一次，时间 O(n)；递归栈最深为树高 h，最坏 O(n)、平均 O(log n)，空间 O(h)。`
      : `观察：DFS 走完全部根到叶路径，没有任何一条的和等于 ${TARGET}，也没有在非叶节点处提前返回。判断：hasPathSum = false，空树同样为 false（即使 targetSum = 0）。动作：输出结论。为什么：每个节点最多访问一次，时间 O(n)；递归栈最深为树高 h，空间 O(h)。`,
  })

  // 「下一步动作」由后一个快照统一回填，保证 Hint 一定描述真正的下一步
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '输出结论（路径已确定）'
      return
    }
    const bNode = b.cur ? NODES[b.cur] : null
    const bVal = b.cur ? VAL_OF[b.cur] : 0
    const bLeaf = bNode ? !bNode.left && !bNode.right : false

    if (s.phase === 'init') {
      s.next = `进入根节点 ${ROOT.val}，减去节点值后 remain = ${b.remain}`
      return
    }
    if (b.phase === 'enter') {
      s.next = `带着 remain = ${b.remain} 递归 ${childLabel(bNode)}`
      return
    }
    if (b.phase === 'leaf') {
      s.next = bLeaf && b.remain === 0
        ? `把叶子 ${bVal} 的路径判定为命中，返回 true`
        : `把叶子 ${bVal} 的 remain = ${b.remain} 与 0 比较后返回`
      return
    }
    if (b.phase === 'propagate') {
      s.next = `子树不成立，撤销失败分支并${bNode && bNode.left && bNode.right ? `改试 ${bNode.right.val} 这一侧` : `回溯到 ${bVal}`}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 540
const H = 328
const PAD_L = 50
const PAD_R = 50
const NODE_R = 20
const TOP = 50
const LEVEL_GAP = 74

type NodeState = 'current' | 'path' | 'found' | 'failed' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  path: 'hsl(var(--amber-soft))',
  found: 'hsl(var(--easy-soft))',
  failed: 'hsl(var(--paper))',
  // 与 TONE.muted 数值一致（hsl(var(--ink) / 0.18)），保证图例「未访问」与画面同色
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  path: 'hsl(var(--amber))',
  found: 'hsl(var(--easy))',
  failed: 'hsl(var(--hard))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  path: 2.5,
  found: 3,
  failed: 2.5,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  path: 'hsl(var(--ink))',
  found: 'hsl(var(--easy))',
  failed: 'hsl(var(--hard))',
  idle: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const pathIds = done ? FOUND_IDS : step.path
  const onPath = (id: string) => pathIds.includes(id)

  const stateOf = (id: string): NodeState => {
    if (step.failedLeaf === id) return 'failed'
    if (done && onPath(id)) return 'found'
    if (id === step.cur) return 'current'
    if (onPath(id)) return 'path'
    return 'idle'
  }

  const curVal = step.cur ? VAL_OF[step.cur] : null
  const pathVals = pathIds.map((id) => VAL_OF[id]).join(' → ')

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const active = done ? onPath(child.id) && onPath(id) : step.path.includes(child.id)
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={
                    active
                      ? done
                        ? 'hsl(var(--easy))'
                        : 'hsl(var(--amber))'
                      : 'hsl(var(--border))'
                  }
                  strokeWidth={active ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 节点圆 + 值 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const shadowed = step.hit && onPath(id)
          return (
            <g key={id}>
              {shadowed && (
                <circle
                  cx={x(id)}
                  cy={y(id)}
                  r={NODE_R + 6}
                  fill="none"
                  stroke={st === 'found' ? 'hsl(var(--easy))' : 'hsl(var(--amber))'}
                  strokeWidth={2}
                  opacity={0.45}
                />
              )}
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
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 3. 文字标签：路径标记、命中标记、死路标记（状态不靠颜色单独区分） */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const failed = st === 'failed'
          const found = st === 'found'
          return (
            <g key={`label-${id}`}>
              {onPath(id) && (
                <text
                  x={x(id) - NODE_R - 6}
                  y={y(id) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  className="font-code"
                  fill={done ? 'hsl(var(--easy))' : 'hsl(var(--amber))'}
                >
                  路径
                </text>
              )}
              {failed && (
                <text
                  x={x(id) + NODE_R + 6}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--hard))"
                >
                  死路
                </text>
              )}
              {found && (
                <text
                  x={x(id) + NODE_R + 6}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--easy))"
                >
                  ✓
                </text>
              )}
            </g>
          )
        })}

        {/* 4. 说明：空节点不占舞台位置 */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          空节点不画在舞台上，走到空分支直接返回 false
        </text>
      </svg>

      {/* 当前递归路径（根 → 当前节点） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">当前路径</span>
        {pathIds.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          pathIds.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              {k > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={
                  id === step.cur
                    ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                    : done
                      ? 'rounded-md border border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--easy))]'
                      : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                }
              >
                {VAL_OF[id]}
              </span>
              {id === step.cur && <span className="text-[10px] text-ink-soft">当前</span>}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前节点" value={curVal ?? '—'} tone="amber" />
        <Stat label="剩余目标 remain" value={done ? 0 : step.remain} tone="teal" />
        <Stat label="路径和" value={step.sum} tone="easy" />
        {step.failedLeaf && <Badge tone="hard">死路叶子</Badge>}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            存在路径 <b className="font-code">{pathVals}</b>，和{' '}
            <b className="font-code">{step.sum}</b> = targetSum，返回{' '}
            <b className="font-code">true</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function PathSumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="自顶向下 DFS：边走边扣剩余目标"
      info={`root = ${INPUT_TEXT}（层序表示，null 为空节点），targetSum = ${TARGET}，取自题解示例 1，答案应为 true（路径 5 → 4 → 11 → 2）。演示只保留 DFS 实际访问到的节点，空分支不画在舞台上。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前路径上的节点（琥珀链）' },
        { color: TONE.easy, label: '命中 targetSum 的路径 / 叶子' },
        { color: TONE.hard, label: '走不通的叶子（死路，已回溯）' },
        { color: TONE.muted, label: '尚未访问或已排除的节点' },
      ]}
    />
  )
}
