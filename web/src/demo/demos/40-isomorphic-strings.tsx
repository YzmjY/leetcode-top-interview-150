import { useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 40. 同构字符串 —— 模式 A：两行字符逐列比较 + 两张双向映射表           */
/* ------------------------------------------------------------------ */

/** 题解示例 2：s = "foo"、t = "bar"，输出 false（唯一的冲突用例，3 列刚好完整演示） */
const S = 'foo'
const T = 'bar'
const CHARS_S = S.split('')
const CHARS_T = T.split('')

/** 列宽与 Cell size="md" 的 min-w 对齐（36px / 44px），保证各行逐列对齐 */
const COL = 'flex w-9 shrink-0 justify-center sm:w-11'

/** 映射表里的一条记录 */
interface MapEntry {
  from: string
  to: string
}

/** 冲突方向：s2t 违反函数性（同一 s 字符 → 两个 t 字符），t2s 违反单射性（两个 s 字符 → 同一 t 字符） */
type Conflict = 's2t' | 't2s'

interface Step {
  /** 当前比较的列下标；init 为 −1，done 保留结论所在列 */
  i: number
  /** 已完成双向检查的列数 */
  verified: number
  sc: string | null
  tc: string | null
  s2t: MapEntry[]
  t2s: MapEntry[]
  /** 本步是否新建了一对全新映射 */
  isNew: boolean
  conflict: Conflict | null
  /** 冲突时 s2t / t2s 里已有的旧值 */
  stale: string | null
  phase: 'init' | 'probe' | 'apply' | 'done'
  /** 仅 done 且无冲突时为 true */
  ok: boolean
  note: string
}

function buildSteps(): Step[] {
  const n = S.length
  const steps: Step[] = []
  const s2t = new Map<string, string>()
  const t2s = new Map<string, string>()

  const entries = (m: Map<string, string>): MapEntry[] =>
    Array.from(m, ([from, to]) => ({ from, to }))

  const push = (partial: Omit<Step, 's2t' | 't2s'>) => {
    steps.push({ ...partial, s2t: entries(s2t), t2s: entries(t2s) })
  }

  push({
    i: -1,
    verified: 0,
    sc: null,
    tc: null,
    isNew: false,
    conflict: null,
    stale: null,
    phase: 'init',
    ok: false,
    note: `初始化：输入 s = "${S}"、t = "${T}"（等长，n = 3），两张固定 128 项的映射表 s2t、t2s 全部置为 −1 表示「尚未建立映射」；题解特意不用 0 作哨兵，因为 NUL 的编码 0 也是合法 ASCII 字符。i 从 0 开始同时读入 s[i] 与 t[i]，每个位置先在 s2t 里查函数性，再在 t2s 里查单射性。不变量：已扫过的前缀存在一致的双射，两张表的条目数始终相同。`,
  })

  let failed = false
  let failAt = -1
  let failStale: string | null = null
  let failConflict: Conflict | null = null

  for (let i = 0; i < n; i++) {
    const sc = S[i]
    const tc = T[i]
    const mappedT = s2t.get(sc) ?? null
    const mappedS = t2s.get(tc) ?? null
    const conflictST = mappedT !== null && mappedT !== tc
    const conflictTS = mappedS !== null && mappedS !== sc
    const conflict: Conflict | null = conflictST ? 's2t' : conflictTS ? 't2s' : null

    const probeNote = conflictST
      ? `观察：i = ${i}，读入 s[${i}] = "${sc}"、t[${i}] = "${tc}"。判断：s2t["${sc}"] 已经是 "${mappedT}"，与本次要求的 "${tc}" 不相等，同一个 s 字符被要求映射到两个不同字符。动作：命中题解步骤 3 的冲突条件，立即返回 false，不再写表。为什么：函数性被破坏，后面的字符无论是什么，都不可能存在满足 t[i] = f(s[i]) 的双射。`
      : conflictTS
        ? `观察：i = ${i}，读入 s[${i}] = "${sc}"、t[${i}] = "${tc}"。判断：t2s["${tc}"] 已经是 "${mappedS}"，与本次的 "${sc}" 不相等，两个不同的 s 字符被要求映射到同一个 t 字符。动作：命中题解步骤 4 的冲突条件，立即返回 false。为什么：单射性被破坏，同一个 t 字符不能有两个原像。`
        : mappedT !== null
          ? `观察：i = ${i}，读入 s[${i}] = "${sc}"、t[${i}] = "${tc}"。判断：s2t["${sc}"] = "${mappedT}" 恰好等于 t[${i}]，t2s["${tc}"] = "${mappedS}" 也恰好等于 s[${i}]。动作：两个方向都自洽，映射无需改动，继续下一位。为什么：已有映射与新要求一致，前缀的双射保持不变。`
          : `观察：i = ${i}，读入 s[${i}] = "${sc}"、t[${i}] = "${tc}"。判断：s2t 里没有 "${sc}"、t2s 里没有 "${tc}"，两个方向都是 −1。动作：题解步骤 3、4 的两个冲突条件都不成立，可以建立新映射。为什么："${sc}" 与 "${tc}" 都是首次出现，新增一对映射不会破坏已确认前缀的双射。`

    push({
      i,
      verified: i,
      sc,
      tc,
      isNew: false,
      conflict,
      stale: conflictST ? mappedT : conflictTS ? mappedS : null,
      phase: 'probe',
      ok: false,
      note: probeNote,
    })

    if (conflict) {
      failed = true
      failAt = i
      failStale = conflictST ? mappedT : mappedS
      failConflict = conflict
      break
    }

    const isNew = mappedT === null
    s2t.set(sc, tc)
    t2s.set(tc, sc)
    push({
      i,
      verified: i + 1,
      sc,
      tc,
      isNew,
      conflict: null,
      stale: null,
      phase: 'apply',
      ok: false,
      note: isNew
        ? `动作：写入 s2t["${sc}"] = "${tc}"、t2s["${tc}"] = "${sc}"，两个方向同时建立。为什么：只写 s→t 一个方向就检查不出「两个不同 s 字符映射到同一个 t 字符」的非法情况，两张表缺一不可。`
        : `动作："${sc}" → "${tc}" 这对映射此前已经存在且一致，重复写入不改变任何内容。为什么：s2t 与 t2s 各有一条同样的记录，已确认前缀的双射不变。`,
    })
  }

  push({
    i: failed ? failAt : -1,
    verified: failed ? failAt : n,
    sc: failed ? S[failAt] : null,
    tc: failed ? T[failAt] : null,
    isNew: false,
    conflict: failed ? failConflict : null,
    stale: failed ? failStale : null,
    phase: 'done',
    ok: !failed,
    note: failed
      ? `结论：第 ${failAt} 列要求 "${S[failAt]}" → "${T[failAt]}"，但 s2t 里 "${S[failAt]}" 已经固定为 "${failStale}"，返回 false。为什么：一个字符只能有一个像，函数性一旦被破坏，继续扫描也无法补救。复杂度：只遍历一次字符串、每次查表 O(1)，时间 O(n)；两张表大小固定为 128，空间 O(1)。`
      : `结论：${n} 列全部通过两个方向的检查，返回 true。为什么：每一步前缀的双射都保持一致，遍历结束后按任意方式补全即可得到完整双射。复杂度：只遍历一次字符串、每次查表 O(1)，时间 O(n)；两张表大小固定为 128，空间 O(1)。`,
  })

  return steps
}

function nextAction(step: Step): string {
  if (step.phase === 'init') {
    return `i = 0，同时读入 s[0] = "${S[0]}"、t[0] = "${T[0]}"，两个方向各查一次表`
  }
  if (step.conflict) return '扫描中止，返回 false'
  if (step.phase === 'probe') {
    const established = step.s2t.some((e) => e.from === step.sc)
    return established
      ? `两个方向已一致，i 右移到 ${step.i + 1}`
      : `写入 s2t["${step.sc}"] = "${step.tc}"、t2s["${step.tc}"] = "${step.sc}"`
  }
  const next = step.i + 1
  return next < CHARS_S.length
    ? `i 右移到 ${next}，读入 s[${next}] = "${S[next]}"、t[${next}] = "${T[next]}"`
    : 'i 越界，返回 true'
}

/* ---------------- 舞台渲染 ---------------- */

/** 对齐行：左侧固定宽度的行标（s / t），右侧逐列排列 */
function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center gap-1.5">
      <span className="w-6 shrink-0 text-right font-code text-[11px] font-bold text-ink-soft">
        {label}
      </span>
      {children}
    </div>
  )
}

