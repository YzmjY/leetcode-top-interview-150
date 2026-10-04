import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 60. 随机链表的复制 —— 模式 D：两行链表 + old2New 哈希表，两遍建图       */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：head = [[7,null],[13,0],[11,4],[10,2],[1,0]] */
const VALS = [7, 13, 11, 10, 1]
/** 每个节点的 random 指向的下标；null 表示 random 为空 */
const RANDOM: (number | null)[] = [null, 0, 4, 2, 0]
const N = VALS.length

interface Step {
  /** 第一遍已建好的新节点数（下标 < created 的副本已存在并已登记映射） */
  created: number
  /** 第二遍已接好 next 与 random 的新节点数 */
  linked: number
  /** 本步处理的节点下标；init / done 为 -1 */
  cur: number
  phase: 'init' | 'create' | 'link' | 'done'
  note: string
  /** 真正的下一步动作，由后一个快照统一回填 */
  hint: string
  hintTone: 'amber' | 'teal' | 'easy'
}

/** 用真实算法跑一遍 INPUT（示例 1），每轮 push 一个不可变快照 */
function buildSteps(): Step[] {
  const steps: Step[] = []
  const push = (s: Omit<Step, 'hint' | 'hintTone'>) => {
    steps.push({ ...s, hint: '', hintTone: 'teal' as const })
  }

  // ── init ──
  push({
    created: 0,
    linked: 0,
    cur: -1,
    phase: 'init',
    note: `观察：head = [[7,null],[13,0],[11,4],[10,2],[1,0]] 共 n = ${N} 个节点，各节点的 random 依次指向 null、原 #0、原 #4、原 #2、原 #0。判断：原 #2 的 random 指向更靠后的 原 #4，若一边遍历一边连 random，目标副本这时还不存在，所以一趟做不完。动作：old2New 先留空，cur 从 原 #0 开始第一遍遍历，只新建节点并登记映射。为什么：只要 ${N} 个新节点全部建齐，第二遍设置任何指针时目标副本一定已经存在，查表即可命中。`,
  })

  // ── 第一遍：只建节点 + 记映射 ──
  for (let j = 0; j < N; j++) {
    const v = VALS[j]
    const rd = RANDOM[j]
    push({
      created: j + 1,
      linked: 0,
      cur: j,
      phase: 'create',
      note: `观察：第一遍第 ${j + 1} 次，cur 落在 原 #${j}（值 ${v}），它的 random 指向 ${rd === null ? '空节点 null' : `原 #${rd}（值 ${VALS[rd]}）`}。判断：这一轮只备节点、不连指针，新节点的 next 与 random 都先留空。动作：新建 新 #${j}（值 ${v}），登记映射 原 #${j} → 新 #${j}。为什么：${
        j === N - 1
          ? `至此 ${N} 个新节点全部建齐，old2New 的键集合就是整条原链表的节点集合，第二遍查表必然命中`
          : 'random 可能指向后面的节点，必须先把全部新节点备齐，第二遍连 random 才不会指向还不存在的副本'
      }。`,
    })
  }

  // ── 第二遍：按映射接 next 与 random ──
  for (let j = 0; j < N; j++) {
    const rd = RANDOM[j]
    const nextDesc =
      j + 1 < N
        ? `原 #${j + 1} 的副本 新 #${j + 1}`
        : `nil（原 #${j} 已是尾节点，old2New[nil] 返回 nil）`
    const randDesc =
      rd === null
        ? `nil（原 #${j} 的 random 为空，old2New[nil] 同样返回 nil）`
        : `原 #${rd} 的副本 新 #${rd}`
    push({
      created: N,
      linked: j + 1,
      cur: j,
      phase: 'link',
      note: `观察：第二遍第 ${j + 1} 次，cur = 原 #${j}（值 ${VALS[j]}），取它的副本 newNode = 新 #${j}，此时副本的 next 与 random 还都是空的。判断：next 要接的是 ${nextDesc}，random 要接的是 ${randDesc}，两个目标在第一遍都已建好。动作：把 新 #${j} 的 next 与 random 分别指向这两个副本，两个取值都来自 old2New 查表。为什么：节点值只从原节点拷贝一次，指针又都经过 old2New 换算，所以新链表与原链表结构同构，且不可能指回原链表。`,
    })
  }

  // ── done：总结 ──
  push({
    created: N,
    linked: N,
    cur: -1,
    phase: 'done',
    note: `观察：两遍遍历都走完了 ${N} 个节点，old2New 里的 ${N} 条映射全部生效。判断：新链表沿 next 读出 7 → 13 → 11 → 10 → 1，random 依次指向 null、新 #0、新 #4、新 #2、新 #0，与原链表的指向完全同构。动作：返回 old2New[原 #0]，也就是 新 #0——不是原 head，也不是别的节点。为什么：每个节点在每遍中恰好被处理一次，哈希表的插入与查询均摊 O(1)，时间 O(n)；哈希表存 n 条映射，额外空间 O(n)。`,
  })

  // 「下一步动作」一律取自后一个快照，确保 Hint 说的是真正还没做的事
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'create') {
      s.hint = `为 原 #${b.cur} 新建副本 新 #${b.cur}，并登记映射 原 #${b.cur} → 新 #${b.cur}`
      s.hintTone = 'teal'
    } else if (b.phase === 'link') {
      s.hint =
        b.cur === 0
          ? `第一遍已建齐 ${N} 个新节点，进入第二遍：为 新 #0 接 next 与 random`
          : `为 新 #${b.cur} 接 next 与 random`
      s.hintTone = 'amber'
    } else if (b.phase === 'done') {
      s.hint = '两遍都已完成，返回 新 #0 作为复制链表的头'
      s.hintTone = 'easy'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** random 跨行时无法画成直线，照题 57 处理回边的做法：用一行文字说明它指向哪个下标 */
function RandomNote({ step }: { step: Step }) {
  if (step.phase === 'done') {
    return (
      <>
        {'↩ '}
        <b className="font-code">{N}</b>
        {' 条 random 依次指向 null、'}
        <b className="font-code">新 #0</b>
        {'、'}
        <b className="font-code">新 #4</b>
        {'、'}
        <b className="font-code">新 #2</b>
        {'、'}
        <b className="font-code">新 #0</b>
        {'，与原链表一一对应'}
      </>
    )
  }

  if (step.cur < 0) {
    return (
      <>
        {'↩ 原 #'}
        <b className="font-code">2</b>
        {' 的 random 指向更靠后的 原 #'}
        <b className="font-code">4</b>
        {'，所以第一遍要先把 '}
        <b className="font-code">{N}</b>
        {' 个新节点全部建齐'}
      </>
    )
  }

  const rd = RANDOM[step.cur]

  if (step.phase === 'create') {
    return (
      <>
        {'↩ 原 #'}
        <b className="font-code">{step.cur}</b>
        {' 的 random → '}
        {rd === null ? (
          'null（不指向任何节点）'
        ) : (
          <>
            {'原 #'}
            <b className="font-code">{rd}</b>
            {'（值 '}
            <b className="font-code">{VALS[rd]}</b>
            {'）'}
          </>
        )}
        {'，它的副本这一步还没建，先只登记映射'}
      </>
    )
  }

  return (
    <>
      {'↩ 新 #'}
      <b className="font-code">{step.cur}</b>
      {' 的 random → '}
      {rd === null ? (
        'null：原节点的 random 为空，查表取不到这一项，新节点也是空指针'
      ) : (
        <>
          {'新 #'}
          <b className="font-code">{rd}</b>
          {'：查哈希表里 原 #'}
          <b className="font-code">{rd}</b>
          {' 那一条映射，取到的正是它的副本'}
        </>
      )}
    </>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const cur = done ? -1 : step.cur

  /** 副本节点状态：未建 dim / 已建映射 teal / 本步处理 active / 两指针已连 ok */
  const copyState = (j: number): 'idle' | 'active' | 'teal' | 'ok' | 'dim' => {
    if (done) return 'ok'
    if (step.phase === 'link' && j === cur) return 'active'
    if (j < step.linked) return 'ok'
    if (j < step.created) return 'teal'
    return 'dim'
  }

  /** 与颜色配套的文字标签，保证不靠颜色也能读懂状态 */
  const copyLabel = (j: number): string => {
    if (done) return '指针已连'
    if (j === cur) return step.phase === 'create' ? '本步新建' : '本步接指针'
    if (j < step.linked) return '指针已连'
    if (j < step.created) return '已建映射'
    return '未创建'
  }

  const phaseTone: 'plain' | 'teal' | 'amber' | 'easy' = done
    ? 'easy'
    : step.phase === 'create'
      ? 'teal'
      : step.phase === 'link'
        ? 'amber'
        : 'plain'
  const randTone: 'plain' | 'teal' | 'amber' =
    done ? 'plain' : step.phase === 'create' ? 'teal' : step.phase === 'link' ? 'amber' : 'plain'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 原链表：两遍遍历都沿着它走，cur 停在哪就在哪个节点上打旗标 */}
      <div className="flex w-full items-start gap-2">
        <span className="mt-6 flex h-11 w-14 shrink-0 items-center justify-end pr-1 font-code text-[11px] leading-none text-ink-soft">
          原链表
        </span>
        <div className="flex min-w-0 flex-wrap items-start gap-y-2">
          {VALS.map((v, i) => (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className="mt-6 flex h-11 items-center">
                  <Link />
                </div>
              )}
              <div className="flex w-14 shrink-0 flex-col items-center">
                <Flag label={i === cur ? 'cur' : undefined} tone="amber" />
                <Node state={i === cur ? 'active' : 'idle'}>{v}</Node>
                <span className="mt-1 font-code text-[11px] leading-none text-ink-soft">
                  原 #{i}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 新链表（副本）：第一遍只建节点，第二遍才把 next 与 random 接上 */}
      <div className="flex w-full items-start gap-2">
        <span className="mt-6 flex h-11 w-14 shrink-0 items-center justify-end pr-1 font-code text-[11px] leading-none text-ink-soft">
          新链表
        </span>
        <div className="flex min-w-0 flex-wrap items-start gap-y-2">
          {VALS.map((v, j) => (
            <div key={j} className="flex items-start">
              {j > 0 && (
                <div className="mt-6 flex h-11 items-center">
                  {j - 1 < step.linked ? (
                    <Link active={!done && step.phase === 'link' && j - 1 === cur} />
                  ) : (
                    <div className="-mx-px w-6 shrink-0" />
                  )}
                </div>
              )}
              <div className="flex w-14 shrink-0 flex-col items-center">
                <Flag
                  label={j === cur ? (step.phase === 'create' ? 'new' : 'cur') : undefined}
                  tone={step.phase === 'create' ? 'teal' : 'amber'}
                />
                <Node state={copyState(j)}>{copyState(j) === 'dim' ? '?' : v}</Node>
                <span className="mt-1 font-code text-[11px] leading-none text-ink-soft">
                  新 #{j}
                </span>
                <span className="mt-0.5 text-[10px] leading-none text-ink-soft">
                  {copyLabel(j)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* old2New 哈希表：第一遍每建一个副本就登记一条，第二遍靠它把指针换算到副本 */}
      <div className="flex w-full items-start gap-2">
        <span className="mt-1 flex w-14 shrink-0 items-center justify-end pr-1 font-code text-[11px] leading-none text-ink-soft">
          old2New
        </span>
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
          {VALS.map((_, j) => (
            <span
              key={j}
              className={`flex min-h-8 min-w-0 items-center justify-center rounded-md border px-1 py-1 text-center font-code text-[10px] leading-tight ${
                j < step.created
                  ? 'border-[hsl(var(--teal))] bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]'
                  : 'border-border bg-card text-ink-soft'
              }`}
            >
              原#{j}→{j < step.created ? `新#${j}` : '?'}
            </span>
          ))}
        </div>
      </div>

      {/* random 的指向无法画成直线，和题 57 的回边一样用一行文字说明目标下标 */}
      <Badge tone={randTone} strong={!done && step.phase === 'link'}>
        <RandomNote step={step} />
      </Badge>

      <Badges className="justify-center">
        <Stat
          label="已建映射"
          value={`${step.created}/${N}`}
          tone={step.created > 0 ? 'teal' : 'ink'}
        />
        <Stat
          label="已接指针"
          value={`${step.linked}/${N}`}
          tone={step.linked > 0 ? 'easy' : 'ink'}
        />
        <Badge tone={phaseTone}>
          {done ? (
            '第一遍建映射 + 第二遍接指针，全部完成'
          ) : step.phase === 'create' ? (
            <>
              {'第一遍：建节点与映射（'}
              <b className="font-code">{step.created}</b>
              {'/'}
              <b className="font-code">{N}</b>
              {'）'}
            </>
          ) : step.phase === 'link' ? (
            <>
              {'第二遍：按映射接指针（'}
              <b className="font-code">{step.linked}</b>
              {'/'}
              <b className="font-code">{N}</b>
              {'）'}
            </>
          ) : (
            '准备：old2New 还是空的'
          )}
        </Badge>
        {!done && step.hint && <Hint tone={step.hintTone}>{step.hint}</Hint>}
        {done && (
          <Answer>
            {'返回 '}
            <b className="font-code">新 #0</b>
            {'（值 '}
            <b className="font-code">{VALS[0]}</b>
            {'），random 与原链表同构'}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function CopyListWithRandomPointerDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="哈希表两遍复制：先建节点，再按映射接 random"
      info={`输入：head = [[7,null],[13,0],[11,4],[10,2],[1,0]]（题解示例 1，n = 5），每个元素是 [值, random 指向的下标]，null 表示 random 为空。第一遍只新建节点、登记「原节点 → 新节点」映射，第二遍再查表把 next 与 random 接到副本上。random 的指向跨节点、画成直线会互相压线，所以与题 57 的回边一样在下方用一行文字说明它指向哪个下标，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.teal, label: '第一遍：新建的副本节点 · 已登记的 old2New 映射' },
        { color: TONE.amber, label: '本步处理的节点（cur / new）· 新接上的 next 指针' },
        { color: TONE.easy, label: '第二遍完成：next 与 random 都已接好' },
        { color: TONE.muted, label: '尚未创建的副本节点（? 占位）· 未登记的映射' },
      ]}
    />
  )
}
