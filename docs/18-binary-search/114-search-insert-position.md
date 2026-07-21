# 114. 搜索插入位置

## 题目描述

给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。

请必须使用时间复杂度为 O(log n) 的算法。

### 示例 1

```
输入: nums = [1,3,5,6], target = 5
输出: 2
```

### 示例 2

```
输入: nums = [1,3,5,6], target = 2
输出: 1
```

### 示例 3

```
输入: nums = [1,3,5,6], target = 7
输出: 4
```

### 约束条件

- `1 <= nums.length <= 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 为**无重复元素**的**升序**排列数组
- `-10^4 <= target <= 10^4`

## 题目分析

### 算法思路

本题是二分查找中 **lowerBound** 的经典应用：寻找第一个 **大于等于** target 的位置。

- 使用左闭右开区间 `[left, right)`，初始 `left = 0, right = len(nums)`。
- 当 `nums[mid] < target` 时，mid 及其左边都小于 target，`left = mid + 1`。
- 当 `nums[mid] >= target` 时，mid 可能是答案，`right = mid`。
- 循环结束后，`left` 就是第一个 **大于等于** target 的位置，即插入位置。

### 复杂度分析

- **时间复杂度**：O(log n)，标准的二分查找。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 区间定义 `[left, right)`，所以 `right = len(nums)`。
- 循环条件为 `left < right`，退出时 `left == right`。
- 该模板天然处理了 target 大于所有元素的情况（返回 `len(nums)`）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/114-search-insert-position-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="搜索插入位置 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func searchInsert(nums []int, target int) int {
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
        {[]int{1, 3, 5, 6}, 5},
        {[]int{1, 3, 5, 6}, 2},
        {[]int{1, 3, 5, 6}, 7},
        {[]int{1, 3, 5, 6}, 0},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, target = %d, 插入位置 = %d\n",
            tc.nums, tc.target, searchInsert(tc.nums, tc.target))
    }
}
```
