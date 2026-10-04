import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 23. 找出字符串中第一个匹配项的下标 —— 模式 A：两行字符对齐 + 逐位比较   */
/* ------------------------------------------------------------------ */

/** 题解示例 2：haystack = "leetcode"，needle = "leeto"，答案为 -1 */
const HAYSTACK = 'leetcode'
const NEEDLE = 'leeto'

const H = HAYSTACK.split('')
const N = NEEDLE.split('')
const M = N.length
/** 所有允许的起点，共 n - m + 1 个 */
const BASES = H.length - M + 1
/** 朴素匹配的结论：命中返回下标，否则 -1 */
const ANS = HAYSTACK.indexOf(NEEDLE)

interface Step {
  /** needle 开头当前对齐到 haystack 的下标 */
  base: number
  /** 已经连续匹配成功的字符数（needle 指针 j） */
  matched: number
  /** 本步正在比较的 haystack 下标 = base + matched；done 步为 null */
  iCur: number | null
  /** 本步两个字符是否相等；done 步为 null */
  equal: boolean | null
  phase: 'init' | 'cmp' | 'done'
  done: boolean
  note: string
}

/** 跑一遍真实的朴素逐个起点匹配，每步存一个不可变快照 */
function buildSteps(): Step[] {
  const steps: Step[] = []

  steps.push({
    base: 0, matched: 0, iCur: 0, equal: null, phase: 'init', done: false,
    note: `初始化：haystack = "${HAYSTACK}"（n = ${H.length}），needle = "${N.join('')}"（m = ${M}），结果 ans 先记为 -1。起点 base 从 0 开始枚举，共 ${BASES} 个合法起点（下标 0..${BASES - 1}）。`,
  })

  let ans = -1
  let exit = false
  for (let base = 0; base < BASES && !exit; base++) {
    for (let j = 0; j < M; j++) {
      const eq = H[base + j] === N[j]
      if (eq) {
        const nm = j + 1
        const hit = nm === M
        if (hit) ans = base
        steps.push({
          base, matched: nm, iCur: base + j, equal: true,
          phase: hit ? 'done' : 'cmp', done: hit,
          note: hit
            ? `观察：haystack[${base + j}] = "${H[base + j]}" 与 needle[${j}] = "${N[j]}" 相等，连续匹配长度 j 达到 m = ${M}。判断：needle 的 ${M} 个字符全部对上。动作：输出起点 ans = base = ${base}，后面的起点都不必再看。为什么：起点按从小到大枚举，先命中的一定是第一个匹配项。`
            : `观察：haystack[${base + j}] = "${H[base + j]}" 与 needle[${j}] = "${N[j]}" 相等。判断：以 base = ${base} 为起点，前 ${nm} 个字符都对上了。动作：连续匹配长度推进到 ${nm}，下一轮比较 needle[${nm}]。`,
        })
        if (hit) {
          exit = true
          break
        }
      } else {
        const moreBase = base + 1 < BASES
        steps.push({
          base, matched: j, iCur: base + j, equal: false,
          phase: 'cmp', done: false,
          note: moreBase
            ? `观察：haystack[${base + j}] = "${H[base + j]}" 与 needle[${j}] = "${N[j]}" 不相等。判断：以 base = ${base} 为起点的这次对齐出现失配，前 ${j} 个字符的相等都作废。动作：起点右移到 base = ${base + 1}，连续匹配长度归零，整体重新比较。`
            : `观察：haystack[${base + j}] = "${H[base + j]}" 与 needle[${j}] = "${N[j]}" 不相等，而 base = ${base} 已经是最后一个合法起点（共 ${BASES} 个）。判断：所有起点都试完仍未对齐成功。动作：返回 ans = -1。`,
        })
        break
      }
    }
  }

  if (ans >= 0) {
    steps.push({
      base: ans, matched: M, iCur: null, equal: null, phase: 'done', done: true,
      note: `结论：第一个匹配项的下标是 ${ans}，haystack[${ans}..${ans + M - 1}] = "${HAYSTACK.slice(ans, ans + M)}" 与 needle 相同。正确性：起点按 0, 1, 2… 顺序枚举，先命中的一定是第一个。复杂度：每个起点最多比较 m 次，时间 O(n·m)，只有两个下标，空间 O(1)。`,
    })
  } else {
    steps.push({
      base: BASES - 1, matched: 0, iCur: null, equal: null, phase: 'done', done: true,
      note: `结论：所有 ${BASES} 个起点都没能让 needle 完整对齐，ans 停在 -1。正确性：起点已全部枚举穷尽，漏掉任何一个才可能出错。复杂度：时间 O(n·m)，空间 O(1)。`,
    })
  }

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 比较行的单元格状态：成功 easy 绿、失配 hard 红、未比较 dim 灰 */
function cmpState(step: Step, i: number): CellState {
  if (step.done) return i >= step.base && i < step.base + step.matched ? 'ok' : 'dim'
  if (i === step.iCur) return step.equal ? 'ok' : 'bad'
  if (i >= step.base && i < step.base + step.matched) return 'ok'
  return 'dim'
}

function Stage(step: Step) {
  const done = step.done
  // 当前对齐的 needle 是否整个落在 haystack 内
  const inRange = step.base + M <= H.length
  const hint =
    step.iCur !== null && step.equal !== null
      ? step.equal
        ? step.matched === M
          ? `needle 全部 ${M} 个字符都比完，输出起点 ${step.base}`
          : `继续比较 haystack[${step.base + step.matched}] 与 needle[${step.matched}]`
        : step.base + 1 < BASES
          ? `失配：起点右移到 base = ${step.base + 1}，连续匹配长度归零`
          : `所有起点都已试完，返回 -1`
      : null

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-4">
        {/* 上行 haystack：当前比较位置 i 的旗标 */}
        <div className="flex items-end gap-3">
          <span className="w-12 shrink-0 pb-1 text-right text-[11px] leading-none text-ink-soft sm:w-16">
            haystack
          </span>
          <div className="grid min-w-0 flex-1 grid-cols-9 gap-1.5">
            {H.map((ch, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center">
                <Flag label={i === step.iCur ? 'i' : undefined} tone="amber" />
                <Cell state={cmpState(step, i)} className="w-full min-w-0">
                  {ch}
                </Cell>
              </div>
            ))}
          </div>
        </div>

        {/* 下行 needle：比 haystack 短，按当前起点覆盖在对应列上 */}
        <div className="flex items-end gap-3">
          <span className="w-12 shrink-0 pb-1 text-right text-[11px] leading-none text-ink-soft sm:w-16">
            needle
          </span>
          <div className="grid min-w-0 flex-1 grid-cols-9 gap-1.5">
            {H.map((_, i) => {
              const j = i - step.base
              const inside = inRange && j >= 0 && j < M
              if (!inside) {
                return <div key={i} className="min-w-0" aria-hidden="true" />
              }
              const isCur = i === step.iCur
              const state: CellState = isCur ? (step.equal ? 'ok' : 'bad') : j < step.matched ? 'ok' : 'new'
              return (
                <div key={i} className="flex min-w-0 flex-col items-center">
                  <Flag label={isCur ? 'j' : undefined} tone="teal" />
                  <Cell state={state} className="w-full min-w-0">
                    {N[j]}
                  </Cell>
                </div>
              )
            })}
          </div>
        </div>

        {/* haystack 列下标：两行共用同一套列，needle 的左端要对准 base */}
        <div className="flex items-end gap-3">
          <span className="w-12 shrink-0 text-[11px] text-ink-soft sm:w-16">下标</span>
          <div className="grid min-w-0 flex-1 grid-cols-9 gap-1.5">
            {H.map((_, i) => (
              <span key={i} className="text-center font-code text-[11px] text-ink-soft">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="连续匹配长度 j" value={step.matched} tone={step.equal === false ? 'hard' : 'easy'} />
        <Stat label="起点 base" value={done ? '—' : step.base} tone="amber" />
        <Stat label="结果 ans" value={done ? ANS : -1} tone="ink" />
        {hint && <Hint tone={step.equal === false ? 'hard' : 'teal'}>{hint}</Hint>}
        {done && <Answer>第一个匹配项的下标 = {ANS}</Answer>}
      </Badges>
    </div>
  )
}

export default function FindTheIndexOfTheFirstOccurrenceInAStringDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="朴素逐个起点匹配"
      info={`haystack = "${HAYSTACK}"，needle = "${N.join('')}"（题解示例 2，预期输出 ${ANS}）。演示的是模式 A 朴素逐位对齐：${BASES} 个起点从小到大枚举，起点 0 先对上前 4 个字符 "leet"、在第 5 位失配，起点 1..${BASES - 1} 连首字符都对不上，全部试完仍无匹配，共 ${steps.length} 步。题解正文用的是 KMP 前缀表（失配时只回退模式指针），最坏可优化到 O(n+m)；朴素做法每个起点最多比较 m 次，上界 O(n·m)。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'haystack 当前比较位 i' },
        { color: TONE.teal, label: 'needle 当前比较位 j' },
        { color: TONE.easy, label: '字符相等' },
        { color: TONE.hard, label: '字符失配' },
        { color: TONE.muted, label: '本次对齐之外 / 未比较' },
      ]}
    />
  )
}
