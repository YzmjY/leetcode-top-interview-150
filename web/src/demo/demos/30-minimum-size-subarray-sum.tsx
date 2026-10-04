import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 30. 长度最小的子数组 —— 模式 A：数组 + 指针（滑动窗口区间块变体）    */
/* ------------------------------------------------------------------ */

/** 题解示例 1：target = 7，nums = [2,3,1,2,4,3]，输出 2（子数组 [4,3]） */
const TARGET = 7
const NUMS = [2, 3, 1, 2, 4, 3]

interface Step {
  nums: number[]
  left: number
  right: number
  /** 窗口 nums[left..right] 的和；done 步是扫描结束时的残留和，渲染时显示为 — */
  sum: number
  /** n + 1 是「还没找到合法窗口」的哨兵值 */
  minLen: number
  /** 历史最短合法窗口的左右端点；bestL = -1 表示暂无 */
  bestL: number
  bestR: number
  /** 本步刚并入窗口的元素下标（expand 步），否则 -1 */
  added: number
  /** 本步刚被移出窗口的元素下标（shrink 步），否则 -1 */
  removed: number
  phase: 'init' | 'expand' | 'found' | 'shrink' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = NUMS.length
  const steps: Step[] = []
  let left = 0
  let sum = 0
  let minLen = n + 1
  let bestL = -1
  let bestR = -1

  const push = (
    phase: Step['phase'],
    right: number,
    added: number,
    removed: number,
    note: string
  ) => {
    steps.push({
      nums: NUMS.slice(),
      left,
      right,
      sum,
      minLen,
      bestL,
      bestR,
      added,
      removed,
      phase,
      note,
    })
  }

  push(
    'init',
    -1,
    -1,
    -1,
    `初始化：target = ${TARGET}，nums = [${NUMS.join(', ')}] 全是正整数。窗口 nums[left..right] 初始为空（right = -1），left = 0、sum = 0，minLen 先取哨兵 n + 1 = ${n + 1}，代表目前还没有找到任何合法窗口。不变量：每个 right 轮开始时 sum 等于 nums[left..right - 1] 的和，也就是上一轮留下的不达标窗口。`
  )

  for (let right = 0; right < n; right++) {
    const before = sum
    const value = NUMS[right]
    sum += value
    const reached = sum >= TARGET

    push(
      'expand',
      right,
      right,
      -1,
      `观察：right 右移到 ${right}，把 nums[${right}] = ${value} 并入窗口，sum = ${before} + ${value} = ${sum}。判断：sum = ${sum} ${
        reached ? `≥ target = ${TARGET}，窗口达标` : `< target = ${TARGET}，尚未达标`
      }。动作：${
        reached
          ? `进入内层 while，先按 ${right} - ${left} + 1 = ${right - left + 1} 记一次候选长度，再看能否移出左端元素`
          : '本轮不进内层循环，right 继续右移'
      }。为什么：元素全为正数，${
        reached
          ? '移出左端只会让和变小，同一个 right 下可以连续收缩出更短的合法窗口'
          : '只有继续扩右边界才能让窗口和变大'
      }。`
    )

    while (sum >= TARGET) {
      const curLen = right - left + 1
      const prevMin = minLen
      const improved = curLen < minLen
      if (improved) {
        minLen = curLen
        bestL = left
        bestR = right
      }

      push(
        'found',
        right,
        -1,
        -1,
        `观察：窗口 nums[${left}..${right}] 的和 sum = ${sum} ≥ ${TARGET}，是一个合法解，长度 = ${right} - ${left} + 1 = ${curLen}。判断：${
          improved
            ? prevMin > n
              ? `此前 minLen 还是哨兵 ${n + 1}，没有任何合法解可比`
              : `${curLen} < 当前 minLen = ${prevMin}，更短`
            : `${curLen} 不小于当前 minLen = ${prevMin}`
        }。动作：${
          improved
            ? `刷新 minLen = ${curLen}，历史最短区间记为 nums[${left}..${right}]`
            : 'minLen 保持不变'
        }。为什么：长度必须在移出 nums[${left}] 之前算出来，否则量到的是收缩之后的窗口。`
      )

      const removed = left
      const removedValue = NUMS[left]
      const sumBefore = sum
      sum -= NUMS[left]
      left++

      push(
        'shrink',
        right,
        -1,
        removed,
        `观察：把 nums[${removed}] = ${removedValue} 移出窗口，sum = ${sumBefore} - ${removedValue} = ${sum}，left 右移到 ${left}。判断：sum = ${sum} ${
          sum >= TARGET ? `仍 ≥ ${TARGET}，内层循环继续` : `< ${TARGET}，窗口不再达标`
        }。动作：${
          sum >= TARGET
            ? `下一步继续记录 nums[${left}..${right}] 的长度，并再移出一个左端元素`
            : right + 1 < n
              ? `退出内层循环，回到外层把 right 右移到 ${right + 1}`
              : '退出内层循环，此时 right 已到数组末尾，扫描结束'
        }。为什么：${
          sum >= TARGET
            ? '还有机会找到更短的合法窗口'
            : '全为正数，再移出左端只会让和更小，本轮不可能再达标'
        }。`
      )
    }
  }

  const answer = minLen > n ? 0 : minLen

