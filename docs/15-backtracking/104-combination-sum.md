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

### 算法思路

**核心思路**：与「组合」一样，用递增的选取顺序（`start` 参数）保证每个组合只被生成一次；区别在于同一个数字可以**重复选取**，所以递归下一层时传 `i`（可以再选一次）而不是 `i+1`。

**算法步骤：**

1. 先对 `candidates` 排序，便于后续剪枝。
2. `path` 记录当前组合，`backtrack(start, remaining)` 表示「还要凑出 `remaining`，接下来只能从下标 `start` 开始选」。
3. `remaining == 0` 时把 `path` 拷入 `result` 并返回。
4. 遍历 `i := start; i < len(candidates); i++`：
   - 若 `candidates[i] > remaining`，因为数组已排序，后面的数只会更大，直接 `break`（剪枝）；
   - 否则把 `candidates[i]` 加入 `path`，递归 `backtrack(i, remaining-candidates[i])`（注意是 `i`，允许重复选），返回后弹出。
5. 从 `backtrack(0, target)` 开始，返回 `result`。

**剪枝策略：**

1. `remaining == 0` 收集；排序后一旦 `candidates[i] > remaining` 就 `break` 终止本层循环。
2. 不做 `remaining < 0` 的显式判断也安全：`break` 已经保证不会带着负数继续递归。

### 为什么正确

- **不重**：每条搜索路径上被选数字的下标非递减（下一层从 `i` 开始），即组合按非递减顺序生成；同一个多重集合只有一种非递减写法，因此每个组合至多被生成一次。例如 `{2,3,3}` 只可能表现为 `2→3→3`，`3→2→3`、`3→3→2` 这些选法根本不会被尝试。
- **不漏**：设某个合法解按非递减顺序为 `c1 ≤ c2 ≤ ... ≤ cm`。第 1 层循环从 `start=0` 起必然能选到下标最小的那个 `c1`；下一层从该下标开始必然能选到 `c2`；依此类推，`remaining` 恰好减到 0 时该解被收集。剪枝只跳过「当前数已经大于剩余目标」的分支，这类分支不可能凑出恰好等于 `target` 的解。
- **求和恰好等于 target**：`remaining == 0` 的判据保证了这一点；由于 `candidates[i] >= 2 > 0`，`remaining` 严格递减，递归一定终止。
- **`break` 而非 `continue` 的正确性**：数组已升序排序，`candidates[i] > remaining` 意味着 `i` 之后的所有元素也都 `> remaining`，本层不可能再有合法选择。

### 复杂度分析

- **时间复杂度：** O(S)，其中 S 为所有可行解的长度之和（搜索树的节点规模与解的总长度同阶）；最坏情况下相当于遍历整个搜索树。剪枝显著减少实际访问量。排序的 O(n log n) 是低阶项。
- **空间复杂度：** O(target)，递归深度与 `path` 长度都不超过 `target / min(candidates)`，上界即 `target`；本题约束下 `candidates[i] >= 2`，最深约为 20（`candidates = [2]`、`target = 40`）。

### 易错点 / 边界情况

- **递归传 `i` 而不是 `i+1`**：传 `i+1` 会退化成「每个数只能用一次」的普通组合问题，这是本题最容易写错的地方。
- **`break` 与 `continue`**：因为已排序才可以 `break`；若不排序而写成 `continue`，剪枝效果差很多。
- **`sort.Ints(candidates)` 会原地修改调用方传入的切片**：这是「以空间换时间」的常见写法，但会带来副作用。若不想影响调用方，应 `sorted := append([]int{}, candidates...); sort.Ints(sorted)`。
- **结果是独立拷贝**：收集时必须 `copy`，否则所有结果共享 `path` 的底层数组。
- **回溯要弹出元素**：`path = path[:len(path)-1]` 不能漏。
- **`target` 小于所有候选值**：第一层循环立刻 `break`，返回空结果 `[]`（示例 3 的情形）。
- **候选值可能重复出现在解中**：例如 `[2,2,2,2]`，这正是「可以重复选取」的体现，不要误以为结果里的重复元素是错误。
- **题目保证解数少于 150**，因此不需要担心结果爆炸；但 `target <= 40` 且候选值最小为 2，递归深度不会超过 20。
- **结果内部顺序**：代码按非递减顺序生成（如 `[[2 2 2 2] [2 3 3] [3 5]]`），与示例一致；若不一致题目也允许任意顺序。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/104-combination-sum-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
