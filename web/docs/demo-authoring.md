# 演示组件撰写契约

> 设计规范与模式库的完整来源：`web/docs/demo-redesign-plan.md`
> 本文是**动手写代码时的唯一操作手册**。写一道题之前只需读：本文 + 本题题解 markdown + 本题旧实现 + **一个**同模式的参照实现。

---

## 1. 交付物：一个文件，命名即注册

```
web/src/demo/demos/<slug>.tsx
```

- **`<slug>` 就是本题题解 markdown 的文件名去掉 `.md`**，它**本身已经包含题号**，不要在前面再加一次题号。
  正确：`16-trapping-rain-water.tsx`、`137-climbing-stairs.tsx`、`01-merge-sorted-array.tsx`
  错误：`16-16-trapping-rain-water.tsx`、`137-137-climbing-stairs.tsx`
- 权威做法：直接照抄 `docs/<章节目录>/<题号>-<slug>.md` 的文件名，把 `.md` 换成 `.tsx`。
- `registry.tsx` 用 `import.meta.glob` 按文件名开头的数字自动挂载题号，**你不需要也不允许改 registry.tsx**。
- `stage.tsx` 是共享元件库，**已冻结，不要改**。若确实缺少某个通用元件，请在汇报里提出，由维护者统一添加。
- **除你自己的这一个文件外，不要改动任何其他文件**（含 `DemoShell.tsx`、`legacy/`、`docs/`、`registry.tsx`、`stage.tsx`）。

---

## 2. 文件骨架（照抄）

```tsx
import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* <题号>. <题名> —— 模式 <X>：<一句话描述>                              */
/* ------------------------------------------------------------------ */

/** 固定的示例输入（说明取自题解哪个示例） */
const INPUT = [/* ... */]

interface Step {
  // 这一步渲染需要的全部状态（指针位置、数组快照、累计值、阶段标记…）
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  // 用真实算法跑一遍 INPUT，每轮 push 一个不可变快照（数组 .slice()）
  // 必须包含 init（初始状态讲解）、中间每步、done（结论陈述）
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  // 纯函数渲染：同一个 step 任何时候渲染结果一致
  // 不要在这里改状态、不要定时器
}

export default function <题名>Demo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="…"
      info={`…`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '…' },
        { color: TONE.teal, label: '…' },
        { color: TONE.easy, label: '…' },
      ]}
    />
  )
}
```

---

## 3. 步骤数据规范

1. **第一步永远是 `init`**：输入是什么、变量怎么初始化、不变量是什么。
2. **最后一步永远是 `done`**：最终答案、答案怎么读出来、复杂度一句话。
3. 中间每步的 `note` **严格 2–4 句**，句式 **「观察 → 判断 → 动作 → 为什么」**。
   旧实现的文案普遍 4–6 句且冗长，**必须精简**：保留算法事实与关键数值，删掉铺垫与重复。
4. **算法事实不许编造**。数值、指针位置、下标、比较结果一律以题解 markdown 为准。
   注意边界情形（相等、越界、空集）不要硬套「谁大谁小」的叙述 —— 例：两侧相等时**不存在**「短板」。
5. 步骤数控制在 **5–40**：输入规模以「能看清每一步」为准，不要用题解里的最大示例；
   若为看清过程而换了示例输入，**必须在 `info` 里如实说明取舍**（照抄题 137 的写法）。
6. 每步快照必须不可变（`arr.slice()` / `{ ...obj }`），**禁止在渲染期修改 steps 里的数据**。

---

## 4. 可用元件（一律从 `'./stage'` 引入，不要重复造）

