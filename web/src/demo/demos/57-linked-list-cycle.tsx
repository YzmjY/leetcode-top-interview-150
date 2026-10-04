import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 57. 环形链表 —— 模式 D：链表 + 快慢指针（Floyd 判圈 / 龟兔赛跑）       */
/* ------------------------------------------------------------------ */

/** 官方示例 1：尾节点 -4 的 next 回指下标 1，链表有环 */
const HEAD = [3, 2, 0, -4]
const POS = 1

/** 沿 next 走一步：尾节点回指 pos，其余指向下一个下标 */
function nextOf(i: number): number {
  return i === HEAD.length - 1 ? POS : i + 1
}

interface Step {
  /** 链表值的不可变快照 */
  values: number[]
  slow: number
  fast: number
  iter: number
  meet: boolean
  /** 本步被走过的边，编号 = 边起点下标；下标 n-1 即尾节点回边 */
  slowEdges: number[]
  fastEdges: number[]
  phase: 'init' | 'move' | 'meet' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = HEAD.length
  const tail = HEAD[n - 1]
  const steps: Step[] = []
  let slow = 0
  let fast = 0
  let iter = 0
  let met = false

  steps.push({
    values: HEAD.slice(),
    slow,
    fast,
    iter,
    meet: false,
    slowEdges: [],
    fastEdges: [],
    phase: 'init',
    note: `观察：head = [${HEAD.join(', ')}]、pos = ${POS}，尾节点 ${tail} 的 next 回指下标 ${POS}，所以链表里有环。动作：slow 与 fast 都从下标 0（头节点 ${HEAD[0]}）出发，slow 每轮走 1 步、fast 每轮走 2 步。为什么每轮先移动再比较：起点处 slow == fast == head，若先比较，任何非空链表都会被误判成有环。`,
  })

  while (iter < n) {
    const slowFrom = slow
    const fastFrom = fast
    const fastMid = nextOf(fastFrom)
    slow = nextOf(slowFrom)
    fast = nextOf(fastMid)
    iter += 1
    const meet = slow === fast
    const wraps = fastMid === n - 1

    if (meet) {
      met = true
      steps.push({
        values: HEAD.slice(),
        slow,
        fast,
        iter,
        meet: true,
        slowEdges: [slowFrom],
        fastEdges: [fastFrom, fastMid],
        phase: 'meet',
        note: `观察：slow 从下标 ${slowFrom} 前进一步到下标 ${slow}；fast 从下标 ${fastFrom} 走 2 步也落到同一个下标 ${slow}（值 ${HEAD[slow]}）。判断：slow == fast 比较的是两个指针是否指向同一个节点，而不是节点值是否相等，这才是有环的判据。动作：立即返回 true、不再继续走——fast 在环里追上了 slow。`,
      })
      break
    }

    steps.push({
      values: HEAD.slice(),
      slow,
      fast,
      iter,
      meet: false,
      slowEdges: [slowFrom],
      fastEdges: [fastFrom, fastMid],
      phase: 'move',
      note: `观察：slow 从下标 ${slowFrom} 走 1 步到下标 ${slow}（值 ${HEAD[slow]}）；fast 从下标 ${fastFrom} 走 2 步${wraps ? `，其中第 2 步从尾节点 ${tail} 经回边绕回` : ''}到下标 ${fast}（值 ${HEAD[fast]}）。判断：两个下标不相等，还没有相遇。动作：维持 1 步 / 2 步的节奏继续前进——正因为 fast 每轮只比 slow 多走 1 步，进入环后两者的距离每轮缩短 1，必然追上而不会跳过。`,
    })
  }

  steps.push({
    values: HEAD.slice(),
    slow,
    fast,
    iter,
    meet: met,
    slowEdges: [],
    fastEdges: [],
    phase: 'done',
    note: met
      ? `结论：slow 与 fast 在第 ${iter} 轮于下标 ${slow}（值 ${HEAD[slow]}）相遇，链表有环，返回 true。为什么必然相遇：进入环后以 slow 为参照，fast 每轮靠近 1 步，至多环长 L 轮后距离就归零。整个判定每轮只做常数次指针移动，时间 O(n)；全程只用了两个指针，额外空间 O(1)。`
      : `slow 与 fast 走满 ${n} 轮仍未落在同一节点上，按无环处理，返回 false。每轮 fast 走 2 步、slow 走 1 步，判定时间是 O(n)；全程只用了两个指针，额外空间 O(1)。本示例输入本身有环，因此走的是上面那个分支。`,
  })
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.values.length
  const backEdge = n - 1
  const backTraversed =
    step.slowEdges.includes(backEdge) || step.fastEdges.includes(backEdge)
  const walked = (edge: number) =>
    step.slowEdges.includes(edge) || step.fastEdges.includes(edge)

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 节点行：指针旗标在节点上方，下标在节点下方 */}
      <div className="flex flex-wrap items-start justify-center gap-y-2">
        {step.values.map((v, i) => {
          const isSlow = step.slow === i
          const isFast = step.fast === i
          const both = isSlow && isFast
          return (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className="mt-6 flex h-11 items-center">
                  <Link active={walked(i - 1)} />
                </div>
              )}
              <div className="flex flex-col items-center">
                <Flag
                  label={both ? 'slow·fast' : isSlow ? 'slow' : isFast ? 'fast' : undefined}
                  tone={step.meet && both ? 'easy' : isSlow ? 'amber' : 'teal'}
                />
                <Node
                  state={step.meet && both ? 'ok' : isSlow ? 'active' : isFast ? 'teal' : 'idle'}
                >
                  {v}
                </Node>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 环的回边（无法用直线表达，用一行文字说明；本步被走过时转为琥珀加粗） */}
      <Badge tone={backTraversed ? 'amber' : 'medium'} strong={backTraversed}>
        ↩ 节点 <b className="font-code">{step.values[backEdge]}</b> 的 next 指回下标{' '}
        <b className="font-code">{POS}</b>
      </Badge>

      <Badges className="justify-center">
        <Stat label="slow 下标" value={step.slow} tone="amber" />
        <Stat label="fast 下标" value={step.fast} tone="teal" />
        <Badge tone={step.meet ? 'easy' : 'plain'}>
          {step.meet ? (
            '✓ 已相遇'
          ) : (
            <>
              未相遇（第 <b className="font-code">{step.iter}</b> 轮）
            </>
          )}
        </Badge>
        {step.phase === 'done' ? (
          <Answer>
            有环，返回 <b className="font-code">true</b>
          </Answer>
        ) : step.phase === 'meet' ? (
          <Hint tone="easy">
            指针已相遇，停止并返回 <b className="font-code">true</b>
          </Hint>
        ) : step.phase === 'init' ? (
          <Hint>先移动再比较：slow 走 1 步、fast 走 2 步</Hint>
        ) : (
          <Hint>未相遇，继续：slow 走 1 步、fast 走 2 步</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function LinkedListCycleDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="快慢指针判圈（Floyd）"
      info={`head = [${HEAD.join(', ')}]、pos = ${POS}（尾节点 ${HEAD[HEAD.length - 1]} 的 next 指回下标 ${POS}）；slow 每轮走 1 步、fast 每轮走 2 步，判断链表是否有环。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'slow 指针（1 步/轮）· 加粗边为本步走过' },
        { color: TONE.teal, label: 'fast 指针（2 步/轮）' },
        { color: TONE.easy, label: '两指针相遇：判定有环' },
        { color: TONE.medium, label: '环的回边：尾节点指回 pos' },
      ]}
    />
  )
}
