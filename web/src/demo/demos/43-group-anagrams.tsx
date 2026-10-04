import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 43. 字母异位词分组 —— 模式 A：单词行 + 排序键 + 多行分组表            */
/* ------------------------------------------------------------------ */

/** 示例输入：题解示例 1 的 strs（6 个单词，规模最小且覆盖新建分组与并入分组两种情形） */
const STRS = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']

interface Step {
  /** 当前处理的单词下标；init 为 −1，done 为 STRS.length */
  i: number
  word: string
  /** 当前单词的字符排序结果，即分组用的键 */
  key: string
  /** 该键此前不存在（本步要新建分组） */
  isNew: boolean
  /** 哈希表快照：排序后的键 → 原始单词列表 */
  groups: Record<string, string[]>
  /** 键的出现顺序，保证渲染稳定 */
  groupOrder: string[]
  phase: 'init' | 'key' | 'insert' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const groups: Record<string, string[]> = {}
  const groupOrder: string[] = []

  const snapGroups = (): Record<string, string[]> => {
    const copy: Record<string, string[]> = {}
    groupOrder.forEach((k) => {
      copy[k] = groups[k].slice()
    })
    return copy
  }

  steps.push({
    i: -1,
    word: '',
    key: '',
    isNew: false,
    groups: snapGroups(),
    groupOrder: groupOrder.slice(),
    phase: 'init',
    note: `观察：strs 有 ${STRS.length} 个单词，groups 还是空表，指针 i 从 0 开始向右逐词处理。判断："eat"、"tea"、"ate" 的字符排序后都是 "aet"，所以「排序后的字符串」可以当分组的唯一标识。动作：每轮先给当前单词的字符排序求 key，再按表里有没有这个键决定新建分组还是并入已有分组。`,
  })

  STRS.forEach((word, i) => {
    const key = word.split('').sort().join('')
    const isNew = !Object.prototype.hasOwnProperty.call(groups, key)

    steps.push({
      i,
      word,
      key,
      isNew,
      groups: snapGroups(),
      groupOrder: groupOrder.slice(),
      phase: 'key',
      note: isNew
        ? `观察：strs[${i}] = "${word}"，把它的字符排序后得到 key = "${key}"。判断：groups 里没有 "${key}" 这个键，说明此前没有任何单词与 "${word}" 同组。动作：为 "${key}" 新建一个空分组，下一步再放入原单词 "${word}"。`
        : `观察：strs[${i}] = "${word}"，排序后得到 key = "${key}"。判断：groups 里已有 "${key}"（成员 ${groups[key].join('、')}），键相同就意味着字符多重集相同，"${word}" 与它们互为字母异位词。动作：不新建分组，把 "${word}" 追加进 groups["${key}"]。`,
    })

    if (isNew) {
      groups[key] = []
      groupOrder.push(key)
    }
    groups[key].push(word)

    steps.push({
      i,
      word,
      key,
      isNew,
      groups: snapGroups(),
      groupOrder: groupOrder.slice(),
      phase: 'insert',
      note: isNew
        ? `观察：哈希表新增了键 "${key}"，这一组的成员列表是 ["${word}"]。动作：存进去的是原始单词 "${word}"，而不是排序后的 "${key}"。为什么：键只用来定位分组，如果把键当结果存下来，输出的内容就全变了。`
        : `观察：groups["${key}"] 现在的成员是 ${groups[key].join('、')}。动作：追加的仍然是原单词 "${word}"，键 "${key}" 保持不变。为什么：排序把每个字符多重集映射成唯一的规范形式，同组必然同键、异组必然异键，按 key 聚合就能把每个异位词类收集到一起。`,
    })
  })

