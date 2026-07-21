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

本题需要分别查找目标值的**左边界**（第一个等于 target 的位置）和**右边界**（最后一个等于 target 的位置）。这两个操作都可以通过二分查找在 O(log n) 时间内完成。

**查找左边界 (lowerBound)**：
- 寻找第一个 **大于等于** target 的位置。
- 使用 `[left, right)` 区间。
- 当 `nums[mid] < target` 时，`left = mid + 1`；否则 `right = mid`。
- 循环结束后，`left` 即为左边界。需检查 `nums[left]` 是否等于 target。

**查找右边界 (upperBound)**：
- 寻找最后一个 **等于** target 的位置，等价于寻找第一个 **大于** target 的位置再减 1。
- 当 `nums[mid] <= target` 时，`left = mid + 1`；否则 `right = mid`。
- 循环结束后，`left - 1` 即为右边界。

### 复杂度分析

- **时间复杂度**：O(log n)，两次二分查找。
- **空间复杂度**：O(1)。

### 关键点

- 左边界 = lowerBound(target)。
- 右边界 = upperBound(target) - 1 = lowerBound(target + 1) - 1。
- 需要验证找到的边界是否有效（值是否等于 target）。


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