| 元件 | 签名 | 用途 |
|---|---|---|
| `TONE` | `Record<Tone, string>` | 语义色值表，图例与内联 `style` 取色用。**不要写任何十六进制 / rgb() 字面量** |
| `Badges` | `{ children, className? }` | 舞台下方状态条的容器（`flex flex-wrap gap-2`） |
| `Badge` | `{ children, tone?, strong? }` | 单个小徽章。`tone` 省略即中性描边徽章 |
| `Stat` | `{ label, value, tone? }` | 「名称 + 等宽数值」，显示当前值 / 最优值 |
| `Hint` | `{ children, tone? }` | 下一步动作。**前缀「下一步：」由组件硬编码**，所以文案必须是真正的下一步动作 |
| `Answer` | `{ children }` | 结论徽章「✓ 答案 …」，**只在 done 步出现** |
| `Cell` | `{ children, state?, size?, className? }` | 数组 / DP / 网格单元格。`size`: `'sm' \| 'md' \| 'lg'` |
| `Flag` | `{ label?, tone? }` | 单元格上方的指针旗标（三角 + 字母），HTML 舞台用 |
| `Pointer` | `{ x, y, label, tone? }` | SVG 舞台里的指针旗标，`x/y` 是 viewBox 坐标 |
| `Node` | `{ children, state?, className? }` | 链表节点（44px 圆角矩形）。`state`: `'idle' \| 'active' \| 'teal' \| 'ok' \| 'dim'` |
| `Link` | `{ active? }` | 节点之间的连接线；`active` 时变色加粗 |

`Tone` 取值与语义（规范 2.1，用户已建立认知，不要混用）：

| Tone | 语义 |
|---|---|
| `amber` | 当前正在处理 / 主指针 |
| `teal` | 对照指针 / 辅助结构 |
| `easy` | 已确定、正确、命中（绿） |
| `medium` | 待定、候选、警告 |
| `hard` | 冲突、丢弃、非法 |
| `water` | 区域填充、累积量 |
| `ink` | 实体元素 / 主文字 |
| `muted` | 已排除 / 未处理（灰） |

`CellState` 取值：`'idle'`（默认白底）、`'active'`（琥珀上浮+光晕）、`'ok'`（绿）、`'new'`（青绿）、`'warn'`、`'bad'`（红）、`'dim'`（18% ink 灰底 = 已排除/未处理，与 `TONE.muted` 数值一致）。

---

## 5. 硬性要求（会被逐条验收）

1. **配色**：只允许 `hsl(var(--xxx))` 形式或 `TONE.*`。零十六进制、零 `rgb()`、零命名色。
2. **数值**：一律加 `className="font-code"`（含 SVG `<text>`）。
3. **SVG**：只能用 `viewBox` + `className="w-full"` 自适应，**禁止写死像素宽度**；SVG 内文字不能吃 Tailwind 的 `text-*`，用 `className="fill-[hsl(var(--ink))]"` 或 `fill="hsl(var(--…))"`。
4. **可访问性**：指针与状态不能只靠颜色区分，必须同时有字母/文字标签（如 `L`/`R`、`slow`/`fast`、`未入队`/`当前出队`）。
5. **状态徽章 2–4 个**：`Stat` 显示当前值/最优值，`Hint` 显示下一步动作，`Answer` 只在 done 步。
6. **legend 3–5 项**，颜色用 `TONE.*`。**图例里写的状态必须在渲染里真的出现，且色值要对应**（例如「未访问」用 `TONE.muted`，那未访问格就必须是 `dim`）。
7. **纯渲染**：不许 `useState`/`useEffect`/定时器/全局副作用，不许注册键盘事件（外壳已处理 ←/→/空格）。
8. **不要自加外层 padding 或边框**（外壳已提供 `px-4 py-5 sm:px-6`）；舞台内垂直间距用 `gap-3`/`gap-4`。
9. **窄屏 640px 以下不溢出**：网格行用 `minmax(0, 1fr)` 且给 `Cell` 加 `className="w-full min-w-0"`；写死宽度只允许出现在带 `sm:` 变体的小元件上。
10. **动效克制**：可用 `index.css` 已有的 `.demo-bar`（过渡）、`.demo-water`、`.demo-pulse`（1.4s 呼吸，**一屏最多一处，只用于答案/最优解**）、`.fade-up`（一次性入场）。禁止无限循环装饰动画、禁止自动滚动、禁止声音。
11. 项目开启 `strict` + `noUnusedLocals` + `noUnusedParameters`：不要留未使用的 import 或变量。