function MapPanel({
  title,
  entries,
  activeKey,
  badKey,
  newKey,
  badWant,
}: {
  title: string
  entries: MapEntry[]
  activeKey: string | null
  badKey: string | null
  newKey: string | null
  badWant: string | null
}) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-soft">
        <span>{title}</span>
        <span className="font-code">{entries.length} 条</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {entries.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">（空表）</span>
        ) : (
          entries.map((e) => {
            const bad = e.from === badKey
            const fresh = !bad && e.from === newKey
            const active = !bad && !fresh && e.from === activeKey
            return (
              <span
                key={e.from}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold',
                  bad
                    ? 'border-[hsl(var(--hard))]/50 bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]'
                    : fresh
                      ? 'border-[hsl(var(--teal))]/50 bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]'
                      : active
                        ? 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
                        : 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                )}
              >
                "{e.from}" → "{e.to}"
                {bad && badWant && <span className="ml-1">≠ "{badWant}"</span>}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

function Stage(step: Step) {
  const badCol = step.conflict !== null
  const activeCol = (step.phase === 'probe' && !step.conflict) || step.phase === 'apply'
  const flagLabel = badCol ? '冲突' : step.phase === 'done' ? '通过' : `i=${step.i}`
  const flagTone = badCol ? 'hard' : step.phase === 'done' ? 'easy' : 'amber'

  /** 列 i 在两行字符里的状态：冲突红、当前琥珀、已通过绿、未读入灰 */
  const cellState = (i: number): CellState => {
    if (i === step.i && badCol) return 'bad'
    if (i === step.i && activeCol) return 'active'
    if (step.phase === 'done' && step.ok) return 'ok'
    if (step.i >= 0 && i < step.i) return 'ok'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 两行字符逐列对齐：上 s、下 t，中间是这一列的映射方向 */}
      <div className="w-full">
        <Row>
          {CHARS_S.map((_, i) => (
            <div key={i} className={COL}>
              {i === step.i && step.i >= 0 && <Flag label={flagLabel} tone={flagTone} />}
            </div>
          ))}
        </Row>

        <Row label="s">
          {CHARS_S.map((ch, i) => (
            <div key={i} className={COL}>
              <Cell state={cellState(i)} className="w-full">
                {ch}
              </Cell>
            </div>
          ))}
        </Row>

        <Row>
          {CHARS_S.map((_, i) => (
            <div key={i} className={COL}>
              <span
                className={cn(
                  'py-0.5 font-code text-[11px]',
                  i === step.i && badCol
                    ? 'font-bold text-[hsl(var(--hard))]'
                    : 'text-ink-soft'
                )}
              >
                {i === step.i && badCol ? '✗' : '↓'}
              </span>
            </div>
          ))}
        </Row>

        <Row label="t">
          {CHARS_T.map((ch, i) => (
            <div key={i} className={COL}>
              <Cell state={cellState(i)} className="w-full">
                {ch}
              </Cell>
            </div>
          ))}
        </Row>

        <div className="mt-1">
          <Row>
            {CHARS_S.map((_, i) => (
              <div key={i} className={COL}>
                <span
                  className={cn(
                    'font-code text-[11px]',
                    i === step.i
                      ? badCol
                        ? 'font-bold text-[hsl(var(--hard))]'
                        : 'font-bold text-[hsl(var(--amber))]'
                      : 'text-ink-soft'
                  )}
                >
                  {i}
                </span>
              </div>
            ))}
          </Row>
        </div>
      </div>

      {/* 两张方向相反的映射表 */}
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <MapPanel
          title="s2t：s 的字符 → t 的字符"
          entries={step.s2t}
          activeKey={activeCol ? step.sc : null}
          badKey={step.conflict === 's2t' ? step.sc : null}
          newKey={step.phase === 'apply' && step.isNew ? step.sc : null}
          badWant={step.conflict === 's2t' ? step.tc : null}
        />
        <MapPanel
          title="t2s：t 的字符 → s 的字符"
          entries={step.t2s}
          activeKey={activeCol ? step.tc : null}
          badKey={step.conflict === 't2s' ? step.tc : null}
          newKey={step.phase === 'apply' && step.isNew ? step.tc : null}
          badWant={step.conflict === 't2s' ? step.sc : null}
        />
      </div>

      <Badges className="justify-center">
        <Stat label="已通过列数" value={step.verified} tone="easy" />
        <Stat label="映射条目" value={step.s2t.length} tone="teal" />
        {step.phase === 'done' ? (
          <Answer>
            {step.ok
              ? `返回 true：${CHARS_S.length} 列全部通过双向检查`
              : `返回 false：第 ${step.i} 列要求 "${step.sc}" → "${step.tc}"，但 s2t 里 "${step.sc}" 已经是 "${step.stale}"`}
          </Answer>
        ) : (
          <Hint tone={step.conflict ? 'hard' : 'teal'}>{nextAction(step)}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function IsomorphicStringsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="双向映射检查同构字符串"
      info={`s = "${S}"、t = "${T}"（题解示例 2，输出 false）。示例 1 同为 3 列但不含冲突，为看清映射冲突的判罚选用了示例 2，3 列全部完整演示。每个位置同时读入 s[i] 与 t[i]：s2t 检查「相同字符只能映射到同一个字符」，t2s 检查「不同字符不能映射到同一个字符」，两张表缺一不可。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前列：正在查表' },
        { color: TONE.teal, label: '本步新建立的映射' },
        { color: TONE.easy, label: '已通过检查的列 / 已建立的映射' },
        { color: TONE.hard, label: '映射冲突（同一字符被要求映射到两个字符）' },
        { color: TONE.muted, label: '尚未读入的列' },
      ]}
    />
  )
}
