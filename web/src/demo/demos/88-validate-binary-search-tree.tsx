import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 88. 验证二叉搜索树 —— 模式 E：树 + 递归传上下界（开区间）             */
/* validate(节点, 下界, 上界) 把祖先施加的值域约束一路往下传：           */
/* 往左走上界收窄为当前节点值，往右走下界提成当前节点值；越界即非 BST。  */
/* ------------------------------------------------------------------ */

/**
 * 固定示例输入：题解「先看一个陷阱」里那棵树（层序数组，null 为空节点）。
 * 它本身不是官方示例 1 / 2 —— 换用它的理由写在 info 里。
 */
const LEVELS: (number | null)[] = [10, 5, 15, null, null, 6]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

/** 开区间 (lo, hi)；null 表示无穷边界（对应题解里 nil 指针的写法） */
interface Bounds {
  lo: number | null
  hi: number | null
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
const PARENT_OF: Record<string, string | null> = {}
const SIDE_OF: Record<string, 'left' | 'right'> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []

function collect(
  node: TreeNode | null,
  depth: number,
  parent: string | null,
  side: 'left' | 'right' | null
) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  PARENT_OF[node.id] = parent
  if (side) SIDE_OF[node.id] = side
  collect(node.left, depth + 1, node.id, 'left')
  ORDER.push(node.id)
  collect(node.right, depth + 1, node.id, 'right')
}
collect(ROOT, 0, null, null)

function boundsText(b: Bounds): string {
  return `(${b.lo === null ? '-∞' : b.lo}, ${b.hi === null ? '+∞' : b.hi})`
}

/** 节点值是否严格落在开区间内：重复值非法，所以两侧都是严格比较 */
function inBounds(val: number, b: Bounds): boolean {
  return (b.lo === null || val > b.lo) && (b.hi === null || val < b.hi)
}

/** 只看父子会得出的结论：局部比较是否成立（根节点没有父节点，返回 null） */
function localPassOf(id: string): boolean | null {
  const parent = PARENT_OF[id]
  if (parent === null) return null
  return SIDE_OF[id] === 'left' ? VAL_OF[id] < VAL_OF[parent] : VAL_OF[id] > VAL_OF[parent]
}

function localPairTextOf(id: string): string {
  const parent = PARENT_OF[id]
  if (parent === null) return `根节点 ${VAL_OF[id]} 没有父节点`
  return `${VAL_OF[id]} ${SIDE_OF[id] === 'left' ? '<' : '>'} ${VAL_OF[parent]}`
}

/** 区间里的边界是哪来的：父节点传的，还是更远的祖先传的 */
function provenanceOf(id: string, lo: number | null, hi: number | null): string {
  const parent = PARENT_OF[id]
  const parentVal = parent === null ? null : VAL_OF[parent]
  const parts: string[] = []
  if (lo === null) parts.push('下界仍是 -∞')
  else if (parentVal === lo) parts.push(`下界 ${lo} 来自父节点 ${lo}`)
  else parts.push(`下界 ${lo} 来自祖先 ${lo}`)
  if (hi === null) parts.push('上界仍是 +∞')
  else if (parentVal === hi) parts.push(`上界 ${hi} 来自父节点 ${hi}`)
  else parts.push(`上界 ${hi} 来自祖先 ${hi}`)
  return parts.join('，')
}

/* ---------------- 步骤数据 ---------------- */

type Phase = 'init' | 'enter' | 'back' | 'ok' | 'fail' | 'unwind' | 'done'

interface Step {
  phase: Phase
  /** 本步正在处理的节点；init / done 为 null */
  cur: string | null
  /** 越界节点（根因）；失败之前为 null */
  failing: string | null
  /** 已收到区间的节点（不可变快照） */
  bounds: Record<string, Bounds>
  /** 已进入过递归的节点（不可变快照） */
  visited: string[]
  /** 已确认合法的子树根（不可变快照） */
  ok: string[]
  /** 已把 false 上传的祖先（不可变快照） */
  falsePath: string[]
  note: string
  /** 下一步动作，由后一个快照统一回填，保证与步骤数据一致 */
  hint: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const bounds: Record<string, Bounds> = {}
  const visited: string[] = []
  const okRoots: string[] = []
  const falsePath: string[] = []
  let failing: string | null = null

  const snap = (phase: Phase, cur: string | null, note: string): Step => ({
    phase,
    cur,
    failing,
    bounds: { ...bounds },
    visited: visited.slice(),
    ok: okRoots.slice(),
    falsePath: falsePath.slice(),
    note,
    hint: '',
  })

