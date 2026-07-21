# 56. 基本计算器

## 题目描述

给你一个字符串表达式 `s`，请你实现一个基本计算器来计算并返回它的值。

注意：不允许使用任何将字符串作为数学表达式计算的内置函数，比如 `eval()`。

**示例 1：**

```
输入：s = "1 + 1"
输出：2
```

**示例 2：**

```
输入：s = " 2-1 + 2 "
输出：3
```

**示例 3：**

```
输入：s = "(1+(4+5+2)-3)+(6+8)"
输出：23
```

**约束条件：**

- `1 <= s.length <= 3 * 10^5`
- `s` 由数字、`'+'`、`'-'`、`'('`、`')'` 和 `' '` 组成
- `s` 表示一个有效的表达式
- `'+'` 不能用作一元运算（例如 `"+1"` 和 `"+(2 + 3)"` 无效）
- `'-'` 可以用作一元运算（例如 `"-1"` 和 `"-(2 + 3)"` 有效）
- 输入中不存在两个连续的运算符
- 每个数字和运行的计算都适合于一个有符号的 32 位整数

## 题目分析

### 算法思路

本题的表达式只包含 `+`、`-`、`(`、`)` 四种运算符（没有 `*`、`/`），因此不需要考虑运算符优先级，核心难点在于处理**括号**和**负数（一元负号）**。

**方法：栈 + 符号累积**

核心思想：使用栈来保存遇到括号时的计算结果和符号状态。

1. 维护三个变量：
   - `result`：当前的计算结果。
   - `num`：当前正在解析的数字。
   - `sign`：当前数字的符号（1 表示正，-1 表示负）。

2. 遍历字符串：
   - 遇到数字：累积到 `num` 中（可能有多位）。
   - 遇到 `+`：将 `num * sign` 加到 `result` 中，重置 `num = 0`，`sign = 1`。
   - 遇到 `-`：将 `num * sign` 加到 `result` 中，重置 `num = 0`，`sign = -1`。
   - 遇到 `(`：将当前 `result` 和 `sign` 压入栈，重置 `result = 0`，`sign = 1`。
   - 遇到 `)`：先完成当前数字的处理，然后从栈中弹出之前的 `result` 和 `sign`，合并计算。
   - 遇到空格：忽略。

### 复杂度分析

- **时间复杂度**：O(n)，n 为字符串长度，每个字符只处理一次。
- **空间复杂度**：O(n)，栈最多存储 n 个状态（嵌套括号层数）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/56-basic-calculator-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="基本计算器 - 交互演示">
</iframe>

## Go 代码实现

```go
func calculate(s string) int {
    stack := []int{} // 存储括号外的结果和符号
    result := 0      // 当前计算结果
    num := 0         // 当前解析的数字
    sign := 1        // 当前符号：1 表示正，-1 表示负

    for i := 0; i < len(s); i++ {
        ch := s[i]

        switch {
        case ch >= '0' && ch <= '9':
            // 累积数字
            num = num*10 + int(ch-'0')

        case ch == '+':
            // 完成前一个数字的处理
            result += sign * num
            num = 0
            sign = 1

        case ch == '-':
            // 完成前一个数字的处理
            result += sign * num
            num = 0
            sign = -1

        case ch == '(':
            // 将当前状态压入栈，开始新的子表达式
            stack = append(stack, result) // 保存括号外的结果
            stack = append(stack, sign)   // 保存括号外的符号
            result = 0
            sign = 1

        case ch == ')':
            // 完成括号内最后一个数字的处理
            result += sign * num
            num = 0
            // 弹出括号外的符号，乘以括号内的结果
            result *= stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            // 弹出括号外的结果，加到当前结果
            result += stack[len(stack)-1]
            stack = stack[:len(stack)-1]
        }
    }

    // 处理最后一个数字
    result += sign * num

    return result
}
```
