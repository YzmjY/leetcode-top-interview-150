# 106. 括号生成

## 题目描述

数字 `n` 代表生成括号的对数，请你设计一个函数，用于能够生成所有可能的并且**有效的**括号组合。

**示例 1：**

```
输入：n = 3
输出：["((()))","(()())","(())()","()(())","()()()"]
```

**示例 2：**

```
输入：n = 1
输出：["()"]
```

**约束条件：**

- `1 <= n <= 8`

## 题目分析

本题是回溯 + 括号合法性约束的经典问题。在生成括号的过程中，需要始终保证括号序列的有效性。

**合法括号序列的充要条件：**

1. 任意前缀中，左括号数量 >= 右括号数量
2. 最终左括号数量 == 右括号数量 == n

**回溯思路：**

维护两个计数：`left`（已使用左括号数）和 `right`（已使用右括号数）。

选择规则：
- 可以添加左括号：当 `left < n`
- 可以添加右括号：当 `right < left`（右括号数量必须小于左括号数量）

**时间复杂度：** O(4^n / sqrt(n))，即第 n 个卡特兰数，这也是合法括号序列的总数。

**空间复杂度：** O(n)，递归栈深度最大 2n。

## Go 代码实现

```go
package main

import "fmt"

// generateParenthesis 生成所有合法括号组合
func generateParenthesis(n int) []string {
    result := []string{}
    path := make([]byte, 0, 2*n)

    var backtrack func(left, right int)
    backtrack = func(left, right int) {
        // 收集结果
        if left == n && right == n {
            result = append(result, string(path))
            return
        }

        // 可以加左括号
        if left < n {
            path = append(path, '(')
            backtrack(left+1, right)
            path = path[:len(path)-1]
        }

        // 可以加右括号（必须小于左括号数）
        if right < left {
            path = append(path, ')')
            backtrack(left, right+1)
            path = path[:len(path)-1]
        }
    }

    backtrack(0, 0)
    return result
}

func main() {
    fmt.Println(generateParenthesis(3))
    // [((())) (()()) (())() ()(()) ()()()]
}
```
