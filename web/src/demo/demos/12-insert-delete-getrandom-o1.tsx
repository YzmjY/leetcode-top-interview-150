import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState, type Tone } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 12. O(1) 时间插入、删除和获取随机元素                                  */
/* —— 模式 A：数组 + 「值 → 下标」映射双视图（左数组行 / 右哈希表行）      */
/* ------------------------------------------------------------------ */

type Op =
  | { op: 'insert'; val: number }
  | { op: 'remove'; val: number }
  | { op: 'getRandom' }

/** 固定的示例输入：题解示例的 7 次调用 */
const OPERATIONS: Op[] = [
  { op: 'insert', val: 1 },
  { op: 'remove', val: 2 },
  { op: 'insert', val: 2 },
  { op: 'getRandom' },
  { op: 'remove', val: 1 },
  { op: 'insert', val: 2 },
  { op: 'getRandom' },
]

/** 题解示例两次 getRandom 的输出都是 2：nums = [1, 2] 时取到下标 1，nums = [2] 时只能取下标 0 */
const RANDOM_IDX = [1, 0]

/** 哈希表视图固定展示的键：本题操作只涉及 1 与 2，按值升序 */
const KEYS = [1, 2]

/** 题解示例的完整输出 */
const OUTPUT = '[null, true, false, true, 2, true, false, 2]'

type Phase = 'init' | 'append' | 'reject' | 'random' | 'locate' | 'move' | 'pop' | 'done'

interface Step {
  /** 数组快照（每个元素都是一份独立副本） */
  nums: number[]
  /** 哈希表快照：值 → 数组下标 */
  map: Record<number, number>
  phase: Phase
  /** 本步对应的调用，如 insert(1) */
  op: string
  opTone: Tone | 'plain'
  /** 本次调用的返回值（getRandom 为抽到的值），无调用时为 — */
  ret: string
  retTone: Tone
  /** 数组上被关注的某个下标（新插入位 / 待删位 / 重复值所在位 / 随机抽中位），−1 表示无 */
  idx: number
  /** remove 时删除前的末尾下标，−1 表示无 */
  lastIdx: number
  /** remove 时的末尾元素，null 表示无 */
  lastVal: number | null
  /** 哈希表上被关注的键 */
  key: number | null
  /** 数组行下方的补充说明 */
  tag: string | null
  /** 真正的下一步动作 */
  hint: string | null
  note: string
}

