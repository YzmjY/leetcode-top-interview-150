import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Flag, Hint, Link, Node, Stat, TONE } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 58. 两数相加 —— 模式 D：两条逆序链表逐位相加 + 进位 carry            */
/* ------------------------------------------------------------------ */

/** 题解示例 1（最有代表性且规模最小）：l1 = [2,4,3] 表示 342，l2 = [5,6,4] 表示 465，和 807 逆序存为 [7,0,8] */
const L1 = [2, 4, 3]
const L2 = [5, 6, 4]

/** 已处理 / 待填的位置：虚线 + 18% ink 灰底，与 TONE.muted 同值 */
const CONSUMED = 'border-dashed bg-[hsl(var(--ink)/0.18)] text-ink-soft'
/** 本位产生进位：medium 橙（Node 没有 medium 状态，用同值类名表达） */
const CARRY = 'border-[hsl(var(--medium))] bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]'

/** 逆序链表读回十进制值：表头是最低位 */
function num(digits: number[]): number {
  let v = 0
  for (let k = digits.length - 1; k >= 0; k--) v = v * 10 + digits[k]
  return v
}

interface Step {
  phase: 'init' | 'sum' | 'write' | 'done'
  /** 本步处理的位（0 = 个位，从低位算起） */
  pos: number
  /** 舞台固定的列数 = 结果位数，避免逐位生长时列宽跳动（最后统一回填） */
  slots: number
  /** 结果链上已写入的位（不含 dummy） */
  digits: number[]
  /** 本位从两条链读到的数字；null = 该链已走完，按 0 参与相加 */
  v1: number | null
  v2: number | null
  /** 本位三数之和（init / done 为 null） */
  sum: number | null
  /** 本位写入结果链的数字；sum 步还没写入，为 null */
  digit: number | null
  /** 本轮相加前的 carry / 本位算出的新 carry（sum 步尚未更新，carryOut 为 null） */
  carryIn: number
  carryOut: number | null
  /** 已处理过的位里哪些位产生过进位，下标 = 位序号 */
  carryFlags: boolean[]
  note: string
  /** 真正的下一步动作，由后一个快照回填（Hint 的「下一步：」前缀是组件硬编码的） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const digits: number[] = []
  const carryFlags: boolean[] = []
  let carry = 0
  let pos = 0

  steps.push({
    phase: 'init',
    pos: 0,
    slots: 0,
    digits: [],
    v1: null,
    v2: null,
    sum: null,
    digit: null,
    carryIn: 0,
    carryOut: null,
    carryFlags: [],
    next: '',
    note:
      `观察：l1 = [${L1.join(', ')}] 是 ${num(L1)} 的逆序存储（表头 ${L1[0]} 就是个位），l2 = [${L2.join(', ')}] 是 ${num(L2)} 的逆序存储；carry = 0，结果链上只有哨兵 dummy、cur 停在 dummy。` +
      `判断：逆序存储恰好和竖式加法从最低位算起的方向一致，顺着链表往后走就是逐位相加，完全不需要反转链表。` +
      `动作：进入循环（条件 l1 != nil || l2 != nil || carry > 0），每轮先读两条链本轮的位并求和。` +
      `为什么：dummy 占位让结果链的第一个节点不必特判，最后返回 dummy.Next 就是结果链的头节点。`,
  })

  while (pos < L1.length || pos < L2.length || carry > 0) {
    const v1 = pos < L1.length ? L1[pos] : null
    const v2 = pos < L2.length ? L2[pos] : null
    const carryIn = carry
    const sum = (v1 ?? 0) + (v2 ?? 0) + carryIn
    const digit = sum % 10
    const carryOut = Math.floor(sum / 10)
    carryFlags.push(carryOut > 0)

    const read1 = v1 === null ? 'l1 已走完（本位按 0 算）' : `l1[${pos}] = ${v1}`
    const read2 = v2 === null ? 'l2 已走完（本位按 0 算）' : `l2[${pos}] = ${v2}`

    steps.push({
      phase: 'sum',
      pos,
      slots: 0,
      digits: digits.slice(),
      v1,
      v2,
      sum,
      digit: null,
      carryIn,
      carryOut: null,
      carryFlags: carryFlags.slice(),
      next: '',
      note:
        `观察：${read1}、${read2}，加上 carry ${carryIn} 得 sum = ${v1 ?? 0} + ${v2 ?? 0} + ${carryIn} = ${sum}。` +
        `判断：${
          sum >= 10
            ? `sum ≥ 10，这一位会产生进位：carryOut = ${sum} / 10 = ${carryOut}，本位只留 ${digit}`
            : `sum < 10，这一位不产生进位：carryOut = ${sum} / 10 = ${carryOut}`
        }。` +
        `动作：先把 sum 算出来，本位数字 ${digit} 留到下一个动作接进结果链。` +
        `为什么：每位最大 9、carry 最大 1，所以 sum ≤ 19，逢十进一的进位只可能是 0 或 1。`,
    })

    digits.push(digit)
    carry = carryOut
    const more = pos + 1 < L1.length || pos + 1 < L2.length || carryOut > 0

    steps.push({
      phase: 'write',
      pos,
      slots: 0,
      digits: digits.slice(),
      v1,
      v2,
      sum,
      digit,
      carryIn,
      carryOut,
      carryFlags: carryFlags.slice(),
      next: '',
      note:
        `观察：sum = ${sum}，本位 = ${sum} % 10 = ${digit}，新进位 = ${sum} / 10 = ${carryOut}。` +
        `判断：${
          carryOut > 0
            ? `本位写下的 ${digit} 是结果的第 ${pos} 位，多出来的进位 ${carryOut} 要带到第 ${pos + 1} 位继续相加`
            : more
              ? `本位没有进位，两条链还剩第 ${pos + 1} 位要处理`
              : `这是两条链的最后一位，既没有节点剩下、也没有进位要处理`
        }。` +
        `动作：新建节点 ${digit} 接到 cur.Next，cur 前进到它，carry 更新为 ${carryOut}，结果链变成 [${digits.join(', ')}]。` +
        `为什么：${
          more
            ? `每轮只追加一个节点、carry 只由本轮 sum 决定，结果链的位数始终等于已处理的位数`
            : `循环条件 l1 != nil || l2 != nil || carry > 0 三条都不成立，说明所有位都算完了，可以退出`
        }。`,
    })

    pos += 1
  }

  const last = steps[steps.length - 1]
  steps.push({
    phase: 'done',
    pos: last.pos,
    slots: 0,
    digits: digits.slice(),
    v1: null,
    v2: null,
    sum: null,
    digit: null,
    carryIn: 0,
    carryOut: null,
    carryFlags: carryFlags.slice(),
    next: '',
    note:
      `观察：循环结束时 l1、l2 都走到了 nil、carry = 0，结果链是 [${digits.join(', ')}]（最高位第 ${last.pos} 位：${last.v1 ?? 0} + ${last.v2 ?? 0} + carry ${last.carryIn} = ${last.sum}，没有进位外溢）。` +
      `判断：把这条逆序链读回来就是 ${digits.slice().reverse().join('')}，等于 ${num(L1)} + ${num(L2)} = ${num(L1) + num(L2)}，与竖式相加一致；dummy 只是哨兵，不属于结果。` +
      `动作：返回 dummy.Next，也就是结果链的头节点 ${digits[0]}。` +
      `为什么：每位只读一次、只写一次，时间 O(max(n, m))（最高位还有进位时会多跑一轮）；空间是结果链本身的 O(max(n, m))，除 dummy、cur、carry 外没有额外结构。`,
  })

  // 列数与「下一步动作」统一回填：Hint 的「下一步：」前缀是组件硬编码的
  const slots = Math.max(L1.length, L2.length, digits.length)
  steps.forEach((s, i) => {
    s.slots = slots
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'sum') {
      const a1 = b.v1 === null ? 'l1（已走完，补 0）' : `l1[${b.pos}] = ${b.v1}`
      const a2 = b.v2 === null ? 'l2（已走完，补 0）' : `l2[${b.pos}] = ${b.v2}`
      s.next = `读 ${a1}、${a2}，与 carry ${b.carryIn} 相加求本位`
    } else if (b.phase === 'write') {
      s.next = `本位 = ${b.sum} % 10 = ${b.digit} 接到结果链尾部，新进位 carry = ${b.sum} / 10 = ${b.carryOut}`
    } else {
      s.next = '两条链都走完且 carry = 0，返回 dummy.Next 读出结果'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 行首标签列：三行同宽同高，节点才能按位对齐 */
function RowLabel({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-8 shrink-0 items-center justify-end pr-1 font-code text-[11px] font-bold text-ink-soft',
        className
      )}
    >
      {children}
    </div>
  )
}