  push(
    'done',
    n - 1,
    -1,
    -1,
    answer === 0
      ? `扫描结束：right 越过末尾，全程没有出现 sum ≥ ${TARGET} 的窗口，minLen 仍是哨兵 ${n + 1}。动作：据此返回 0，表示不存在满足条件的连续子数组。为什么：每个合法子数组都有自己的右端点，所有 right 都试过仍无解。复杂度：right 与 left 都只单调右移，每个元素进入、离开窗口各一次，时间 O(n)，空间 O(1)。`
      : `扫描结束：right 越过末尾，最终 minLen = ${answer}，对应子数组 nums[${bestL}..${bestR}] = [${NUMS.slice(bestL, bestR + 1).join(', ')}]。为什么最小：每个合法子数组都有自己的右端点，收缩循环对该 right 从长到短试完了所有合法窗口并留下最短的那个，遍历全部 right 即得全局最短。复杂度：right 与 left 都只单调右移，每个元素进入、离开窗口各一次，时间 O(n)，空间 O(1)。`
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  const n = step.nums.length
  if (step.phase === 'done') return null
  if (step.phase === 'init') return `right 右移到 0，读入 nums[0] = ${step.nums[0]}`
  if (step.phase === 'found')
    return `移出 nums[${step.left}] = ${step.nums[step.left]}，left 右移到 ${step.left + 1}`
  if (step.phase === 'expand' && step.sum >= TARGET)
    return `进入收缩循环：先记录长度 ${step.right - step.left + 1}，再移出 nums[${step.left}]`
  if (step.phase === 'shrink' && step.sum >= TARGET)
    return `sum = ${step.sum} 仍 ≥ ${TARGET}，继续记录长度并再收缩一次`
  if (step.right + 1 < n)
    return `right 右移到 ${step.right + 1}，读入 nums[${step.right + 1}] = ${step.nums[step.right + 1]}`
  return 'right 越界，扫描结束，按 minLen 输出答案'
}

function Stage(step: Step) {
  const n = step.nums.length
  const done = step.phase === 'done'
  /** 当前窗口是 [left..right]，结束时改为高亮历史最短区间 */
  const winL = done ? step.bestL : step.left
  const winR = done ? step.bestR : step.right
  const hasWindow = winL >= 0 && winR >= winL
  const minLenText = step.minLen > n ? '∞' : String(step.minLen)
  const bestText =
    step.bestL >= 0 ? step.nums.slice(step.bestL, step.bestR + 1).join(', ') : ''
  const hint = nextAction(step)

  const stateOf = (i: number): CellState => {
    if (done) return i >= winL && i <= winR ? 'ok' : 'dim'
    if (i === step.removed) return 'warn'
    if (i === step.added) return 'active'
    if (hasWindow && i >= winL && i <= winR) return 'ok'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[520px]">
        {/* 状态标：刚达标 / 刚被移出窗口 */}
        <div className="flex h-4 w-full">
          {step.nums.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-end justify-center">
              {!done && i === step.removed && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--medium))]">
                  移出
                </span>
              )}
              {!done && i === step.right && step.sum >= TARGET && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">
                  达标
                </span>
              )}
              {done && i === step.bestL && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">
                  最短子数组
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 指针旗标：left 与 right 同格时上下并列 */}
        <div className="flex h-12 w-full">
          {step.nums.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {!done && i === step.left && <Flag label="left" tone="amber" />}
              {!done && i === step.right && <Flag label="right" tone="teal" />}
            </div>
          ))}
        </div>

        {/* 数字行：窗口 [left..right] 用半透明琥珀底色块整体包裹 */}
        <div className="relative flex w-full">
          {hasWindow && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] transition-all duration-300',
                done
                  ? 'demo-pulse border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15'
                  : 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15'
              )}
              style={{
                left: `${(winL / n) * 100}%`,
                width: `${((winR - winL + 1) / n) * 100}%`,
              }}
            />
          )}
          {step.nums.map((v, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(i)} className="w-full min-w-0 sm:min-w-0">
                {v}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="mt-1 flex w-full">
          {step.nums.map((_, i) => (
            <span key={i} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {i}
            </span>
          ))}
        </div>

        {/* 历史最短区间（尚未找到时为空） */}
        <div className="mt-1 flex h-4 w-full items-center justify-center">
          {step.bestL >= 0 ? (
            <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">
              历史最短 nums[{step.bestL}..{step.bestR}] = [{bestText}]，长度 {step.minLen}
            </span>
          ) : (
            <span className="whitespace-nowrap font-code text-[10px] text-ink-soft">
              历史最短：暂无合法窗口
            </span>
          )}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="窗口和 sum" value={done ? '—' : step.sum} tone="amber" />
        <Stat
          label="窗口长度"
          value={done ? '—' : step.right >= step.left ? step.right - step.left + 1 : 0}
          tone="teal"
        />
        <Stat label="历史最短 minLen" value={minLenText} tone="easy" />
        {hint && <Hint>{hint}</Hint>}
        {done && (
          <Answer>
            {step.minLen > n ? (
              <>
                {`不存在和 ≥ `}
                <span className="font-code">{TARGET}</span>
                {` 的子数组，返回 `}
                <span className="font-code">0</span>
              </>
            ) : (
              <>
                <span className="font-code">{`minLen = ${step.minLen}`}</span>
                {`，最短子数组 `}
                <span className="font-code">{`nums[${step.bestL}..${step.bestR}] = [${bestText}]`}</span>
              </>
            )}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MinimumSizeSubarraySumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="长度最小的子数组：变长滑动窗口"
      info={`target = ${TARGET}，nums = [${NUMS.join(', ')}]（题解示例 1，答案 2，对应子数组 [4, 3]；它是题解中最小的示例，能完整看到一次扩展与连续收缩）。窗口 nums[left..right] 用琥珀色块标出，sum ≥ target 时收缩左边界并在移除之前刷新历史最短 minLen。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前窗口 nums[left..right] 及 right 刚并入的元素' },
        { color: TONE.easy, label: '窗口内元素；结束时高亮最短子数组' },
        { color: TONE.medium, label: '刚被移出窗口的元素' },
        { color: TONE.muted, label: '窗口外未处理' },
      ]}
    />
  )
}
