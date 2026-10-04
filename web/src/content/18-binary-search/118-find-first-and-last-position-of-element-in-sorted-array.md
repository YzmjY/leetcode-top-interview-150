# 118. 在排序数组中查找元素的第一个和最后一个位置

## 题目描述

给你一个按照非递减顺序排列的整数数组 `nums`，和一个目标值 `target`。请你找出给定目标值在数组中的开始位置和结束位置。

如果数组中不存在目标值 `target`，返回 `[-1, -1]`。

你必须设计并实现时间复杂度为 O(log n) 的算法解决此问题。

### 示例 1

```
输入：nums = [5,7,7,8,8,10], target = 8
输出：[3,4]
```

### 示例 2

```
输入：nums = [5,7,7,8,8,10], target = 6
输出：[-1,-1]
```

### 示例 3

```
输入：nums = [], target = 0
输出：[-1,-1]
```

### 约束条件

- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`
- `nums` 是一个非递减数组
- `-10^9 <= target <= 10^9`

## 题目分析

### 算法思路

**关键观察**：目标值在非递减数组中可能出现多次，且它们必然连成一段。所以只要定位这段的**左右端点**，答案就出来了。

- **左边界**：第一个等于 target 的位置，也就是第一个 **≥ target** 的位置（`lowerBound(target)`）。
- **右边界**：最后一个等于 target 的位置 = 第一个 **> target** 的位置减 1。

**为什么「第一个 > target」可以复用 lowerBound？** 因为「第一个大于 target 的位置」正是 `lowerBound(target+1)`——`lowerBound(x)` 的定义是第一个 ≥ x 的下标，把参数换成 `target+1` 得到的自然是第一个 ≥ target+1、即第一个 > target 的位置。

因此代码只实现一个 `lowerBound`，左右边界各调用一次：

**lowerBound 的实现**（左闭右开区间 `[left, right)`）：

- 初始 `left = 0, right = len(nums)`。
- 当 `nums[mid] < target` 时，`mid` 及其左侧都 `< target`，令 `left = mid + 1`；
- 否则 `nums[mid] >= target`，`mid` 可能是答案，令 `right = mid`；
- 循环结束时 `left == right`，即为第一个 `>= target` 的位置。

**主流程**：

1. 空数组直接返回 `[-1, -1]`。
2. `left = lowerBound(nums, target)`；
3. `right = lowerBound(nums, target+1) - 1`；
4. 校验：只有当 `left <= right` 且 `left < len(nums)` 且 `nums[left] == target` 时，`[left, right]` 才是有效区间；否则返回 `[-1, -1]`。

**为什么正确**：

- 由 lowerBound 的性质，`left` 是第一个 `>= target` 的下标。若 target 存在，它就是第一个 target 的下标，是左边界；若不存在，`nums[left] != target`，第 4 步校验会把它剔除。
- `lowerBound(target+1)` 是第一个 `> target` 的下标，减 1 就是最后一个 `<= target` 的下标。若 target 存在，它恰好是最后一个 target，是右边界；若不存在且 `left` 落在某个 `> target` 的值上，则 `left == lowerBound(target+1)`，于是 `right = left - 1 < left`，校验同样会失败。

### 复杂度分析

- **时间复杂度**：O(log n)，两次二分查找。
- **空间复杂度**：O(1)。

### 关键点

- 左边界 = lowerBound(target)。
- 右边界 = upperBound(target) - 1 = lowerBound(target + 1) - 1（代码只实现 lowerBound，右边界复用它）。
- 需要验证找到的边界是否有效（`nums[left]` 是否等于 target，以及 `left <= right`），否则 target 不存在时会把「插入位置」误报成答案。

### 易错点 / 边界情况

- **空数组**：`len(nums) == 0` 要直接返回 `[-1, -1]`，否则访问 `nums[left]` 会越界。
- **target 不存在**：`left` 可能等于 `len(nums)`（target 比所有元素大），所以校验里必须先判 `left < len(nums)` 再取 `nums[left]`。
- **target 小于所有元素**：`left = 0`、`lowerBound(target+1) = 0`，于是 `right = -1`，`left > right`，返回 `[-1, -1]`。
- **全部元素都等于 target**：`left = 0`、`right = n-1`。
- **`target + 1` 的溢出**：本题 `|target| ≤ 10⁹`，远小于 `int` 上限，安全；若题目允许目标值为 `int` 最大值则需另行处理。
- **lowerBound 不要写成 upperBound**：`nums[mid] <= target` 会让左边界滑到重复段的后面。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/118-find-first-and-last-position-of-element-in-sorted-array-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="在排序数组中查找元素的第一个和最后一个位置 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func searchRange(nums []int, target int) []int {
    if len(nums) == 0 {
        return []int{-1, -1}
    }

    // 查找左边界：第一个 >= target 的位置
    left := lowerBound(nums, target)
    // 查找右边界：最后一个 <= target 的位置 = lowerBound(target+1) - 1
    right := lowerBound(nums, target+1) - 1

    // 检查是否找到
    if left <= right && left < len(nums) && nums[left] == target {
        return []int{left, right}
    }
    return []int{-1, -1}
}

// lowerBound 返回第一个 >= target 的位置
func lowerBound(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left
}

func main() {
    testCases := []struct {
        nums   []int
        target int
    }{
        {[]int{5, 7, 7, 8, 8, 10}, 8},
        {[]int{5, 7, 7, 8, 8, 10}, 6},
        {[]int{}, 0},
        {[]int{1, 1, 1, 1, 1}, 1},
        {[]int{1}, 1},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, target = %d, range = %v\n",
            tc.nums, tc.target, searchRange(tc.nums, tc.target))
    }
}
```
