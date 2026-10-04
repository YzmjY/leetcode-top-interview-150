import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 18. 整数转罗马数字 —— 模式 A：数值-符号表 + 单向指针的贪心减数          */
/* ------------------------------------------------------------------ */

/** 题解示例 5：1994 = M + CM + XC + IV，一次覆盖三个减法特例。 */
const NUM = 1994

/** 题解给出的 13 组「数值 + 符号」，严格按数值降序（900 在 500 前、400 在 100 前） */
const PAIRS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** 每行 7 项（13 项排成 7 + 6），窄屏下每格仍有约 44px，不会溢出 */
const COLS = 7

interface Step {
  /** 本步正在检查的表项下标；done 步为 PAIRS.length（指针已越过表尾） */
  i: number
  /** 剩余数值 */
  num: number
  /** 本步检查 / 消耗的表项数值；init 与 done 为 null */
  value: number | null
  /** 本步检查 / 消耗的符号；init 与 done 为 null */
  symbol: string | null
  /** 已输出的罗马数字串（不可变快照） */
  roman: string
  /** 本步刚追加到 roman 的字符数（0 或该符号的长度） */
  justAdded: number
  /** used[k]：表项 k 是否已被消耗过（不可变快照） */
  used: boolean[]
  /** checked[k]：表项 k 是否已被指针 i 检查过（被消耗或被跳过；不可变快照） */
  checked: boolean[]
  phase: 'init' | 'take' | 'skip' | 'done'
  /** 下一步动作（Hint 文案） */
  hint: string
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const used = PAIRS.map(() => false)
  const checked = PAIRS.map(() => false)
  let num = NUM
  let roman = ''

  /** 本项用不上时的下一步动作 */
  const moveHint = (i: number, cur: number): string => {
    const next = PAIRS[i + 1]
    if (!next) return '表中已无更小的表项，输出 roman'
    return `i 右移到 ${next[0]}（${next[1]}），num = ${cur} 继续与它比较`
  }

  steps.push({
    i: 0,
    num,
    value: null,
    symbol: null,
    roman,
    justAdded: 0,
    used: used.slice(),
    checked: checked.slice(),
    phase: 'init',
    hint: `比较 values[0] = ${PAIRS[0][0]}（${PAIRS[0][1]}）与 num = ${NUM}`,
    note: `观察：num = ${NUM}，roman = ""，13 组「数值 + 符号」已按数值降序排好（含 CM / XC / IV 等 6 个减法特例）。判断：标准写法的首位符号恰好是不超过剩余数的最大表项，所以指针 i 只需从表头单向右移。动作：拿 values[0] 与 num 比较，准备第一次贪心匹配。`,
  })

  for (let i = 0; i < PAIRS.length && num > 0; i++) {
    const [value, symbol] = PAIRS[i]
    checked[i] = true

    if (num < value) {
      steps.push({
        i,
        num,
        value,
        symbol,
        roman,
        justAdded: 0,
        used: used.slice(),
        checked: checked.slice(),
        phase: 'skip',
        hint: moveHint(i, num),
        note: `观察：values[${i}] = ${value}（${symbol}），而 num = ${num}。判断：${value} > ${num}，这个符号比剩余数还大，本次转换一次都用不上。动作：跳过它、i 右移去试更小的表项，num 与 roman 都保持不变。`,
      })
      continue
    }

    const before = num
    num -= value
    roman += symbol
    used[i] = true
    steps.push({
      i,
      num,
      value,
      symbol,
      roman,
      justAdded: symbol.length,
      used: used.slice(),
      checked: checked.slice(),
      phase: 'take',
      hint:
        num === 0
          ? 'num 已归零，循环结束，输出 roman'
          : num >= value
            ? `num = ${num} 仍 ≥ ${value}，${symbol} 可以再用一次`
            : moveHint(i, num),
      note: `观察：${before} ≥ ${value}，${symbol} 是当前能用的最大符号。判断：贪心取它 —— 标准写法在该数位上的首位符号正是不超过剩余数的最大表项。动作：num = ${before} − ${value} = ${num}，并把 "${symbol}" 追加到 roman 末尾。`,
    })
  }

