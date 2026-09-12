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

### 算法思路

**核心思路**：不用「生成所有 2^(2n) 个括号串再逐一校验」，而是**边生成边保证合法**——只要每一步都不违反合法性条件，最终得到的一定是合法串，因此搜索树里没有废枝。

**合法括号序列的充要条件：**

1. 任意前缀中，左括号数量 ≥ 右括号数量（否则某个右括号没有配对的左括号）；
2. 最终左括号数 == 右括号数 == n。

**算法步骤：**

维护两个计数：`left`（已使用的左括号数）和 `right`（已使用的右括号数）。

1. 收集结果：`left == n && right == n` 时把当前路径加入 `result`；
2. 只有 `left < n` 才能再放一个左括号（左括号总数不能超过 n）；
3. 只有 `right < left` 才能再放一个右括号（否则前缀中右括号多于左括号，必然非法）；
4. 每种放法都是「压入 → 递归 → 弹出」。

注意两个分支的顺序决定输出顺序：先试左括号得到的结果与示例顺序一致。

### 为什么正确

- **不产生非法串**：设递归当前路径的括号数分别为 `left`、`right`，初始 `(0,0)` 满足 `left >= right`。加入 `'('` 后 `left+1 >= right` 仍成立；加入 `')'` 的前提是 `right < left`，加入后 `right+1 <= left` 也成立。由归纳可知路径上任意前缀都满足条件 1；到达 `(n,n)` 时条件 2 也满足，所以每个输出都是合法的。
- **不漏解**：对任意合法括号串，从左到右模拟：遇到 `'('` 时必有 `left < n`（因为总共只有 n 个左括号），遇到 `')'` 时必有 `right < left`（由合法性条件 1）。也就是说合法串的每一步都落在代码允许的两个分支内，因此它一定会被生成。
- **不重复**：生成过程由「每一步选左还是选右」唯一确定，而一个括号串就是这串选择的结果，不同的选择序列产生不同的串。

### 复杂度分析

- **时间复杂度：** O(4^n / √n)，即第 n 个卡特兰数 C_n = (2n)! / ((n+1)! n!)，等于合法括号序列的个数；每个序列需要 O(n) 时间构造字符串，因此严格地说是 O(C_n × n)。n ≤ 8 时 C_8 = 1430，规模很小。
- **空间复杂度：** O(n)，递归栈深度最多 2n，`path` 长度也是 2n（不计存放答案的空间）。

### 易错点 / 边界情况

- **右括号的条件是 `right < left` 而不是 `right < n`**：写成 `right < n` 会生成非法串，如 `n = 2` 时的 `"())("`。
- **左右括号判断不要写反**：`left < n` 控制左括号，`right < left` 控制右括号。
- **回溯要弹出**：`path = path[:len(path)-1]` 在两个分支里都不能漏，否则路径会越堆越长。
- **收集时要拷贝字符串**：`string(path)` 会新建字符串，天然安全；如果改用 `[]byte` 结果集则要显式复制。
- **`n = 1`**：只有 `"()"`；`n = 2` 只有 `"(())"` 和 `"()()"`。
- **两个分支的顺序影响输出顺序**（不影响正确性）：先左后右得到的是示例给出的那个顺序。
- **不要退化成「暴力枚举 2^(2n) 再校验」**：那是指数级的浪费，本题的回溯已将搜索树压缩到只含合法前缀。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/106-generate-parentheses-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="括号生成 - 交互演示">
</iframe>

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
