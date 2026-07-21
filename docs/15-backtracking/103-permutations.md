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

全排列与组合不同，排列考虑顺序。`[1,2]` 和 `[2,1]` 是不同的排列。

**算法思路：**

使用 `used` 布尔数组记录哪些元素已被选择，避免在同一路径中重复使用同一个元素。

**排列模板 vs 组合模板的关键区别：**

- 排列：`for i := 0; i < n; i++`——每层都从 0 开始遍历，通过 `used` 去重
- 组合：`for i := start; i < n; i++`——通过 `start` 保证递增，天然去重

**时间复杂度：** O(n * n!)，共 n! 个排列，每个排列拷贝 O(n)。

**空间复杂度：** O(n)，递归栈和 used 数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/103-permutations-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
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