---

## 6. 模式 → 参照实现（复制它的坐标换算与图层顺序）

| 模式 | 说明 | 参照实现（**必读**） |
|---|---|---|
| **A** 数组 + 指针 | 横向单元格行，值在格内、下标在格下、指针旗标在格上；滑窗变体用半透明琥珀块包住区间 | `03-remove-duplicates-from-sorted-array.tsx`（基础）、`31-longest-substring-without-repeating-characters.tsx`（滑窗） |
| **B** 柱状图 + 区域填充 | SVG 柱状图，柱高线性映射，区域用 `water` 22% 填充 + 虚线水位 | `16-trapping-rain-water.tsx`、`28-container-with-most-water.tsx` |
| **C** 二维网格 | 正方形单元格 `grid gap-1.5`，行列 ≤10 时标行列号 | `35-spiral-matrix.tsx` |
| **D** 链表 | `Node` + `Link`，指针旗标在节点上方；断开/重连用颜色加粗过渡 | `57-linked-list-cycle.tsx` |
| **E** 树 / BST / 字典树 / 递归树 | SVG 节点圆（r 18–22）+ 直线边；x 按中序展开、y 按层 | `68-maximum-depth-of-binary-tree.tsx` |
| **F** 图 | 节点圆 + `marker-end` 有向边；**手写坐标表，禁止力导向布局** | `93-course-schedule.tsx` |
| **G** 栈 / 队列 / 堆 | 栈：竖向容器顶部开口、元素从上方落入；堆：模式 E 的树 + 旁边同步数组 | `54-min-stack.tsx` |
| **H** DP 表 | 一维：模式 A 的单元格行 + 格下 `dp[i]` + 依赖弧线箭头；二维：模式 C 网格 + 单元内 dp 值 + 依赖细线 | `137-climbing-stairs.tsx` |

**题型 → 模式的兜底映射**（方案只定义了 A–H，其余题型按此归口）：

- 数组 / 字符串 / 双指针 / 滑动窗口 / 二分查找 / 位运算 / 前缀和 / 哈希表 → **A**（哈希表额外用一个小的字符→位置映射行，见题 31）
- 柱状 / 折线 / 区间覆盖 / 买卖股票 / 接雨水 / 直方图 / 贪心高度 → **B**
- 矩阵 / 网格 / 岛屿 / 单词搜索 / 生命游戏 / `Z` 字形 / 多行字符串 → **C**
- 链表 / LRU → **D**
- 树 / BST / 字典树 / 回溯决策树 → **E**（回溯类用递归决策树 + 已选路径文字标签）
- 图 / 拓扑 / 最短路径 / 除法求值 → **F**
- 栈 / 队列 / 堆 / 单调栈 / 最小栈 / 中位数流 → **G**
- 一维 DP / Kadane / 打家劫舍 / 零钱兑换 / LIS → **H**（二维 DP 用 **C** 的网格形态再按 H 的规则填表）

---

## 7. 自检（写完必须做）

在 `web` 目录运行（把 `<题号>` 换成你的题号，用独立缓存文件避免与并行任务互相干扰）：

```bash
npx tsc -p tsconfig.app.json --noEmit --tsBuildInfoFile node_modules/.tmp/tscheck-<题号>.tsbuildinfo
```

**只关注与你新建文件相关的报错**——其他演示文件可能正被并行任务同时改写，那些报错不是你的问题，**不要去修别的文件**。把你文件里的报错修到 0 为止。

不要运行 `npm run build`、不要运行 `npm run dev`。

### 交付汇报（3–5 行）

1. 文件路径（确认符合 `<题号>-<slug>.tsx`）
2. 示例输入 + 总步数（并说明取自题解哪个示例）
3. 复用了哪些 `stage` 元件 / 用了哪个模式参照实现
4. `tsc` 是否干净
5. 若缺少某个通用元件或对规范有疑问，在这里提出