function buildSteps(): Step[] {
  const nums: number[] = []
  const map: Record<number, number> = {}
  const steps: Step[] = []
  let randomRound = 0

  const push = (s: Omit<Step, 'nums' | 'map'>) => {
    // 快照必须不可变：数组 slice、映射浅拷贝
    steps.push({ ...s, nums: nums.slice(), map: { ...map } })
  }

  /** 第 i 次调用的开场动作，用作上一步的「下一步」提示 */
  const nextAction = (i: number): string => {
    const o = OPERATIONS[i]
    if (!o) return '无更多调用，输出结果'
    if (o.op === 'getRandom') return 'getRandom()：在紧凑的 nums 上等概率取一个下标'
    return `${o.op}(${o.val})：先查 valToIdx 里有没有 ${o.val}`
  }

  push({
    phase: 'init',
    op: '初始化 RandomizedSet()',
    opTone: 'plain',
    ret: '—',
    retTone: 'muted',
    idx: -1,
    lastIdx: -1,
    lastVal: null,
    key: null,
    tag: null,
    hint: nextAction(0),
    note: `初始化：nums 是空数组、valToIdx 是空哈希表，集合大小为 0。分工是数组负责按下标等概率随机取元素，哈希表负责 O(1) 查到某个值在数组中的下标，两者必须严格一一对应。接下来按题解示例依次执行 insert(1)、remove(2)、insert(2)、getRandom()、remove(1)、insert(2)、getRandom()。`,
  })

  OPERATIONS.forEach((o, i) => {
    if (o.op === 'insert') {
      const at = map[o.val]
      if (at !== undefined) {
        push({
          phase: 'reject',
          op: `insert(${o.val})`,
          opTone: 'hard',
          ret: 'false',
          retTone: 'hard',
          idx: at,
          lastIdx: -1,
          lastVal: null,
          key: o.val,
          tag: `集合里已经有 ${o.val}，本次调用不改变任何状态`,
          hint: nextAction(i + 1),
          note: `观察：valToIdx 里已经有 ${o.val} → ${at}，说明 ${o.val} 就在集合中。判断：集合不允许重复元素，这次插入无效。动作：不追加、不登记，直接返回 false，集合仍是 [${nums.join(', ')}]。为什么很快：只查了一次哈希表，没有任何搬移，代价是 O(1)。`,
        })
        return
      }

      const idx = nums.length
      map[o.val] = idx
      nums.push(o.val)
      push({
        phase: 'append',
        op: `insert(${o.val})`,
        opTone: 'amber',
        ret: 'true',
        retTone: 'easy',
        idx,
        lastIdx: -1,
        lastVal: null,
        key: o.val,
        tag: `valToIdx[${o.val}] = ${idx} 与 nums[${idx}] = ${o.val} 同步写入`,
        hint: nextAction(i + 1),
        note: `观察：valToIdx 里没有 ${o.val}，说明它是新元素。判断：可以插入。动作：令 valToIdx[${o.val}] = ${idx}，再把 ${o.val} 追加到 nums 末尾，返回 true，此时 nums = [${nums.join(', ')}]。为什么是 O(1)：末尾追加只落在数组尾巴上，哈希表也只写一条记录。`,
      })
      return
    }

    if (o.op === 'remove') {
      const at = map[o.val]
      if (at === undefined) {
        push({
          phase: 'reject',
          op: `remove(${o.val})`,
          opTone: 'hard',
          ret: 'false',
          retTone: 'hard',
          idx: -1,
          lastIdx: -1,
          lastVal: null,
          key: o.val,
          tag: `集合里没有 ${o.val}，本次调用不改变任何状态`,
          hint: nextAction(i + 1),
          note: `观察：valToIdx 里没有 ${o.val} 这条记录。判断：${o.val} 不在集合中，没有可以删除的元素。动作：数组与哈希表都保持原样 [${nums.join(', ')}]，直接返回 false。为什么能立刻返回：定位完全依赖哈希表，查不到就说明无需搬移。`,
        })
        return
      }

      const lastIdx = nums.length - 1
      const lastVal = nums[lastIdx]
      const moved = at !== lastIdx

      push({
        phase: 'locate',
        op: `remove(${o.val})`,
        opTone: 'amber',
        ret: '—',
        retTone: 'muted',
        idx: at,
        lastIdx,
        lastVal,
        key: o.val,
        tag: `待删下标 ${at} ← 末位下标 ${lastIdx}（值 ${lastVal}）`,
        hint: moved
          ? `把末尾的 ${lastVal} 写到下标 ${at}，并改写 valToIdx[${lastVal}] = ${at}`
          : `末尾就是 ${o.val} 本身，直接截断数组并删除映射`,
        note: `观察：valToIdx[${o.val}] = ${at}，待删的 ${o.val} 在下标 ${at}。判断：数组直接删中间元素要把它之后的所有元素左移，是 O(n)，必须绕开。动作：先看清末尾——lastIdx = ${lastIdx}、lastVal = nums[${lastIdx}] = ${lastVal}，${
          moved
            ? `准备请它来填下标 ${at} 的空位`
            : `它正是要删的元素本身`
        }。`,
      })

      if (moved) {
        nums[at] = lastVal
        map[lastVal] = at
        push({
          phase: 'move',
          op: `remove(${o.val})`,
          opTone: 'amber',
          ret: '—',
          retTone: 'muted',
          idx: at,
          lastIdx,
          lastVal,
          key: o.val,
          tag: `nums[${at}] 上的 ${o.val} 已被末尾的 ${lastVal} 覆盖`,
          hint: `截断数组末尾，并 delete valToIdx[${o.val}]`,
          note: `观察：待删的 ${o.val} 在下标 ${at}，末尾下标 ${lastIdx} 上的 ${lastVal} 是它的替身。判断：用末尾元素覆盖下标 ${at} 之后，${o.val} 就自然消失，只剩缩短数组这一步。动作：nums[${at}] = ${lastVal}，并把 valToIdx[${lastVal}] 从 ${lastIdx} 改成 ${at}；此刻 nums = [${nums.join(', ')}]、哈希表里 ${o.val} → ${at} 与 ${lastVal} → ${at} 并存。为什么这样删：整个删除只改了一个位置，避开了 O(n) 的整体左移。`,
        })
      }

      nums.pop()
      delete map[o.val]
      push({
        phase: 'pop',
        op: `remove(${o.val})`,
        opTone: 'amber',
        ret: 'true',
        retTone: 'easy',
        idx: at,
        lastIdx,
        lastVal,
        key: o.val,
        tag: `数组截断到长度 ${nums.length}，valToIdx 中删除 ${o.val}`,
        hint: nextAction(i + 1),
        note: `观察：${
          moved
            ? `末尾还剩一份多余的 ${lastVal}（${lastVal} 的正主已经在下标 ${at}）`
            : `要删的 ${o.val} 本来就在末尾`
        }。判断：可以截断收尾了。动作：nums 截成 nums[:${lastIdx}] = [${nums.join(', ')}]，并 delete valToIdx[${o.val}]，返回 true。为什么要按这个顺序：必须先把 valToIdx[${lastVal}] 改写到位，最后才 delete(valToIdx, ${o.val})，否则当被删元素正好是末尾元素时，这次改写会把刚删掉的 valToIdx[${o.val}] 重新写回，留下一个 nums 中已不存在的键。`,
      })
      return
    }

    // getRandom：等概率取一个下标（本演示固定取题解示例输出对应的下标）
    const at = RANDOM_IDX[randomRound]
    randomRound += 1
    const picked = nums[at]
    const size = nums.length
    push({
      phase: 'random',
      op: 'getRandom()',
      opTone: 'amber',
      ret: `${picked}`,
      retTone: 'easy',
      idx: at,
      lastIdx: -1,
      lastVal: null,
      key: picked,
      tag: `随机下标 ${at} → 返回 nums[${at}] = ${picked}`,
      hint: nextAction(i + 1),
      note: `观察：集合有 ${size} 个元素，nums = [${nums.join(', ')}] 紧凑无空洞。判断：rand.Intn(${size}) 取到每个下标的概率都是 1/${size}，本演示固定取题解输出对应的下标 ${at}。动作：返回 nums[${at}] = ${picked}。为什么能等概率：数组没有空洞，等概率取下标就等于等概率取元素，这正是删除时必须保持紧凑的原因。`,
    })
  })

  push({
    phase: 'done',
    op: '全部调用完成',
    opTone: 'easy',
    ret: '—',
    retTone: 'muted',
    idx: -1,
    lastIdx: -1,
    lastVal: null,
    key: null,
    tag: null,
    hint: null,
    note: `7 次调用执行完毕，集合中剩下 [${nums.join(', ')}]，输出 ${OUTPUT}，与题解示例一致。三种操作平均都是 O(1)：insert 查表后追加到末尾；remove 用末尾元素覆盖被删位置再截断数组；getRandom 在紧凑数组上等概率取下标，valToIdx 始终提供「值 → 下标」的 O(1) 定位。空间 O(n)：数组与哈希表各存一份元素。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const CHIP =
  'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold transition-colors duration-200'

const CHIP_TONE = {
  easy: 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  amber: 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
  teal: 'border-[hsl(var(--teal))]/50 bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]',
  hard: 'border-[hsl(var(--hard))]/40 bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
  muted: 'border-border bg-[hsl(var(--ink)/0.18)] text-ink-soft',
} as const

/** 单元格状态：琥珀=当前操作位置，青绿=搬入的新位置，红=本次返回 false 的原因，灰=已删除 */
function cellStateOf(step: Step, i: number): CellState {
  switch (step.phase) {
    case 'append':
    case 'random':
      return i === step.idx ? 'active' : 'idle'
    case 'reject':
      return i === step.idx ? 'bad' : 'idle'
    case 'locate':
      return i === step.idx || i === step.lastIdx ? 'active' : 'idle'
    case 'move':
      return i === step.idx ? 'new' : i === step.lastIdx ? 'active' : 'idle'
    case 'pop':
      return i === step.idx && i < step.nums.length ? 'ok' : 'idle'
    case 'done':
      return 'ok'
    default:
      return 'idle'
  }
}

/** 旗标：换位时「末位来源」用琥珀、「搬入位置」用青绿，成对出现以显示对应关系 */
function flagOf(step: Step, i: number): { label?: string; tone?: Tone } {
  switch (step.phase) {
    case 'append':
      return i === step.idx ? { label: '新位', tone: 'amber' } : {}
    case 'reject':
      return i === step.idx ? { label: '重复', tone: 'hard' } : {}
    case 'random':
      return i === step.idx ? { label: '随机', tone: 'amber' } : {}
    case 'locate':
      if (i === step.idx) return { label: '待删', tone: 'amber' }
      if (i === step.lastIdx) return { label: '末位', tone: 'amber' }
      return {}
    case 'move':
      if (i === step.idx) return { label: '搬入', tone: 'teal' }
      if (i === step.lastIdx) return { label: '末位', tone: 'amber' }
      return {}
    default:
      return {}
  }
}

function chipClassOf(step: Step, k: number): string {
  const pos = step.map[k]
  if (pos === undefined) return CHIP_TONE.muted
  if (step.phase === 'move' && k === step.lastVal) return CHIP_TONE.teal
  if (step.phase === 'reject' && k === step.key) return CHIP_TONE.hard
  if (step.phase === 'append' && k === step.key) return CHIP_TONE.amber
  if (step.phase === 'locate' && (k === step.key || k === step.lastVal)) return CHIP_TONE.amber
  if (step.phase === 'move' && k === step.key) return CHIP_TONE.amber
  if (step.phase === 'random' && k === step.key) return CHIP_TONE.amber
  return CHIP_TONE.easy
}

function Stage(step: Step) {
  const done = step.phase === 'done'

  return (
    <div className="flex flex-col items-center gap-3">
      <Badge tone={step.opTone}>{step.op}</Badge>

      {/* 双视图：左数组行、右哈希表行（窄屏改为上下排列） */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
        {/* 左：动态数组 nums */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:items-start">
          <span className="text-[11px] text-ink-soft">动态数组 nums（下标 → 值）</span>

          {step.nums.length === 0 ? (
            <div className="flex h-9 items-center justify-center rounded-md border-[1.5px] border-dashed border-border px-3 font-code text-[13px] text-ink-soft sm:h-11">
              空
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-2">
              {step.nums.map((v, i) => {
                const f = flagOf(step, i)
                return (
                  <div key={i} className="flex min-w-0 flex-col items-center">
                    <Flag label={f.label} tone={f.tone} />
                    <Cell state={cellStateOf(step, i)}>{v}</Cell>
                    <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
                  </div>
                )
              })}
            </div>
          )}

          {step.tag && (
            <span className="font-code text-[11px] leading-relaxed text-ink-soft">{step.tag}</span>
          )}
        </div>

        {/* 右：哈希表 valToIdx */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:items-start">
          <span className="text-[11px] text-ink-soft">哈希表 valToIdx（值 → 下标）</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {KEYS.map((k) => {
              const pos = step.map[k]
              return (
                <span key={k} className={cn(CHIP, chipClassOf(step, k))}>
                  {k} → {pos === undefined ? '—' : pos}
                </span>
              )
            })}
          </div>
          <span className="text-[10px] text-ink-soft">— 表示该值当前不在集合中</span>
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="集合大小" value={step.nums.length} />
        <Stat label="valToIdx 条目" value={Object.keys(step.map).length} tone="teal" />
        <Stat label="本次返回" value={step.ret} tone={step.retTone} />
        {step.hint && <Hint>{step.hint}</Hint>}
        {done && (
          <Answer>
            输出 <span className="font-code">{OUTPUT}</span>，集合剩下{' '}
            <span className="font-code">[{step.nums.join(', ')}]</span>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function InsertDeleteGetRandomO1Demo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="数组 + 哈希表：末尾覆盖式删除"
      info={`按题解示例依次执行 insert(1)、remove(2)、insert(2)、getRandom()、remove(1)、insert(2)、getRandom()，输出 ${OUTPUT}，共 ${steps.length} 步。为看清「末尾元素换到被删位置」的过程，getRandom() 用题解输出对应的固定随机下标（1 与 0），而非每次刷新重掷随机数。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前操作位置：新插入位 / 待删下标 / 末位来源 / 随机抽中' },
        { color: TONE.teal, label: '搬入的新位置，及其改写后的映射' },
        { color: TONE.easy, label: '已落定的有效元素与映射' },
        { color: TONE.hard, label: '本次返回 false：值已存在或值不存在' },
        { color: TONE.muted, label: '已删除 / 未登记的键' },
      ]}
    />
  )
}
