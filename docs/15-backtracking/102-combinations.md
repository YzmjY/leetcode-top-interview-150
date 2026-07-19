# 102. 组合

## 题目描述

给定两个整数 `n` 和 `k`，返回范围 `[1, n]` 中所有可能的 `k` 个数的组合。

你可以按**任何顺序**返回答案。

**示例 1：**

```
输入：n = 4, k = 2
输出：
[
  [2,4],
  [3,4],
  [2,3],
  [1,2],
  [1,3],
  [1,4],
]
```

**示例 2：**

```
输入：n = 1, k = 1
输出：[[1]]
```

**约束条件：**

- `1 <= n <= 20`
- `1 <= k <= n`

## 题目分析

组合与排列的核心区别：组合不考虑顺序，因此 `[1,2]` 和 `[2,1]` 被视为同一个组合。

**避免重复的关键：** 通过 `start` 参数控制搜索起点，确保每个组合中的数字严格递增。第 i 层的搜索从 `start` 开始，递归下一层时传入 `i + 1`。

**剪枝优化：**

当剩余可选数字不足以凑够 k 个时提前返回：

```go
// 还需要选 k - len(path) 个数字
// 从 i 到 n 总共有 n - i + 1 个数字
// 需要满足: n - i + 1 >= k - len(path)
// 即: i <= n - (k - len(path)) + 1
```

**时间复杂度：** O(C(n, k) * k)，需要生成 C(n, k) 个组合，每个组合拷贝 k 个元素。

**空间复杂度：** O(k)，递归栈深度和路径长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/102-combinations-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="组合 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// combine 生成 1..n 的所有 k 个数的组合
func combine(n int, k int) [][]int {
    result := [][]int{}
    path := make([]int, 0, k)

    var backtrack func(start int)
    backtrack = func(start int) {
        // 收集结果
        if len(path) == k {
            tmp := make([]int, k)
            copy(tmp, path)
            result = append(result, tmp)
            return
        }

        // 剪枝：剩余元素不足
        // 还需要 k - len(path) 个，剩余 n - i + 1 个
        for i := start; i <= n-(k-len(path))+1; i++ {
            path = append(path, i)
            backtrack(i + 1)
            path = path[:len(path)-1]
        }
    }

    backtrack(1)
    return result
}

func main() {
    fmt.Println(combine(4, 2))
    // [[1 2] [1 3] [1 4] [2 3] [2 4] [3 4]]
    fmt.Println(combine(1, 1))
    // [[1]]
}
```
