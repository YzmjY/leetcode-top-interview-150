import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 29. 三数之和 —— 模式 A：排序 + 固定 i + 区间内对撞双指针               */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums = [-1, 0, 1, 2, -1, -4]（排序后 [-4, -1, -1, 0, 1, 2]） */
const INPUT = [-1, 0, 1, 2, -1, -4]

interface Step {
  /** 排序后的数组快照（对应题解「先排序，示例里的原始下标不再适用」） */
  nums: number[]
  /** 本步固定的最小数下标；-1 表示尚未固定 */
  i: number
  left: number
  right: number
  /** 上一次找到解时的 left / right，用于判断这一轮到底跨过了几个重复值 */
  prevLeft: number
  prevRight: number
  /** 右指针不可信（已推进到 left 一侧），此时不画 R 旗标 */
  rightStale: boolean
  /** 本步出现的三数之和，null 表示本步不涉及求和 */
  sum: number | null
  /** 本步之后真正发生的事：phase 值，或 'next-i'（窗口已空，外层换下一个最小数） */
  nextKind: 'init' | 'skip-i' | 'window' | 'miss' | 'found' | 'dup' | 'done' | 'next-i'
  /** 截至目前记录的三元组（数值表示），按记录顺序 */
  found: number[][]
  phase: 'init' | 'skip-i' | 'window' | 'miss' | 'found' | 'dup' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums = INPUT.slice().sort((a, b) => a - b)
  const n = nums.length
  const steps: Step[] = []
  const found: number[][] = []

  let i = 0
  let left = 0
  let right = 0
  let prevLeft = 0
  let prevRight = 0
  let rightStale = false

  const snap = (
    phase: Step['phase'],
    note: string,
    sum: number | null = null,
    nextKind: Step['nextKind'] = 'done'
  ): Step => ({
    nums: nums.slice(),
    i,
    left,
    right,
    prevLeft,
    prevRight,
    rightStale,
    sum,
    nextKind,
    found: found.map((t) => t.slice()),
    phase,
    note,
  })

  steps.push(
    snap(
      'init',
      `先排序：排序前 nums = [${INPUT.join(', ')}]，升序后为 [${nums.join(', ')}]；排序会打乱原始下标，本题解示例 1 解释里的原下标不再对应，所以下面一律按排序后的下标说。排序让相同的值相邻，既满足对撞双指针要求「区间升序」，也让去重变成「跳过相邻的相同值」。外层依次把 nums[i] 当作三元组中的最小数固定下来，内层在 [i+1, n-1] 里找两个数之和等于 -nums[i]。`
    )
  )

