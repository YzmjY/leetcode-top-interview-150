# 54. 最小栈

## 题目描述

设计一个支持 `push`，`pop`，`top` 操作，并能在常数时间内检索到最小元素的栈。

实现 `MinStack` 类：

- `MinStack()` 初始化堆栈对象。
- `void push(int val)` 将元素 val 推入堆栈。
- `void pop()` 删除堆栈顶部的元素。
- `int top()` 获取堆栈顶部的元素。
- `int getMin()` 获取堆栈中的最小元素。

**示例 1：**

```
输入：
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]

输出：
[null,null,null,null,-3,null,0,-2]

解释：
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin();   --> 返回 -3
minStack.pop();
minStack.top();      --> 返回 0
minStack.getMin();   --> 返回 -2
```

**约束条件：**

- `-2^31 <= val <= 2^31 - 1`
- `pop`、`top` 和 `getMin` 操作总是在 **非空栈** 上调用
- `push`、`pop`、`top` 和 `getMin` 操作最多被调用 `3 * 10^4` 次

## 题目分析

### 算法思路

**核心思路：** 如果只用一个变量 `minVal` 记录当前最小值，`getMin` 确实是 O(1)，但 `pop` 会出问题：一旦被弹出的正好是当前最小值，`minVal` 就失去了依据，只能重新扫描整个栈（O(n)）才能知道新的最小值。

关键观察：**最小值是「随栈的深度变化」的——栈的每一个历史状态，都对应一个当时的最小值。** 于是可以把「每个状态下的最小值」与元素一起压栈：辅助栈的第 `k` 层，记录主栈前 `k` 个元素中的最小值。弹出时两个栈一起弹，最小值自然回退到上一个状态，无需重新计算。

**数据结构：**

- 主栈 `stack`：照常存储所有元素。
- 辅助栈 `minStack`：与 `stack` 等长，`minStack[k]` 表示 `stack[0..k]` 中的最小值。

**算法步骤：**

- `Push(val)`：把 `val` 压入主栈；辅助栈压入 `min(val, minStack 栈顶)`。辅助栈为空时直接压入 `val`。
- `Pop()`：主栈与辅助栈同时弹出栈顶。
- `Top()`：返回主栈栈顶。
- `GetMin()`：返回辅助栈栈顶。

**为什么正确：** 维护不变量——**任意时刻两个栈长度相同，且 `minStack` 的栈顶等于 `stack` 中所有元素的最小值。**

- `Push`：压栈前 `minStack` 栈顶是旧元素的最小值 `oldMin`。新集合的最小值是 `min(val, oldMin)`，正是压入辅助栈的值，辅助栈栈顶成为新集合的最小值，不变量保持。
- `Pop`：两个栈同步弹出后，辅助栈栈顶恰好回到「弹出前集合去掉栈顶元素」时的最小值，也就是不变量要求的值。
- `Top`/`GetMin` 只是读取，不影响不变量。

由归纳法，不变量对所有操作序列成立，因此 `GetMin` 返回的始终是当前全部元素的最小值。

### 复杂度分析

- **时间复杂度**：`Push`、`Pop`、`Top`、`GetMin` 全部是 O(1)。每步只做了常数次切片操作。
- **空间复杂度**：O(n)，n 为栈中元素个数。辅助栈与主栈等长，是最坏情况的两倍空间；也可以优化为「记录最小值出现次数」的写法，空间与最小值变化次数成正比，但实现更繁琐。

### 易错点 / 边界情况

- **两个栈必须同步弹出**：`Pop` 只弹了主栈而忘记弹辅助栈，后续 `GetMin` 就会返回过期的最小值。
- **不要用「弹出后重新扫描求最小」的偷懒写法**：那样 `Pop` 是 O(n)，不满足常数时间的要求（而且题目真正考的就是这个）。
- **辅助栈为空时要特判**：`Push` 第一次调用时 `minStack` 是空的，不能直接访问栈顶。
- **等值元素不需要特殊处理**：`val < 栈顶 ? val : 栈顶` 在 `val` 与栈顶相等时压入的是同一个值，结果一样。用 `<=` 也正确，因为两者数值相同；但不要图省事跳过压栈——那会破坏两个栈的等长关系。
- **整数边界**：`val` 可以取到 `±2^31 - 1`，最值正好落在这两个数时不需要任何哨兵（本实现的辅助栈存的是真实值，不使用 `INT_MAX` 之类的初始哨兵，因此不会有「哨兵被弹出」的隐患）。
- **操作保证非空**：约束说明 `pop`、`top`、`getMin` 总是在非空栈上调用，因此不必在代码里做空栈保护，但心里要知道这三个方法对空栈是未定义行为。
- **接收者必须是 `*MinStack`**：Go 的方法定义在 `*MinStack` 上。若在测试或调用时对 `MinStack` 的值做拷贝（例如把构造结果赋给新变量再调用），切片头部会被复制——虽然底层数组共享，但 `append` 后两个副本的长度字段会各自变化，行为难以预料。直接从 `Constructor()` 的返回值上调用方法是安全的。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/54-min-stack-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="最小栈 - 交互演示">
</iframe>

## Go 代码实现

```go
type MinStack struct {
    stack    []int // 主栈，存储所有元素
    minStack []int // 辅助栈，存储每个状态下的最小值
}

// Constructor 初始化 MinStack
func Constructor() MinStack {
    return MinStack{
        stack:    []int{},
        minStack: []int{},
    }
}

// Push 将元素 val 推入堆栈
func (ms *MinStack) Push(val int) {
    ms.stack = append(ms.stack, val)
    // 更新最小值：如果辅助栈为空或 val 更小，压入 val；否则压入当前最小值
    if len(ms.minStack) == 0 || val < ms.minStack[len(ms.minStack)-1] {
        ms.minStack = append(ms.minStack, val)
    } else {
        ms.minStack = append(ms.minStack, ms.minStack[len(ms.minStack)-1])
    }
}

// Pop 删除栈顶元素
func (ms *MinStack) Pop() {
    ms.stack = ms.stack[:len(ms.stack)-1]
    ms.minStack = ms.minStack[:len(ms.minStack)-1]
}

// Top 获取栈顶元素
func (ms *MinStack) Top() int {
    return ms.stack[len(ms.stack)-1]
}

// GetMin 获取栈中的最小元素
func (ms *MinStack) GetMin() int {
    return ms.minStack[len(ms.minStack)-1]
}
```
