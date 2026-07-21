# 104. 组合总和

## 题目描述

给你一个**无重复元素**的整数数组 `candidates` 和一个目标整数 `target`，找出 `candidates` 中可以使数字和为目标数 `target` 的所有**不同组合**，并以列表形式返回。你可以按**任意顺序**返回这些组合。

`candidates` 中的**同一个**数字可以**无限制重复被选取**。如果至少一个数字的被选数量不同，则两种组合是不同的。

对于给定的输入，保证和为 `target` 的不同组合数少于 `150` 个。

**示例 1：**

```
输入：candidates = [2,3,6,7], target = 7
输出：[[2,2,3],[7]]
解释：
2 和 3 可以形成一组候选，2 + 2 + 3 = 7。注意 2 可以使用多次。
7 也是一个候选，7 = 7。
仅有这两种组合。
```

**示例 2：**

```
输入: candidates = [2,3,5], target = 8
输出: [[2,2,2,2],[2,3,3],[3,5]]
```

**示例 3：**

```
输入: candidates = [2], target = 1
输出: []
```

**约束条件：**

- `1 <= candidates.length <= 30`
- `2 <= candidates[i] <= 40`
- `candidates` 的所有元素互不相同
- `1 <= target <= 40`

## 题目分析

本题是组合问题的变体，每个数字可以无限次使用。关键区别在于：递归下一层时 `start` 参数仍是 `i` 而非 `i + 1`，因为当前数字可以再次被选择。

**剪枝策略：**

1. 当 `sum > target` 时直接返回
2. **排序后剪枝**：对 candidates 排序后，若 `sum + candidates[i] > target`，则后续更大的数字也必然超出，可以 break

**时间复杂度：** O(S)，S 为所有可行解的长度之和。最坏情况需要遍历整个搜索树。

**空间复杂度：** O(target)，递归栈深度最大为 target（全选 1 的情况）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/104-combination-sum-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="组合总和 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import (
    "fmt"
    "sort"
)

// combinationSum 组合总和（可重复选）
func combinationSum(candidates []int, target int) [][]int {
    sort.Ints(candidates) // 排序便于剪枝
    result := [][]int{}
    path := []int{}

    var backtrack func(start, remaining int)
    backtrack = func(start, remaining int) {
        if remaining == 0 {
            tmp := make([]int, len(path))
            copy(tmp, path)
            result = append(result, tmp)
            return
        }

        for i := start; i < len(candidates); i++ {
            if candidates[i] > remaining {
                break // 剪枝：排序后后面的数更大，一定超出
            }
            path = append(path, candidates[i])
            backtrack(i, remaining-candidates[i]) // 注意：i 而不是 i+1，因为可以重复选
            path = path[:len(path)-1]
        }
    }

    backtrack(0, target)
    return result
}

func main() {
    fmt.Println(combinationSum([]int{2, 3, 6, 7}, 7))
    // [[2 2 3] [7]]
    fmt.Println(combinationSum([]int{2, 3, 5}, 8))
    // [[2 2 2 2] [2 3 3] [3 5]]
}
```