/** 与 Link 完全同宽的占位盒：Link 带 -mx-px，占位不带就会让三行错位 */
function LinkGap() {
  return <div aria-hidden className="-mx-px w-6 shrink-0" />
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** l1 / l2 的旗标只在「读取本位」时出现：write 步里两条链的头指针已经前移，不再标出 */
  const reading = step.phase === 'init' || step.phase === 'sum'
  const written = step.digits.length
  const carryNow = step.phase === 'write' ? (step.carryOut ?? 0) : step.carryIn
  const cols = Array.from({ length: step.slots }, (_, k) => k)
  const curOnDummy = !done && written === 0
  /** 本步新建的边：第 k 个结果节点左边那条（0 号边即 dummy → 结果头节点） */
  const activeLink = step.phase === 'write' ? written - 1 : -1

  /** 输入节点状态：产生过进位的位用 medium 橙，读过的位转虚线灰 */
  const inputNode = (k: number, side: 'l1' | 'l2') => {
    if (step.carryFlags[k] === true) return { state: 'idle' as const, cls: CARRY }
    if (done || k < step.pos) return { state: 'idle' as const, cls: CONSUMED }
    if (k === step.pos)
      return { state: side === 'l1' ? ('active' as const) : ('teal' as const), cls: undefined }
    return { state: 'idle' as const, cls: undefined }
  }

  const inputRow = (side: 'l1' | 'l2', values: number[]) => (
    <div className="flex w-full items-start">
      <RowLabel className="mt-6 h-11">{side}</RowLabel>
      {/* 对齐结果行的 dummy 列 */}
      <div aria-hidden className="w-10 shrink-0" />
      <LinkGap />
      {cols.map((k) => {
        const s = inputNode(k, side)
        return (
          <Fragment key={k}>
            {k > 0 && <Link />}
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <Flag
                label={reading && k === step.pos ? side : undefined}
                tone={side === 'l1' ? 'amber' : 'teal'}
              />
              <Node className={cn('w-full min-w-0', s.cls)} state={s.state}>
                {k < values.length ? values[k] : '·'}
              </Node>
            </div>
          </Fragment>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-[11px] text-ink-soft">
        三条链按位对齐：左边是链表头（个位），向右依次是十位、百位
      </p>

      <div className="flex w-full flex-col gap-2">
        {inputRow('l1', L1)}
        {inputRow('l2', L2)}

        {/* 结果链：dummy 哨兵在最左，新节点从左边按位长出来 */}
        <div className="mt-1 flex w-full items-start">
          <RowLabel className="mt-6 h-11">结果</RowLabel>
          <div className="flex w-10 shrink-0 flex-col items-center">
            <Flag label={curOnDummy ? 'cur' : undefined} tone="amber" />
            <Node className="w-full min-w-0 border-dashed px-1 text-[10px] font-normal text-ink-soft">
              dummy
            </Node>
          </div>
          {cols.map((k) => {
            const has = k < written
            const curHere = !done && written > 0 && k === written - 1
            return (
              <Fragment key={k}>
                <Link active={k === activeLink} />
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <Flag label={curHere ? 'cur' : undefined} tone="amber" />
                  <Node
                    className={cn('w-full min-w-0', has ? undefined : CONSUMED)}
                    state={has ? 'ok' : 'idle'}
                  >
                    {has ? step.digits[k] : '·'}
                  </Node>
                </div>
              </Fragment>
            )
          })}
        </div>

        {/* 位序号（从低位算起） */}
        <div className="flex w-full items-center">
          <RowLabel>位</RowLabel>
          <div aria-hidden className="h-6 w-10 shrink-0" />
          <LinkGap />
          {cols.map((k) => (
            <Fragment key={k}>
              {k > 0 && <LinkGap />}
              <div className="flex min-w-0 flex-1 justify-center">
                <span className="font-code text-[11px] text-ink-soft">{k}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        <Badge tone={carryNow > 0 ? 'medium' : 'plain'}>
          进位 carry{step.phase === 'write' ? '（更新后）' : ''}{' '}
          <b className="font-code">{carryNow}</b>
        </Badge>
        <Stat
          label="结果链已写入"
          value={written > 0 ? `[${step.digits.join(', ')}]` : '—'}
          tone="easy"
        />
        {step.phase === 'sum' && (
          <Badge tone={(step.sum ?? 0) >= 10 ? 'medium' : 'plain'}>
            本位 <b className="font-code">{step.v1 ?? 0}</b> + <b className="font-code">{step.v2 ?? 0}</b> +
            carry <b className="font-code">{step.carryIn}</b> = <b className="font-code">{step.sum}</b>
            {(step.sum ?? 0) >= 10 ? '（≥ 10 产生进位）' : ''}
          </Badge>
        )}
        {done ? (
          <Answer>
            结果链 <b className="font-code">[{step.digits.join(', ')}]</b> 逆序表示{' '}
            <b className="font-code">{num(step.digits)}</b>
          </Answer>
        ) : (
          <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function AddTwoNumbersDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="逐位相加 + 进位（dummy 哨兵建结果链）"
      info={`输入取题解示例 1：l1 = [${L1.join(', ')}]（逆序存 ${num(L1)}）、l2 = [${L2.join(', ')}]（逆序存 ${num(L2)}）→ 输出 [7, 0, 8] 即 807，共 ${steps.length} 步。选它是因为它是题解中规模最小、又真的产生过一次进位（4 + 6 = 10）的示例；每个位拆成「求和」和「写位」两个动作，所以能看到 carry 的产生与传递，l1 / l2 的旗标只在读取本位时出现。示例 1 两条链等长、最高位没有进位外溢，因此题解示例 3（9999999 + 9999）才覆盖的「短链补 0」和「末尾补一个进位节点」在本题演示里不会出现。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前位：l1 指针、cur 指针与本步新建的边（加粗）' },
        { color: TONE.teal, label: '对照位：l2 指针' },
        { color: TONE.medium, label: '本位相加 ≥ 10，产生进位' },
        { color: TONE.easy, label: '结果链上已写入的位' },
        { color: TONE.muted, label: '已处理 / 待填的位（虚线灰）' },
      ]}
    />
  )
}