  for (i = 0; i < n - 2; i++) {
    if (nums[i] > 0) {
      // 剪枝：升序排列下后面不可能再凑出和为 0 的组合（注意条件是 > 0，
      // 写成 ≥ 0 会漏掉 [0, 0, 0]）。这里只 break，收尾的 done 步统一由循环之后 push，
      // 不允许剪枝分支自己再 push 一个 done。
      break
    }

    if (i > 0 && nums[i] === nums[i - 1]) {
      // 外层去重：同一个最小数只固定一次
      left = i + 1
      right = n - 1
      steps.push(
        snap(
          'skip-i',
          `观察：nums[${i}] = nums[${i - 1}] = ${nums[i]}，当前最小数与上一步固定过的相同。判断：以它作为最小数的三元组在上一步已经全部收集，再枚举一次只会产生重复结果。动作：continue 跳过本次 i，i 直接右移。`,
          null,
          'window'
        )
      )
      continue
    }

    left = i + 1
    right = n - 1
    // 新区间的两个指针都有效，复位「右指针不可信」标记，found / miss 步同样靠它保住 R 旗标
    rightStale = false
    const target = -nums[i]
    steps.push(
      snap(
        'window',
        `固定最小数 i = ${i}（nums[${i}] = ${nums[i]}），把 left 置为 i+1 = ${left}、right 置为 n-1 = ${right}。判断：需要在升序区间 [${left}, ${right}] 里找出两个数之和等于 target = -nums[${i}] = ${target} 的数对，这样三数之和才为 0。动作：从区间两端对撞——算出的和偏小就让 left 右移（换更大的数），偏大就让 right 左移（换更小的数）。`,
        null,
        left < right ? 'miss' : 'next-i'
      )
    )

    while (left < right) {
      // 本轮进入时的两个位置：dup 步要据此判断到底跨过了哪几个重复值
      prevLeft = left
      prevRight = right
      // 两个指针此刻都指向真实候选位置，R 旗标必须画出来（复位上一轮遗留的失效标记）
      rightStale = false
      const sum = nums[i] + nums[left] + nums[right]

      if (sum === 0) {
        found.push([nums[i], nums[left], nums[right]])
        steps.push(
          snap(
            'found',
            `观察：三数之和 = nums[${i}] + nums[${left}] + nums[${right}] = ${nums[i]} + ${nums[left]} + ${nums[right]} = ${sum}，正好等于 0，且 left < right 保证三个下标互不相同。判断：这是一组合法解，且排序后 [最小, 中间, 最大] 就是该三元组唯一的有序表示。动作：记录三元组 [${nums[i]}, ${nums[left]}, ${nums[right]}]。`,
            sum,
            'dup'
          )
        )

        const lSkipIdx = left
        const rSkipIdx = right
        // 内层去重：先跳过与当前值相同的 left / right，再各移动一步
        while (left < right && nums[left] === nums[left + 1]) left++
        while (left < right && nums[right] === nums[right - 1]) right--
        const nextLeft = left + 1
        const nextRight = right - 1
        const skipL = nums[lSkipIdx] === nums[lSkipIdx + 1] && lSkipIdx + 1 < rSkipIdx
        const skipR =
          nums[rSkipIdx] === nums[rSkipIdx - 1] && (skipL ? lSkipIdx + 1 : lSkipIdx) < rSkipIdx
        /** 收拢后的窗口，dup 步的「下一步」据此分叉 */
        const collapsedEmpty = nextLeft >= nextRight
        const dupNote = skipL
          ? skipR
            ? `左右两侧都有相邻的重复值（nums[${lSkipIdx}] = nums[${lSkipIdx + 1}] = ${nums[lSkipIdx]}，nums[${rSkipIdx}] = nums[${rSkipIdx - 1}] = ${nums[rSkipIdx]}），两侧各自跨过的重复值按抛弃处理`
            : `left 侧 nums[${lSkipIdx}] = nums[${lSkipIdx + 1}] = ${nums[lSkipIdx]}，跨过的这个重复值按抛弃处理；right 侧的邻居不同，没有可跳过的值`
          : skipR
            ? `right 侧 nums[${rSkipIdx}] = nums[${rSkipIdx - 1}] = ${nums[rSkipIdx]}，跨过的这个重复值按抛弃处理；left 侧的邻居不同，没有可跳过的值`
            : `两个指针的邻居都与自身不同，没有重复值可跳过，只把两个指针各向中间收拢一步`
        steps.push(
          snap(
            'dup',
            `判断：同一个三元组不能被记录两次——${dupNote}，再用这些值配对只会得到刚记录过的三元组。动作：left 收拢到 ${nextLeft}、right 收拢到 ${nextRight}（收拢后的窗口 ${
              collapsedEmpty ? '已空，内层结束' : `[${nextLeft}, ${nextRight}] 仍有区间`
            }）。`,
            sum,
            collapsedEmpty ? 'next-i' : 'miss'
          )
        )
        left = nextLeft
        right = nextRight
      } else {
        const tooSmall = sum < 0
        const nextLeft = tooSmall ? left + 1 : left
        const nextRight = tooSmall ? right : right - 1
        rightStale = !tooSmall
        const pairSum = nums[left] + nums[right]
        steps.push(
          snap(
            'miss',
            tooSmall
              ? `观察：两数之和 nums[${left}] + nums[${right}] = ${nums[left]} + ${nums[right]} = ${pairSum}，小于 target = -nums[${i}] = ${target}，三数之和 ${sum} 也就小于 0。判断：nums[${right}] = ${nums[right]} 已是区间右端，对任意 k ≤ ${right} 都有 nums[k] ≤ nums[${right}]，让 left 与它们配对只会更小，所以 nums[${left}] = ${nums[left]} 不可能参与任何解。动作：left 从 ${left} 右移到 ${nextLeft}，换一个更大的数再试。`
              : `观察：两数之和 nums[${left}] + nums[${right}] = ${nums[left]} + ${nums[right]} = ${pairSum}，大于 target = -nums[${i}] = ${target}，三数之和 ${sum} 也就大于 0。判断：nums[${left}] = ${nums[left]} 已是区间左端，对任意 k ≥ ${left} 都有 nums[k] ≥ nums[${left}]，让 right 与它们配对只会更大，所以 nums[${right}] = ${nums[right]} 不可能参与任何解。动作：right 从 ${right} 左移到 ${nextRight}，换一个更小的数再试。`,
            sum,
            // 移动后窗口若已空，下一步就不是继续对撞，而是内层结束、外层换下一个最小数
            nextLeft < nextRight ? 'miss' : 'next-i'
          )
        )
        left = nextLeft
        right = nextRight
      }
    }
  }

