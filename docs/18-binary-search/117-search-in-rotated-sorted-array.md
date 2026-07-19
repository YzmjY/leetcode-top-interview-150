# 117. 搜索旋转排序数组

## 题目描述

整数数组 `nums` 按升序排列，数组中的值**互不相同**。

在传递给函数之前，`nums` 在预先未知的某个下标 `k`（`0 <= k < nums.length`）上进行了**旋转**，使数组变为 `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]`（下标从 0 开始计数）。例如，`[0,1,2,4,5,6,7]` 在下标 `3` 处经旋转后可能变为 `[4,5,6,7,0,1,2]`。

给你**旋转后**的数组 `nums` 和一个整数 `target`，如果 `nums` 中存在这个目标值 `target`，则返回它的索引，否则返回 `-1`。

你必须设计一个时间复杂度为 O(log n) 的算法解决此问题。

### 示例 1

```
输入：nums = [4,5,6,7,0,1,2], target = 0
输出：4
```

### 示例 2

```
输入：nums = [4,5,6,7,0,1,2], target = 3
输出：-1
```

### 示例 3

```
输入：nums = [1], target = 0
输出：-1
```

### 约束条件

- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 中的每个值都**独一无二**
- 题目数据保证 `nums` 在预先未知的某个下标上进行了旋转
- `-10^4 <= target <= 10^4`

## 题目分析

### 算法思路

旋转排序数组的关键性质：虽然整体不是有序的，但**从中间分开后，至少有一半是有序的**。我们可以利用这一特性进行二分查找：

1. 计算 `mid = left + (right-left)/2`。
2. 判断 **哪一侧是有序的**：
   - 如果 `nums[left] <= nums[mid]`，说明左半部分 `[left, mid]` 是有序的。
   - 否则右半部分 `[mid, right]` 是有序的。
3. 判断 target 是否在**有序的那一半**：
   - 左半有序时：如果 `nums[left] <= target < nums[mid]`，则 target 在左半；否则在右半。
   - 右半有序时：如果 `nums[mid] < target <= nums[right]`，则 target 在右半；否则在左半。
4. 根据判断结果收缩区间。

### 复杂度分析

- **时间复杂度**：O(log n)，每次将搜索区间缩小一半。
- **空间复杂度**：O(1)。

### 关键点

- 利用"至少有一半有序"的性质。
- 必须严格判断 target 是否落在有序区间内。
- 与标准二分查找相比，多了判断有序区间的步骤。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/117-search-in-rotated-sorted-array-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="搜索旋转排序数组 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2

        if nums[mid] == target {
            return mid
        }

        // 判断哪一侧是有序的
        if nums[left] <= nums[mid] {
            // 左半部分有序
            if nums[left] <= target && target < nums[mid] {
                right = mid - 1 // target 在左半
            } else {
                left = mid + 1 // target 在右半
            }
        } else {
            // 右半部分有序
            if nums[mid] < target && target <= nums[right] {
                left = mid + 1 // target 在右半
            } else {
                right = mid - 1 // target 在左半
            }
        }
    }
    return -1
}

func main() {
    testCases := []struct {
        nums   []int
        target int
    }{
        {[]int{4, 5, 6, 7, 0, 1, 2}, 0},
        {[]int{4, 5, 6, 7, 0, 1, 2}, 3},
        {[]int{1}, 0},
        {[]int{4, 5, 6, 7, 0, 1, 2}, 4},
        {[]int{3, 1}, 1},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, target = %d, index = %d\n",
            tc.nums, tc.target, search(tc.nums, tc.target))
    }
}
```
