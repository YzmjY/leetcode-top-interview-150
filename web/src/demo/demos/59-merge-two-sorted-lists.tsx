import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 59. 合并两个有序链表 —— 模式 D：双指针逐次挑较小者接到结果链尾部       */
/* ------------------------------------------------------------------ */

/** 题解示例 1（最有代表性且规模最小）：l1 = [1,2,4]，l2 = [1,3,4] → [1,1,2,3,4,4] */
const L1 = [1, 2, 4]
const L2 = [1, 3, 4]

type ChainName = 'l1' | 'l2'

interface Step {
  phase: 'init' | 'pick' | 'rest' | 'done'
  /** 两条输入链已被循环摘走的节点数（= 头指针下标） */
  i1: number
  i2: number
  /** 循环里已摘下的节点数；cur 始终停在第 merged 个结果节点上（0 = dummy） */
  merged: number
  /** 结果链上已接好的节点值（不含 dummy） */
  out: number[]
  /** 本步摘下的节点来自哪条链 / 值是多少 */
  pickedFrom: ChainName | null
  pickedVal: number | null
  /** 本步比较的两个链头值 */
  cmpA: number | null
  cmpB: number | null
  /** rest 步：被整段挂接的那条链与它的剩余值 */
  restFrom: ChainName | null
  restValues: number[]
  note: string
  /** 真正的下一步动作；由后一个快照回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const out: number[] = []
  let i1 = 0
  let i2 = 0
  let merged = 0

  steps.push({
    phase: 'init',
    i1,
    i2,
    merged,
    out: [],
    pickedFrom: null,
    pickedVal: null,
    cmpA: null,
    cmpB: null,
    restFrom: null,
    restValues: [],
    next: '',
    note: `观察：l1 = [${L1.join(', ')}]、l2 = [${L2.join(', ')}]，两条链都非递减，所以每条链的头节点就是本链剩余元素里的最小值。判断：结果链的头节点还没确定，先用哨兵 dummy 占位、cur = dummy，避免为「第一个节点」写特判。动作：进入循环，比较两链头节点并把较小者接到 cur.Next，被摘链的头指针和 cur 一起前移。为什么：返回值固定是 dummy.Next，dummy 本身不属于结果链，它只是让「结果链为空」不需要额外分支。`,
  })

  while (i1 < L1.length && i2 < L2.length) {
    const a = L1[i1]
    const b = L2[i2]
    const takeL1 = a <= b
    const equal = a === b
    const from: ChainName = takeL1 ? 'l1' : 'l2'
    const val = takeL1 ? a : b
    if (takeL1) i1 += 1
    else i2 += 1
    out.push(val)
    merged += 1

    steps.push({
      phase: 'pick',
      i1,
      i2,
      merged,
      out: out.slice(),
      pickedFrom: from,
      pickedVal: val,
      cmpA: a,
      cmpB: b,
      restFrom: null,
      restValues: [],
      next: '',
      note:
        `观察：l1 的头节点是 ${a}，l2 的头节点是 ${b}，比较 ${a} ${takeL1 ? '<=' : '>'} ${b} ${takeL1 ? '成立' : '不成立'}。` +
        (equal
          ? `判断：两个值相等，按题解用 <= 的约定优先取 l1 的节点（相等时保持稳定），l1 的头指针前移一位。`
          : `判断：${val} 更小，它就是两条链剩余元素里的最小值，${from} 的头指针前移一位。`) +
        `动作：执行 cur.Next = ${from} 把节点 ${val} 摘下接到结果链尾部（复用原节点、不新建），cur 前进到它，结果链变成 [${out.join(', ')}]。` +
        `为什么：摘走链头后该链的新头只会更大，接上的 ${val} 仍不大于两个新头，结果链的非递减不变量保持。`,
    })
  }

  const restFrom: ChainName | null = i1 < L1.length ? 'l1' : i2 < L2.length ? 'l2' : null
  const restValues = restFrom === 'l1' ? L1.slice(i1) : restFrom === 'l2' ? L2.slice(i2) : []
  const lastMerged = out[out.length - 1]
  out.push(...restValues)

  steps.push({
    phase: 'rest',
    i1,
    i2,
    merged,
    out: out.slice(),
    pickedFrom: null,
    pickedVal: null,
    cmpA: null,
    cmpB: null,
    restFrom,
    restValues: restValues.slice(),
    next: '',
    note: restFrom
      ? `观察：${restFrom === 'l1' ? 'l2' : 'l1'} 的节点已全部摘下、头指针走到 nil，而 ${restFrom} 还剩 [${restValues.join(', ')}] 没有接。判断：循环条件「list1 != nil && list2 != nil」不再成立，这段剩余链本身有序，且它的头节点 ${restValues[0]} 不小于已合并部分的最后一个元素 ${lastMerged}。动作：执行 cur.Next = ${restFrom}，把 [${restValues.join(', ')}] 整段一次接上，cur 停在上一个已合并的节点 ${lastMerged} 上、不随整段前移。为什么：整段挂接就覆盖了剩余的全部节点，代码里的 if/else 也顺带覆盖了「另一条链为 nil」的情形。`
      : `观察：两条链的节点都已全部摘下，头指针同时走到 nil，没有剩余节点。判断：循环条件不再成立，也没有需要整段挂接的部分。动作：if/else 两个分支都不接新节点，直接进入收尾。为什么：结果链此时已经含有 n + m 个节点。`,
  })

  steps.push({
    phase: 'done',
    i1,
    i2,
    merged,
    out: out.slice(),
    pickedFrom: null,
    pickedVal: null,
    cmpA: null,
    cmpB: null,
    restFrom,
    restValues: [],
    next: '',
    note: `结论：返回 dummy.Next，合并结果 = [${out.join(', ')}]，节点数 ${L1.length} + ${L2.length} = ${out.length}，正是 n + m。判断：这 ${out.length} 个节点各被摘下恰好一次，结果链非递减且包含两条原链的全部元素。为什么复杂度是 O(n+m) / O(1)：每个节点只被访问一次，全程只用 dummy、cur 和两个输入指针，没有新建节点、也没有额外数组。`,
  })

  // Hint 的「下一步：」前缀由组件硬编码，这里只用后一个快照回填真正的下一步动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'pick') {
      const a = b.cmpA
      const c = b.cmpB
      if (a === null || c === null) return
      s.next =
        a === c
          ? `比较 l1 的 ${a} 与 l2 的 ${c}：两值相等，按 <= 取 l1 的 ${a} 接到 cur 后面`
          : `比较 l1 的 ${a} 与 l2 的 ${c}：取较小的 ${a < c ? a : c}（来自 ${a < c ? 'l1' : 'l2'}）接到 cur 后面`
    } else if (b.phase === 'rest') {
      s.next = b.restFrom
        ? `${b.restFrom} 还剩 [${b.restValues.join(', ')}]，把这一整段接到 cur.Next`
        : '两条链都已走空，没有剩余节点要接'
    } else {
      s.next = '返回 dummy.Next，读出合并结果'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 已从输入链摘走的节点：18% ink 灰底 + 虚线边（与 TONE.muted 同值） */
const TAKEN = 'border-dashed bg-[hsl(var(--ink)/0.18)] text-ink-soft'

/** 输入链：整条链都画出来，摘走的节点留在原位变灰，头指针用 teal 旗标标出 */
function InputRow({
  name,
  values,
  taken,
  showHead,
}: {
  name: ChainName
  values: number[]
  taken: number
  showHead: boolean
}) {
  return (
    <div className="flex w-full items-start gap-2">
      <div className="mt-6 flex h-11 w-8 shrink-0 items-center justify-end sm:w-10">
        <span className="font-code text-[11px] font-bold text-ink-soft">{name}</span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center">
        {values.map((v, k) => (
          <div key={k} className="flex items-center">
            {k > 0 && (
              <div className="mt-6 flex h-11 items-center">
                <Link />
              </div>
            )}
            <div className="flex flex-col items-center">
              <Flag label={showHead && k === taken ? name : undefined} tone="teal" />
              <Node
                state={showHead && k === taken ? 'teal' : 'idle'}
                className={k < taken ? TAKEN : undefined}
              >
                {v}
              </Node>
            </div>
          </div>
        ))}
        {taken >= values.length && (
          <div className="flex items-center">
            <div className="mt-6 flex h-11 items-center">
              <Link />
            </div>
            <div className="flex flex-col items-center">
              <Flag label={showHead ? name : undefined} tone="teal" />
              <div className="flex h-11 min-w-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-border px-2 font-code text-xs text-ink-soft">
                nil
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** 输入链上的头指针只在 init / pick 步存在，收尾后整条链的画法交给结果链 */
  const showHead = step.phase === 'init' || step.phase === 'pick'
  /** rest 步被整段挂接的节点数（含 rest 段），据此给结果链上色 */
  const settledCount = step.out.length - step.restValues.length

  /** 本步新接的边：pick 步是尾部那条，rest 步是整段接入的第一条 */
  const activeLink = done
    ? -1
    : step.phase === 'pick'
      ? step.out.length - 1
      : step.phase === 'rest'
        ? step.merged
        : -1

  /** 结果链第 i 个节点（下标 0 起）的状态：本步接入 = amber，已接好 = easy 绿 */
  const outState = (i: number): 'active' | 'ok' => {
    if (done) return 'ok'
    if (step.phase === 'pick') return i === step.out.length - 1 ? 'active' : 'ok'
    if (step.phase === 'rest') return i >= settledCount ? 'active' : 'ok'
    return 'ok'
  }

  /** 结果链节点上方的旗标：cur 停在第 merged 个节点，整段接入时标出来源链 */
  const resultFlag = (i: number): string | undefined => {
    if (done) return undefined
    if (step.phase === 'rest' && i === settledCount) {
      return step.restFrom ? `接自 ${step.restFrom}` : undefined
    }
    return i + 1 === step.merged ? 'cur' : undefined
  }

  const dummyHasCur = !done && step.merged === 0

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col gap-2">
        <InputRow
          name="l1"
          values={L1}
          taken={showHead ? step.i1 : L1.length}
          showHead={showHead}
        />
        <InputRow
          name="l2"
          values={L2}
          taken={showHead ? step.i2 : L2.length}
          showHead={showHead}
        />

        {/* 结果链：dummy 哨兵在左，新节点从右边长出来 */}
        <div className="mt-1 flex w-full items-start gap-2">
          <div className="mt-6 flex h-11 w-8 shrink-0 items-center justify-end sm:w-10">
            <span className="font-code text-[11px] font-bold text-ink-soft">结果</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center">
            <div className="flex flex-col items-center">
              <Flag label={dummyHasCur ? 'dummy·cur' : 'dummy'} tone={dummyHasCur ? 'amber' : 'ink'} />
              <Node className="border-dashed px-2 text-[11px] font-normal text-ink-soft">dummy</Node>
            </div>
            {step.out.map((v, i) => (
              <div key={i} className="flex items-center">
                <div className="mt-6 flex h-11 items-center">
                  <Link active={i === activeLink} />
                </div>
                <div className="flex flex-col items-center">
                  <Flag label={resultFlag(i)} tone="amber" />
                  <Node state={outState(i)}>{v}</Node>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && <Stat label="已合并" value={0} tone="amber" />}
        {step.phase === 'pick' && (
          <Stat
            label={`本步选中 ${step.pickedFrom ?? ''}`}
            value={step.pickedVal ?? '—'}
            tone="amber"
          />
        )}
        {step.phase === 'rest' && (
          <Stat
            label={`整段接入 ${step.restFrom ?? ''}`}
            value={step.restFrom ? `[${step.restValues.join(', ')}]` : '—'}
            tone="amber"
          />
        )}
        {step.phase !== 'init' && <Stat label="已合并" value={step.out.length} tone="easy" />}
        {done ? (
          <Stat label="时间 / 空间" value="O(n+m) / O(1)" />
        ) : (
          <Hint>{step.next}</Hint>
        )}
        {done && (
          <Answer>
            合并结果 <b className="font-code">[{step.out.join(', ')}]</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MergeTwoSortedListsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="双指针 + dummy 哨兵合并两条有序链表"
      info={`输入取题解示例 1：l1 = [${L1.join(', ')}]，l2 = [${L2.join(', ')}]（最有代表性且规模最小，第 1 轮就出现 1 = 1 的相等情形）→ 输出 [1, 1, 2, 3, 4, 4]，共 ${steps.length} 步。示例 2 / 3 是空链表、只有 1~2 步看不清归并过程，所以未采用（本题不需要为空输入特判，循环不执行、直接整段挂接即可）。上方两条输入链各有一个 l1 / l2 头指针旗标，走到尽头时停在 nil 上；摘走的节点留在原位显示为灰色虚线，下方结果链从 dummy 哨兵开始边长边接。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步选中的节点 / 整段接入的节点' },
        { color: TONE.amber, label: '本步新接的边（加粗）与 cur 旗标' },
        { color: TONE.teal, label: 'l1、l2 的当前头指针（本链剩余部分的最小值）' },
        { color: TONE.easy, label: '已接在结果链上的节点' },
        { color: TONE.muted, label: '已从输入链摘走（虚线灰）' },
      ]}
    />
  )
}