  rightStale = true
  if (i >= n - 2) {
    i = n - 2
    left = i + 1
    right = i
  }
  steps.push(
    snap(
      'done',
      `外层枚举结束：排序保证了最小数只会被固定一次，内层左右两个指针相撞（left ≥ right）时区间内已无候选数对，三元组也只在找到解时记录一次，所以结果不重不漏。共找到 ${found.length} 个和为 0 的不重复三元组：${
        found.length ? found.map((t) => `[${t.join(', ')}]`).join('、') : '无'
      }。时间 O(n²)（排序 O(n log n) + 外层 O(n) 次、每次 O(n) 的双指针），不计结果数组额外空间为 O(log n)。`
    )
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 已记录三元组覆盖到的下标集合，颜色之外也靠标签说明 */
function foundCells(step: Step): Set<number> {
  const nums = step.nums
  const set = new Set<number>()
  for (const t of step.found) {
    const used = new Set<number>()
    for (const v of t) {
      for (let k = 0; k < nums.length; k++) {
        if (nums[k] === v && !used.has(k) && !set.has(k)) {
          used.add(k)
          set.add(k)
          break
        }
      }
    }
  }
  return set
}

function Stage(step: Step) {
  const n = step.nums.length
  const inRange = step.i >= 0 && step.i < n
  const cur = inRange ? step.nums[step.i] : null
  const target = cur === null ? null : -cur
  const pairActive = step.left >= 0 && step.right >= 0 && step.left < step.right
  const showRight = !step.rightStale && step.right >= 0 && step.right < n
  const okCells = foundCells(step)
  /** dup 步：这一轮真正被跨过的重复值（与 buildSteps 的 skipL / skipR 同一判据） */
  const skippedLeft =
    step.phase === 'dup' &&
    step.nums[step.prevLeft] === step.nums[step.prevLeft + 1] &&
    step.prevLeft + 1 < step.prevRight
  const skippedRight =
    step.phase === 'dup' &&
    step.nums[step.prevRight] === step.nums[step.prevRight - 1] &&
    (skippedLeft ? step.prevLeft + 1 : step.prevLeft) < step.prevRight
  const nextLeft = step.left + 1
  const nextRight = step.right - 1
  /** miss 步的移动方向由本步的三数之和决定，不看指针是否「失效」 */
  const tooSmall = step.sum !== null && step.sum < 0
  /** dup 步：真正被跨过的重复值，与 buildSteps 的 skipL / skipR 同一判据 */
  const skippedText =
    skippedLeft && skippedRight
      ? `${step.nums[step.prevLeft]}（left 侧）· ${step.nums[step.prevRight]}（right 侧）`
      : skippedLeft
        ? `${step.nums[step.prevLeft]}（left 侧）`
        : skippedRight
          ? `${step.nums[step.prevRight]}（right 侧）`
          : '无，两侧邻居都不同'

  const stateOf = (k: number): CellState => {
    if (step.phase === 'init') return 'dim'
    if (step.phase === 'done') return okCells.has(k) ? 'ok' : 'dim'
    if (step.phase === 'found') {
      return k === step.i || k === step.left || k === step.right ? 'ok' : 'dim'
    }
    if (step.phase === 'skip-i') return k === step.i ? 'bad' : 'dim'
    if (k === step.i) return 'active'
    if (step.phase === 'dup') {
      if (k === step.prevLeft && skippedLeft) return 'bad'
      if (k === step.prevRight && skippedRight) return 'bad'
      if (k < step.left || k > step.right) return 'dim'
      return 'idle'
    }
    if (k < step.left || k > step.right) return 'dim'
    if (k === step.left || k === step.right) return 'new'
    return 'idle'
  }

  /** 格上旗标：字母写明身份，不靠颜色单独区分 */
  const flagOf = (k: number): { label: string; tone: 'amber' | 'teal' | 'hard' } | null => {
    if (step.phase === 'init' || step.phase === 'done') return null
    if (step.phase === 'skip-i') return k === step.i ? { label: 'i 重复', tone: 'hard' } : null
    if (k === step.i) return { label: 'i', tone: 'amber' }
    if (step.phase === 'dup') {
      if (k === step.prevLeft && skippedLeft) return { label: 'L 重复', tone: 'hard' }
      if (k === step.prevRight && skippedRight) return { label: 'R 重复', tone: 'hard' }
      return null
    }
    if (step.phase === 'found') {
      if (k === step.left) return { label: 'L', tone: 'teal' }
      if (k === step.right && showRight) return { label: 'R', tone: 'teal' }
      return null
    }
    if (k === step.left && pairActive) return { label: 'L', tone: 'teal' }
    if (k === step.right && showRight) return { label: 'R', tone: 'teal' }
    return null
  }

  const foundText = step.found.length
    ? step.found.map((t) => `[${t.join(', ')}]`).join(' ')
    : '暂无'
  /** 带下标的数值文本，数值一律走 font-code；下标越界时退化为纯数值 */
  const cellText = (list: number[]) =>
    list.map((v, idx) =>
      v >= 0 && v < step.nums.length ? (
        <span key={idx} className="font-code">
          {step.nums[v]}
        </span>
      ) : (
        <span key={idx}>—</span>
      )
    )

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：值在格内、下标在格下、旗标在格上（模式 A） */}
      <div className="flex w-full flex-wrap justify-center gap-1.5">
        {step.nums.map((v, k) => {
          const flag = flagOf(k)
          return (
            <div key={k} className="flex flex-col items-center">
              <Flag label={flag?.label} tone={flag?.tone ?? 'muted'} />
              <Cell state={stateOf(k)} className="w-full min-w-0">
                {v}
              </Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{k}</span>
            </div>
          )
        })}
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="n" value={n} tone="ink" />
            <Stat label="排序后 i 从" value="0 到 n-3" tone="amber" />
            <Stat label="已找到三元组" value={step.found.length} tone="easy" />
            <Hint>固定 i = 0，把 left 放到 i+1、right 放到 n-1，开始对撞</Hint>
          </>
        )}

        {step.phase === 'window' && (
          <>
            <Stat label="固定 i" value={step.i} tone="amber" />
            <Stat label="target" value={target ?? '—'} tone="teal" />
            <Stat label="窗口 [left, right]" value={`[${step.left}, ${step.right}]`} tone="teal" />
            <Hint>
              算 nums[{step.left}] + nums[{step.right}] ={' '}
              {step.nums[step.left] + step.nums[step.right]}，与 target = {target} 比较
            </Hint>
          </>
        )}

        {step.phase === 'miss' && (
          <>
            <Stat label="三数之和" value={step.sum ?? '—'} tone="medium" />
            <Stat label="target" value={target ?? '—'} tone="teal" />
            <Stat
              label="下一步"
              value={
                tooSmall
                  ? `left ${step.left} → ${nextLeft}`
                  : `right ${step.right} → ${step.right - 1}`
              }
              tone="teal"
            />
            {step.nextKind === 'miss' ? (
              <Hint tone="medium">
                {tooSmall
                  ? `两数之和偏小：left 右移到 ${nextLeft}，再与 nums[${step.right}] 配对`
                  : `两数之和偏大：right 左移到 ${step.right - 1}，再与 nums[${step.left}] 配对`}
              </Hint>
            ) : (
              <Hint tone="hard">
                {tooSmall
                  ? `两数之和偏小：left 右移到 ${nextLeft}；这一步之后 left = right，窗口已空，内层结束，外层换下一个最小数`
                  : `两数之和偏大：right 左移到 ${step.right - 1}；这一步之后 left = right，窗口已空，内层结束，外层换下一个最小数`}
              </Hint>
            )}
          </>
        )}

        {step.phase === 'found' && (
          <>
            <Stat label="三数之和" value={step.sum ?? '—'} tone="easy" />
            <Stat
              label="新记录"
              value={<>[ {cellText([step.i, step.left, step.right])} ]</>}
              tone="easy"
            />
            <Stat label="已找到" value={`${step.found.length} 个`} tone="easy" />
            <Hint>去重两步走：先各自跳过相邻的相同值，再各向中间收拢一步</Hint>
          </>
        )}

        {step.phase === 'dup' && (
          <>
            <Stat label="重复被丢弃" value={skippedText} tone="hard" />
            {nextLeft < nextRight && (
              <Stat
                label="收拢后窗口"
                value={<>[ {cellText([nextLeft, nextRight])} ]</>}
                tone="teal"
              />
            )}
            <Stat label="已找到" value={`${step.found.length} 个`} tone="easy" />
            {step.nextKind === 'miss' ? (
              <Hint tone="hard">
                left 再右移到 {nextLeft}、right 再左移到 {nextRight}，在更小的区间里继续对撞
              </Hint>
            ) : (
              <Hint tone="hard">
                收拢后 left = {nextLeft}、right = {nextRight}，窗口已空，内层结束；外层换下一个最小数 i
              </Hint>
            )}
          </>
        )}

        {step.phase === 'skip-i' && (
          <>
            <Stat label="重复的最小数" value={step.nums[step.i]} tone="hard" />
            <Stat label="已找到" value={`${step.found.length} 个`} tone="easy" />
            <Hint tone="hard">跳过 i = {step.i}，i 右移，同一个最小数不再固定第二次</Hint>
          </>
        )}

        {step.phase === 'done' && (
          <>
            <Stat label="三元组个数" value={step.found.length} tone="easy" />
            <Answer>
              {step.found.length} 个：
              <span className="font-code">{foundText}</span> · 时间 O(n²) · 额外空间 O(log n)
            </Answer>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function ThreeSumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="排序 + 固定一个数 + 对撞双指针"
      info={`输入取题解示例 1：nums = [${INPUT.join(', ')}]，排序后为 [-4, -1, -1, 0, 1, 2]，期望输出 [[-1, -1, 2], [-1, 0, 1]]。排序会打乱原下标，演示里所有下标都是排序后的，与示例解释中的原始下标不对应。为把步数控制在 5–40 步，每次指针移动与重复值跳过都按「一轮一步」记录，中间的点对不逐步展开，因此总步数（${steps.length} 步）小于逐一比较的次数。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'i：本轮固定的最小数' },
        { color: TONE.teal, label: 'L / R：对撞双指针' },
        { color: TONE.easy, label: '命中并记录的三元组' },
        { color: TONE.hard, label: '被跳过的重复值' },
        { color: TONE.muted, label: '当前候选区间之外' },
      ]}
    />
  )
}