  /** 「只比父子」在本题中的结论：局部比较成立与否 */
  const localNote = (id: string): string => {
    const parent = PARENT_OF[id]
    if (parent === null) return '它是根节点，没有任何父子比较可以依赖'
    const pass = localPassOf(id)
    return `它与父节点 ${VAL_OF[parent]} 的局部比较 ${localPairTextOf(id)} ${pass ? '是成立的' : '并不成立'}`
  }

  steps.push(
    snap(
      'init',
      null,
      `观察：输入 root = ${INPUT_TEXT}，10 是根，5 是左孩子，15 是右孩子，6 是 15 的左孩子。` +
        `判断：BST 要求整棵子树落在祖先传下来的开区间里，根节点没有任何限制，区间就是 (-∞, +∞)。` +
        `动作：调用 validate(10, -∞, +∞)，往左走把上界收窄成当前节点值，往右走把下界提成当前节点值。` +
        `为什么：约束来自全部祖先而不只是父节点，只比父子会漏判。`
    )
  )

  function validate(id: string, lo: number | null, hi: number | null): boolean {
    const node = NODES[id]
    const val = node.val
    const parentId = PARENT_OF[id]
    const b: Bounds = { lo, hi }
    const bTxt = boundsText(b)
    bounds[id] = b
    visited.push(id)

    const kids =
      node.left && node.right
        ? `左孩子是 ${node.left.val}、右孩子是 ${node.right.val}`
        : node.left
          ? `左孩子是 ${node.left.val}，没有右孩子`
          : node.right
            ? `没有左孩子，右孩子是 ${node.right.val}`
            : '左右孩子都是空节点'
    const move =
      node.left && node.right
        ? `先检查 ${val} 是否落在区间内，通过后递归左子树（上界收窄为 ${val}），左子树通过再处理右子树（下界提为 ${val}）`
        : node.left
          ? `先检查 ${val} 是否落在区间内，通过后递归左子树，把上界收窄为 ${val}`
          : node.right
            ? `先检查 ${val} 是否落在区间内，通过后递归右子树，把下界提为 ${val}`
            : `先检查 ${val} 是否落在区间内，通过后左右子树都为空，直接确认这棵子树合法`

    steps.push(
      snap(
        'enter',
        id,
        `观察：进入 validate(${val}, ${lo === null ? '-∞' : lo}, ${hi === null ? '+∞' : hi})，${val} 收到的开区间是 ${bTxt}（${provenanceOf(id, lo, hi)}）。` +
          `判断：${localNote(id)}；${kids}。` +
          `动作：${move}。` +
          `为什么：节点值必须落在整个区间内，局部父子比较通过并不代表子树合法。`
      )
    )

    const causeTxt = (): string =>
      failing === null ? '子树中有节点越界' : `子树中的 ${VAL_OF[failing]} 越界`
    const upTo = (): string => (parentId === null ? '上层调用' : `父节点 ${VAL_OF[parentId]}`)

    if (lo !== null && val <= lo) {
      failing = id
      steps.push(
        snap(
          'fail',
          id,
          `观察：${val} <= 下界 ${lo}，所以 ${val} 不在区间 ${bTxt} 内。` +
            `判断：${val} 位于祖先 ${lo} 的右子树里，右子树的每个值都必须严格大于 ${lo}；${localNote(id)}，整棵树不是 BST。` +
            `动作：立即返回 false，不再检查它的子树。` +
            `为什么：区间是祖先一路收紧下来的结果，只看父子就会把这个越界节点放过去。`
        )
      )
      return false
    }
    if (hi !== null && val >= hi) {
      failing = id
      steps.push(
        snap(
          'fail',
          id,
          `观察：${val} >= 上界 ${hi}，所以 ${val} 不在区间 ${bTxt} 内。` +
            `判断：${val} 位于祖先 ${hi} 的左子树里，左子树的每个值都必须严格小于 ${hi}；${localNote(id)}，整棵树不是 BST。` +
            `动作：立即返回 false，不再检查它的子树。` +
            `为什么：区间是祖先一路收紧下来的结果，只看父子就会把这个越界节点放过去。`
        )
      )
      return false
    }

    const left = node.left
    if (left) {
      if (!validate(left.id, lo, val)) {
        falsePath.push(id)
        steps.push(
          snap(
            'unwind',
            id,
            `观察：左孩子 ${left.val} 返回 false，回到节点 ${val}。` +
              `判断：${causeTxt()}，以 ${val} 为根的子树同样不是 BST。` +
              `动作：把 false 继续上传给${upTo()}，不再检查其它分支。` +
              `为什么：一旦某个后代越界，包含它的每一棵祖先子树都必然失败。`
          )
        )
        return false
      }
      if (node.right) {
        steps.push(
          snap(
            'back',
            id,
            `观察：左子树 ${left.val} 返回 true，回到节点 ${val}，它的右子树还没有检查。` +
              `判断：${val} 自身已经通过区间 ${bTxt} 的检查，左半边合法。` +
              `动作：转向右子树，把下界提成 ${val}，即 validate(${node.right.val}, ${val}, ${hi === null ? '+∞' : hi})。` +
              `为什么：右子树里的每个值都必须严格大于 ${val}，下界就是这条约束的载体。`
          )
        )
      }
    }

    const right = node.right
    if (right) {
      if (!validate(right.id, val, hi)) {
        falsePath.push(id)
        steps.push(
          snap(
            'unwind',
            id,
            `观察：右孩子 ${right.val} 返回 false，回到节点 ${val}。` +
              `判断：${causeTxt()}，以 ${val} 为根的子树同样不是 BST。` +
              `动作：把 false 继续上传给${upTo()}，不再检查其它分支。` +
              `为什么：一旦某个后代越界，包含它的每一棵祖先子树都必然失败。`
          )
        )
        return false
      }
    }

    okRoots.push(id)
    steps.push(
      snap(
        'ok',
        id,
        `观察：${val} 落在区间 ${bTxt} 内，${node.left || node.right ? '两棵子树也都确认合法' : '左右子树都是空节点'}。` +
          `判断：以 ${val} 为根的子树整体落在 ${bTxt} 内，是一棵合法 BST。` +
          `动作：返回 true 给${upTo()}。` +
          `为什么：只有子树自身合法、并且全部值都落在区间内，父节点才允许相信它。`
      )
    )
    return true
  }