  const result = groupOrder.map((k) => `[${groups[k].join(', ')}]`).join(' ')
  steps.push({
    i: STRS.length,
    word: '',
    key: '',
    isNew: false,
    groups: snapGroups(),
    groupOrder: groupOrder.slice(),
    phase: 'done',
    note: `观察：${STRS.length} 个单词全部处理完毕，共得到 ${groupOrder.length} 个键：${groupOrder.join('、')}。动作：遍历哈希表，把每个键的值收集成结果 ${result}。为什么：每个字符串恰好被处理一次，所以输出是输入的一个划分，不丢不重，组间顺序题目允许任意。复杂度：时间 O(n·k·log k)，每个单词排序花 k·log k，空间 O(n·k)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') return `i 移到 0，把 strs[0] = "${STRS[0]}" 的字符排序求 key`
  if (step.phase === 'key') {
    return step.isNew
      ? `新建分组 groups["${step.key}"]，放入原单词 "${step.word}"`
      : `把原单词 "${step.word}" 追加进已有分组 groups["${step.key}"]`
  }
  const nx = step.i + 1
  return nx < STRS.length
    ? `i 右移到 ${nx}，处理 strs[${nx}] = "${STRS[nx]}"`
    : 'i 越界，遍历哈希表把所有分组收集成结果返回'
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const processing = step.phase === 'key' || step.phase === 'insert'
  const cur = processing ? step.i : -1
  const processed = done
    ? STRS.length
    : step.phase === 'init'
      ? 0
      : step.phase === 'insert'
        ? step.i + 1
        : step.i
  const hint = nextAction(step)
  const result = step.groupOrder.map((k) => `[${step.groups[k].join(', ')}]`).join(' ')

  const wordState = (i: number): CellState => {
    if (done) return 'ok'
    if (i < step.i) return 'ok'
    if (i > step.i) return 'dim'
    if (step.phase === 'insert') return step.isNew ? 'active' : 'ok'
    return 'active'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 输入数组：旗标 i 在格上、单词在格内、下标在格下 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] text-ink-soft">输入数组 strs（指针 i 逐词向右扫描）</span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {STRS.map((w, i) => (
            <div key={i} className="flex flex-col items-center">
              <Flag label={i === cur ? 'i' : undefined} tone="amber" />
              <Cell state={wordState(i)} className="min-w-11">
                {w}
              </Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 规范化：当前单词的字符排序后得到 key */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">规范化</span>
        {processing ? (
          <>
            {step.word.split('').map((ch, k) => (
              <Cell key={`src-${k}`} size="sm" state="dim">
                {ch}
              </Cell>
            ))}
            <span className="font-code text-[11px] text-ink-soft">→ 排序 →</span>
            {step.key.split('').map((ch, k) => (
              <Cell key={`key-${k}`} size="sm" state="new">
                {ch}
              </Cell>
            ))}
            <span
              className="font-code text-[11px] font-bold"
              style={{ color: step.isNew ? TONE.amber : TONE.easy }}
            >
              key = &quot;{step.key}&quot; {step.isNew ? '（新键 → 新建分组）' : '（已有键 → 并入该组）'}
            </span>
          </>
        ) : (
          <span className="font-code text-[11px] text-ink-soft">
            {done ? `${STRS.length} 个单词已全部规范化并归组` : '等待处理第一个单词'}
          </span>
        )}
      </div>

      {/* 哈希表 groups：每个键一行 */}
      <div className="flex w-full max-w-[600px] flex-col gap-1.5">
        <span className="text-[11px] text-ink-soft">groups：排序后的键 → 原始单词列表</span>
        {step.groupOrder.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center font-code text-[11px] text-ink-soft">
            空表，还没有任何键
          </div>
        ) : (
          step.groupOrder.map((key) => {
            const members = step.groups[key]
            const isCur = processing && key === step.key
            const isNewGroup = isCur && step.isNew
            const tone = isNewGroup ? TONE.amber : TONE.easy
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors"
                style={{ borderColor: isCur ? tone : 'hsl(var(--border))' }}
              >
                <Cell size="sm" state="new" className="min-w-11">
                  {key}
                </Cell>
                <span className="font-code text-[11px] text-ink-soft">→</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {members.map((w, mi) => {
                    const newest = isCur && step.phase === 'insert' && mi === members.length - 1
                    const state: CellState = done
                      ? 'ok'
                      : isCur
                        ? isNewGroup && newest
                          ? 'active'
                          : 'ok'
                        : 'idle'
                    return (
                      <div key={`${w}-${mi}`} className="flex flex-col items-center">
                        <span
                          className="h-3 whitespace-nowrap font-code text-[9px] font-bold leading-3"
                          style={{ color: newest ? tone : 'transparent' }}
                        >
                          {newest ? (isNewGroup ? '新建' : '刚加入') : ''}
                        </span>
                        <Cell size="sm" state={state} className="min-w-11">
                          {w}
                        </Cell>
                      </div>
                    )
                  })}
                </div>
                {isCur && (
                  <span className="font-code text-[10px] font-bold" style={{ color: tone }}>
                    {isNewGroup ? '新建分组' : '命中已有键'}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="已处理" value={`${processed} / ${STRS.length}`} tone="amber" />
        <Stat label="分组数" value={step.groupOrder.length} tone="easy" />
        {hint && <Hint>{hint}</Hint>}
        {done && <Answer>{`${step.groupOrder.length} 组：${result}`}</Answer>}
      </Badges>
    </div>
  )
}

export default function GroupAnagramsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="排序后的串作哈希键，逐词聚类"
      info={`strs = [${STRS.map((w) => `"${w}"`).join(', ')}]（题解示例 1，输出 3 组，共 ${STRS.length} 个单词），对每个单词的字符排序得到键，把原始单词追加到对应分组，共 ${steps.length} 步。组间与组内顺序与题解示例输出不同，题目允许任意顺序。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理的单词 / 新建的分组' },
        { color: TONE.easy, label: '已归入分组的单词' },
        { color: TONE.teal, label: '排序得到的键（分组标识）' },
        { color: TONE.muted, label: '尚未处理的单词' },
      ]}
    />
  )
}