  steps.push({
    i: PAIRS.length,
    num,
    value: null,
    symbol: null,
    roman,
    justAdded: 0,
    used: used.slice(),
    checked: checked.slice(),
    phase: 'done',
    hint: '',
    note: `观察：num = ${num}，roman = "${roman}"。判断：num 归零后更小的符号不可能再用到，循环提前结束，表尾的 1（I）尚未检查。动作：返回 "${roman}"，共 ${roman.length} 个字符；符号表固定 13 项、字符追加不超过 15 次，时间与空间都是 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const isCur = (k: number) => step.phase !== 'done' && k === step.i

  const stateOf = (k: number): CellState => {
    if (isCur(k)) return 'active'
    if (step.used[k]) return 'ok'
    return 'dim'
  }

  /** 格下状态文字：状态不靠颜色单独区分（灰态用 text-ink-soft，避免 18% 墨色文字看不清） */
  const tagOf = (k: number): { text: string; color?: string } => {
    if (isCur(k)) return { text: step.phase === 'take' ? '命中' : '当前', color: TONE.amber }
    if (step.used[k]) return { text: '已用', color: TONE.easy }
    // 先看是否已被指针检查过：done 步 i 已越过表尾，只有从未检查过的表项才算「未查」
    if (!step.checked[k]) return { text: '未查' }
    return { text: '跳过' }
  }

  /** 本步刚追加的字符在 roman 中的起始下标 */
  const fresh = step.roman.length - step.justAdded

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 贪心表：符号在格内、数值与状态在格下、指针旗标在格上 */}
      <div
        className="grid w-full gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {PAIRS.map(([value, symbol], k) => {
          const tag = tagOf(k)
          return (
            <div key={k} className="flex flex-col items-center gap-1">
              <Flag label={isCur(k) ? 'i' : undefined} tone="amber" />
              <Cell state={stateOf(k)} className="w-full min-w-0">
                {symbol}
              </Cell>
              <span className="font-code text-[11px] text-ink-soft">{value}</span>
              <span
                className="h-3.5 text-[10px] font-bold text-ink-soft"
                style={tag.color ? { color: tag.color } : undefined}
              >
                {tag.text}
              </span>
            </div>
          )
        })}
      </div>

      {/* 当前值与剩余数、已输出的罗马数字串 */}
      <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-soft">剩余 num</span>
          <span className="font-code text-2xl font-bold" style={{ color: TONE.ink }}>
            {step.num}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[11px] text-ink-soft">已输出 roman</span>
          {step.roman ? (
            <div className="flex flex-wrap items-center justify-center gap-1">
              {step.roman.split('').map((ch, idx) => (
                <Cell
                  key={idx}
                  size="sm"
                  state={step.justAdded > 0 && idx >= fresh ? 'new' : 'ok'}
                >
                  {ch}
                </Cell>
              ))}
            </div>
          ) : (
            <span className="font-code text-xs text-ink-soft">{'""'}</span>
          )}
        </div>
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="num" value={step.num} />
            <Stat label="表项数" value={PAIRS.length} />
            <Hint>{step.hint}</Hint>
          </>
        )}
        {(step.phase === 'take' || step.phase === 'skip') && (
          <>
            <Stat label="剩余 num" value={step.num} />
            <Stat
              label={step.phase === 'take' ? '本步消耗' : '本步跳过'}
              value={`${step.value} ${step.symbol}`}
              tone={step.phase === 'take' ? 'easy' : 'ink'}
            />
            <Hint>{step.hint}</Hint>
          </>
        )}
        {step.phase === 'done' && (
          <>
            <Stat label="num" value={step.num} tone="easy" />
            <Answer>
              roman = "{step.roman}"（{step.roman.length} 个字符）
            </Answer>
            <Badge>符号表固定 13 项 · 时间 O(1) · 空间 O(1)</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function IntegerToRomanDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="贪心减数：从大到小的符号表"
      info={`输入：num = ${NUM}（题解示例 5）。示例 1–3（3 / 4 / 9）各自只会消耗一个符号，看不出多个符号按值依次被取用；这里取同时覆盖 CM / XC / IV 三个减法特例的 1994，贪心全程只有 14 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步检查的表项（指针 i）' },
        { color: TONE.easy, label: '已消耗的符号 / 已写入 roman' },
        { color: TONE.teal, label: '本步刚追加到 roman 的字符' },
        { color: TONE.muted, label: '已跳过 / 未检查' },
      ]}
    />
  )
}
