# 55. 逆波兰表达式求值

## 题目描述

给你一个字符串数组 `tokens`，表示一个根据 **逆波兰表示法** 表示的算术表达式。

请你计算该表达式。返回一个表示表达式值的整数。

**注意**：
- 有效的运算符为 `'+'`、`'-'`、`'*'` 和 `'/'`。
- 每个操作数（运算对象）都可以是一个整数或者另一个表达式。
- 两个整数之间的除法总是 **向零截断**（即向零取整）。
- 表达式中不含除零运算。
- 输入是一个根据逆波兰表示法表示的算术表达式。
- 答案及所有中间计算结果可以用 **32 位** 整数表示。

**示例 1：**

```
输入：tokens = ["2","1","+","3","*"]
输出：9
解释：该算式转化为常见的中缀算术表达式为：((2 + 1) * 3) = 9
```

**示例 2：**

```
输入：tokens = ["4","13","5","/","+"]
输出：6
解释：该算式转化为常见的中缀算术表达式为：(4 + (13 / 5)) = 6
```

**示例 3：**

```
输入：tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]
输出：22
解释：
((10 * (6 / ((9 + 3) * -11))) + 17) + 5
= ((10 * (6 / (12 * -11))) + 17) + 5
= ((10 * (6 / -132)) + 17) + 5
= ((10 * 0) + 17) + 5
= (0 + 17) + 5
= 17 + 5
= 22
```

**约束条件：**

- `1 <= tokens.length <= 10^4`
- `tokens[i]` 是一个运算符（`"+"`、`"-"`、`"*"` 或 `"/"`），或是一个在范围 `[-200, 200]` 内的整数

## 题目分析

### 算法思路

逆波兰表达式（后缀表达式）非常适合用栈来计算：

1. 使用一个栈存储操作数。
2. 遍历 tokens：
   - 如果是数字，直接压入栈。
   - 如果是运算符，从栈顶弹出两个操作数（先弹出的是右操作数，后弹出的是左操作数），进行对应运算，将结果压回栈。
3. 遍历结束后，栈中唯一的元素即为最终结果。

**除法注意事项**：Go 中的整数除法 `/` 默认向零截断，符合题目要求。

### 复杂度分析

- **时间复杂度**：O(n)，遍历所有 token 一次。
- **空间复杂度**：O(n)，栈最多存储 n 个数字。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/55-evaluate-reverse-polish-notation-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="逆波兰表达式求值 - 交互演示">
</iframe>

## Go 代码实现

```go
import "strconv"

func evalRPN(tokens []string) int {
    stack := []int{}

    for _, token := range tokens {
        switch token {
        case "+":
            // 弹出两个操作数，相加后压回
            a, b := stack[len(stack)-2], stack[len(stack)-1]
            stack = stack[:len(stack)-2]
            stack = append(stack, a+b)
        case "-":
            // 弹出两个操作数，相减后压回
            a, b := stack[len(stack)-2], stack[len(stack)-1]
            stack = stack[:len(stack)-2]
            stack = append(stack, a-b)
        case "*":
            // 弹出两个操作数，相乘后压回
            a, b := stack[len(stack)-2], stack[len(stack)-1]
            stack = stack[:len(stack)-2]
            stack = append(stack, a*b)
        case "/":
            // 弹出两个操作数，相除后压回（向零截断）
            a, b := stack[len(stack)-2], stack[len(stack)-1]
            stack = stack[:len(stack)-2]
            stack = append(stack, a/b)
        default:
            // 数字：直接解析并压入栈
            num, _ := strconv.Atoi(token)
            stack = append(stack, num)
        }
    }

    return stack[0]
}
```