  const answer = validate(ROOT_ID, null, null)

  const badId = failing
  const badJudge =
    badId === null
      ? '所有节点都落在各自收到的区间内，整棵树是 BST。'
      : `越界的是节点 ${VAL_OF[badId]}：它收到的区间是 ${boundsText(bounds[badId])}，却不落在其中；` +
        (localPassOf(badId)
          ? `而它与父节点的局部比较 ${localPairTextOf(badId)} 是成立的，只比父子会漏判。`
          : `它与父节点的局部比较 ${localPairTextOf(badId)} 同样不成立。`)

  steps.push(
    snap(
      'done',
      null,
      `观察：递归结束，validate(${VAL_OF[ROOT_ID]}, -∞, +∞) 返回 ${answer}。` +
        `判断：${badJudge}` +
        `动作：答案 = ${answer}${answer ? '，整棵树是合法的二叉搜索树。' : '，这棵树不是二叉搜索树。'}` +
        `为什么：每个节点只被访问一次，时间 O(n)；递归栈深度最大为树高 h，空间 O(h)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const id = b.cur
    switch (b.phase) {
      case 'enter':
        s.hint = id === null ? '' : `进入节点 ${VAL_OF[id]}，检查它是否落在 ${boundsText(b.bounds[id])} 内`
        break
      case 'back':
        s.hint = id === null ? '' : `${VAL_OF[id]} 的左子树已通过，接着递归它的右子树`
        break
      case 'ok':
        s.hint = id === null ? '' : `确认 ${VAL_OF[id]} 这棵子树合法并返回 true`
        break
      case 'fail':
        s.hint = id === null ? '' : `检查区间：${VAL_OF[id]} 是否落在 ${boundsText(b.bounds[id])} 内`
        break
      case 'unwind':
        s.hint = id === null ? '' : `把 false 上传给父节点 ${VAL_OF[id]}`
        break
      case 'done':
        s.hint = '整棵树已判定，读出结论'
        break
      default:
        break
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 560
const H = 272
const PAD_L = 70
const PAD_R = 70
const NODE_R = 22
const TOP = 62
const LEVEL_GAP = 78

type NodeState = 'current' | 'ok' | 'bad' | 'path' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  ok: 'hsl(var(--easy-soft))',
  bad: 'hsl(var(--hard-soft))',
  path: 'hsl(var(--medium-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  ok: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  path: 'hsl(var(--medium))',
  idle: 'hsl(var(--border))',
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  ok: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  path: 'hsl(var(--medium))',
  idle: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (id === step.failing) return 'bad'
    if (id === step.cur && (step.phase === 'enter' || step.phase === 'back' || step.phase === 'unwind'))
      return 'current'
    if (step.ok.includes(id)) return 'ok'
    if (step.visited.includes(id)) return 'path'
    return 'idle'
  }

  /** 状态文字：状态不靠颜色单独区分 */
  const stateLabelOf = (id: string, st: NodeState): string => {
    if (st === 'current')
      return step.phase === 'enter' ? '本步进入' : step.phase === 'back' ? '左子树通过' : '收到 false'
    if (st === 'ok') return '子树合法'
    if (st === 'bad') return '越界'
    if (st === 'path') return step.falsePath.includes(id) ? '子树 false' : '区间已传'
    return ''
  }

  const done = step.phase === 'done'
  const curId = step.cur
  /** 讲解「只比父子 vs 区间」用的焦点节点：失败之后固定为越界节点（本步的结论所在） */
  const focusId = step.failing ?? curId
  const focusBounds = focusId === null ? null : step.bounds[focusId]
  const focusLocalPass = focusId === null ? null : localPassOf(focusId)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const st = stateOf(child.id)
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={STROKE[st]}
                  strokeWidth={st === 'current' || st === 'bad' ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 节点圆 */}
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
                strokeWidth={st === 'current' || st === 'bad' ? 3 : 2.5}
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

        {/* 3. 标签：上方是本步状态文字，下方是这个节点必须满足的开区间 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const label = stateLabelOf(id, st)
          const b = step.bounds[id]
          return (
            <g key={`label-${id}`}>
              {label && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 9}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={STROKE[st]}
                >
                  {label}
                </text>
              )}
              {b && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={VALUE_FILL[st]}
                >
                  {boundsText(b)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <p className="text-center text-[11px] leading-relaxed text-ink-soft">
        节点下方的等宽小字是它从祖先收到的开区间（下界, 上界），节点上方的文字是本步状态。
      </p>

      <Badges className="justify-center">
        <Stat label="当前节点" value={curId === null ? '—' : VAL_OF[curId]} tone="amber" />
        <Stat
          label="收到的区间"
          value={curId === null ? '—' : boundsText(step.bounds[curId])}
          tone="teal"
        />
        {focusId !== null && focusBounds !== null && (
          <Badge tone={focusId === step.failing ? 'hard' : 'teal'}>
            节点 <b className="font-code">{VAL_OF[focusId]}</b>
            {' 只比父子：'}
            <b className="font-code">{localPairTextOf(focusId)}</b>
            {focusLocalPass === null
              ? '（根节点没有父节点）'
              : focusLocalPass
                ? ' ✓ 通过'
                : ' ✗ 不通过'}
            {' · 区间：'}
            <b className="font-code">
              {`${VAL_OF[focusId]} ${inBounds(VAL_OF[focusId], focusBounds) ? '∈' : '∉'} ${boundsText(focusBounds)}`}
            </b>
            {inBounds(VAL_OF[focusId], focusBounds) ? ' ✓' : ' ✗ 越界'}
          </Badge>
        )}
        {!done && step.hint && <Hint>{step.hint}</Hint>}
        {done && (
          <Answer>
            {step.failing === null ? (
              <>这棵树是 BST</>
            ) : (
              <>
                不是 BST：节点 <b className="font-code">{VAL_OF[step.failing]}</b> ∉{' '}
                <b className="font-code">{boundsText(step.bounds[step.failing])}</b>
                ，只比父子会漏判
              </>
            )}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ValidateBinarySearchTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="递归传上下界：每个节点都要落在祖先给的区间里"
      info={`输入：root = ${INPUT_TEXT}（层序数组，null 为空节点）—— 取自题解「先看一个陷阱」里那棵树，不是官方示例 1 / 2。换用它的原因：它的每一对父子比较都成立（10 > 5、10 < 15、6 < 15），整棵树却是非法的；官方示例 2 [5,1,4,null,null,3,6] 会在节点 4 处被父子比较直接拦下，看不到区间收窄的作用。完整跑完这个输入共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步处理的节点（上方文字标出进入 / 收到 false）' },
        { color: TONE.medium, label: '递归路径上：区间已传入，子树待定或已返回 false' },
        { color: TONE.easy, label: '整棵子树已确认落在区间内' },
        { color: TONE.hard, label: '越界节点 → 整棵树不是 BST' },
        { color: TONE.muted, label: '尚未访问，还没收到区间' },
      ]}
    />
  )
}
