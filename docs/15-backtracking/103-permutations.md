# 103. 全排列

## 题目描述

给定一个不含重复数字的数组 `nums`，返回其所有可能的全排列。你可以按**任意顺序**返回答案。

**示例 1：**

```
输入：nums = [1,2,3]
输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

**示例 2：**

```
输入：nums = [0,1]
输出：[[0,1],[1,0]]
```

**示例 3：**

```
输入：nums = [1]
输出：[[1]]
```

**约束条件：**

- `1 <= nums.length <= 6`
- `-10 <= nums[i] <= 10`
- `nums` 中的所有整数互不相同

## 题目分析

### 算法思路

**核心思路**：全排列按位置逐位确定：第 `i` 位放哪个还没被用过的数。与组合不同，排列要保留顺序，所以每层都要**从头遍历**所有元素，而不是像组合那样用 `start` 限制起点；去重改为依赖 `used[]` 记录「哪些元素已经在当前路径上用过」。

**算法步骤（`used` 数组法）：**

1. `path` 记录当前排列前缀，`used[i]` 表示 `nums[i]` 是否已经在当前路径中。
2. `backtrack()`：
   - 若 `len(path) == n`，把 `path` 拷贝一份加入 `result`，返回；
   - 否则 `for i := 0; i < n; i++`：跳过 `used[i]` 的元素 → 置 `used[i] = true` 并 `append` 到 `path` → 递归 → 返回后弹出 `path` 末尾元素、置 `used[i] = false`。
3. 从空路径开始递归。

**排列模板 vs 组合模板的关键区别：**

| | 遍历方式 | 去重手段 |
| --- | --- | --- |
| 排列 | `for i := 0; i < n; i++`，每层从 0 开始 | `used[]` 排除当前路径上已用的元素 |
| 组合 | `for i := start; i < n; i++`，只往后选 | `start` 保证递增，天然去重 |

**另一种实现（`permuteSwap`，原地交换法）**：把 `nums` 的第 `start` 位与 `start..n-1` 中每个位置交换，然后递归 `start+1`，返回时再交换回来。此时「已确定的前缀」占 `[0, start)`，`[start, n)` 是待选集合，无需额外的 `used` 数组。

### 为什么正确

- **`used` 法的完备性**：对路径长度做归纳——长度为 `n` 时直接输出（正确）；长度为 `m < n` 时，`for` 循环枚举所有「不在当前路径上」的元素作为第 `m+1` 位，每个分支由归纳假设给出所有剩余元素的排列，因此所有排列都被生成。
- **`used` 法的不重复性**：排列由「每一位置放哪个元素」唯一确定；两个不同的分支在第 `m+1` 位选了不同的元素（因为被选元素随即被标记 `used`），因此生成的前缀就不同，不可能产出相同排列。
- **交换法的正确性**：递归到 `start` 时，`nums[0..start-1]` 是已确定的前缀，`nums[start..n-1]` 是剩余元素。把第 `start` 位依次换成剩余集合中的每个元素，恰好枚举了所有可能的前缀扩展；递归返回时换回原样，保证父层的排列状态不被破坏。
- **输入不被破坏**：交换法在每次递归返回前把两个位置换回来，所以 `permuteSwap` 调用结束后 `nums` 恢复原状。

### 复杂度分析

- **时间复杂度：** O(n × n!)。共有 `n!` 个排列，每个排列需要 O(n) 拷贝到结果中；搜索树的内部节点总数也是 O(n × n!) 量级。
- **空间复杂度：** O(n)，`path`、`used` 与递归栈深度都不超过 n（不计存放答案的空间）。

### 易错点 / 边界情况

- **结果必须是深拷贝**：`tmp := make([]int, n); copy(tmp, path)`，直接 `append(result, path)` 会让所有结果共享同一底层数组，最终全部变成同一个排列。
- **撤销要成对**：`used[i] = false` 与 `path` 的弹出必须都执行，漏掉任一都会让后续分支出错。
- **排列层循环从 0 开始**：如果误用组合模板写成 `for i := start`，会漏掉大量排列。
- **题目保证元素互不相同**，因此不需要处理重复元素去重（若有重复，需要先排序再用「同层相同元素只选第一个」的额外判据）。
- **交换法的输入会被短暂修改**：虽然返回前会恢复，但如果在递归中途 panic 或提前 return 就会破坏输入；用 `used` 法可以不碰输入。
- **`n = 1`**：只有 `[[1]]` 一个结果；`n = 6` 时共 720 个排列，规模上限不大。
- **两种实现的输出顺序不同**：题目允许任意顺序，验证时应对结果集合排序后比较。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/103-permutations-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="全排列 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// permute 生成全排列
func permute(nums []int) [][]int {
    n := len(nums)
    result := [][]int{}
    path := make([]int, 0, n)
    used := make([]bool, n)

    var backtrack func()
    backtrack = func() {
        if len(path) == n {
            tmp := make([]int, n)
            copy(tmp, path)
            result = append(result, tmp)
            return
        }

        for i := 0; i < n; i++ {
            if used[i] {
                continue
            }
            // 做选择
            used[i] = true
            path = append(path, nums[i])
            // 递归
            backtrack()
            // 撤销选择
            path = path[:len(path)-1]
            used[i] = false
        }
    }

    backtrack()
    return result
}

// permuteSwap 使用原地交换法生成全排列（另一种实现）
func permuteSwap(nums []int) [][]int {
    result := [][]int{}
    n := len(nums)

    var backtrack func(start int)
    backtrack = func(start int) {
        if start == n {
            tmp := make([]int, n)
            copy(tmp, nums)
            result = append(result, tmp)
            return
        }
        for i := start; i < n; i++ {
            nums[start], nums[i] = nums[i], nums[start] // 交换
            backtrack(start + 1)
            nums[start], nums[i] = nums[i], nums[start] // 恢复
        }
    }

    backtrack(0)
    return result
}

func main() {
    fmt.Println(permute([]int{1, 2, 3}))
    // [[1 2 3] [1 3 2] [2 1 3] [2 3 1] [3 1 2] [3 2 1]]
}
```
