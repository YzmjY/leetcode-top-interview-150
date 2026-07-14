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

本题的难点在于 `getMin()` 需要 O(1) 时间复杂度。标准做法是使用 **辅助栈**（最小栈）：

1. **主栈 `stack`**：存储所有入栈的元素。
2. **辅助栈 `minStack`**：存储当前栈中的最小值。具体规则：
   - `push(val)`：将 `val` 压入 `stack`；同时将 `min(val, minStack.top())` 压入 `minStack`。
   - `pop()`：同时弹出 `stack` 和 `minStack` 的栈顶。
   - `top()`：返回 `stack` 的栈顶。
   - `getMin()`：返回 `minStack` 的栈顶。

这样设计保证了在任意时刻，`minStack` 的栈顶总是当前 `stack` 中的最小值。

### 复杂度分析

- **时间复杂度**：所有操作均为 O(1)。
- **空间复杂度**：O(n)，n 为入栈元素个数。使用了额外的辅助栈。

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
