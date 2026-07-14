# 113. 环形子数组的最大和

## 题目描述

给定一个长度为 `n` 的**环形整数数组** `nums`，返回 `nums` 的非空**子数组**的最大可能和。

**环形数组** 意味着数组的末端将会与开头相连呈环状。形式上，`nums[i]` 的下一个元素是 `nums[(i + 1) % n]`，`nums[i]` 的前一个元素是 `nums[(i - 1 + n) % n]`。

**子数组** 最多只能包含固定缓冲区 `nums` 中的每个元素一次。形式上，对于子数组 `nums[i], nums[i+1], ..., nums[j]`，不存在 `i <= k1, k2 <= j` 其中 `k1 % n == k2 % n`。

### 示例 1

```
输入：nums = [1,-2,3,-2]
输出：3
解释：从子数组 [3] 得到最大和 3
```

### 示例 2

```
输入：nums = [5,-3,5]
输出：10
解释：从子数组 [5,5] 得到最大和 5 + 5 = 10
```

### 示例 3

```
输入：nums = [-3,-2,-3]
输出：-2
解释：从子数组 [-2] 得到最大和 -2
```

### 约束条件

- `n == nums.length`
- `1 <= n <= 3 * 10^4`
- `-3 * 10^4 <= nums[i] <= 3 * 10^4`

## 题目分析

### 算法思路

环形子数组的最大和有**两种情况**：

**情况一：最大子数组不跨越边界（在数组中间）**
- 等价于普通的 Kadane 算法，直接求最大子数组和 `maxSum`。

**情况二：最大子数组跨越边界（首尾相连）**
- 如果最大子数组跨越了边界，那么中间部分就是**最小子数组**。
- 此时最大和 = `totalSum - minSum`（总和减去中间的最小子数组和）。
- 这相当于取了数组的首部和尾部。

最终答案 = `max(maxSum, totalSum - minSum)`。

**特殊情况**：如果数组全为负数，那么 `totalSum - minSum = 0`（因为 minSum = totalSum），但题目要求非空子数组，此时应返回 `maxSum`（最大的单个元素）。

### 复杂度分析

- **时间复杂度**：O(n)，需要两次遍历（可以合并为一次）。
- **空间复杂度**：O(1)，只使用常数级别的额外空间。

### 关键点

- 巧妙地将环形问题转化为求"最大子数组和"与"最小子数组和"的结合。
- 注意全负数数组的特殊处理：此时 `totalSum == minSum`，`totalSum - minSum = 0` 不是合法答案。

## Go 代码实现

```go
package main

import "fmt"

func maxSubarraySumCircular(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }

    totalSum := nums[0]
    maxEndingHere := nums[0]
    maxSoFar := nums[0]
    minEndingHere := nums[0]
    minSoFar := nums[0]

    for i := 1; i < n; i++ {
        totalSum += nums[i]

        // Kadane 求最大子数组和
        if maxEndingHere+nums[i] > nums[i] {
            maxEndingHere = maxEndingHere + nums[i]
        } else {
            maxEndingHere = nums[i]
        }
        if maxEndingHere > maxSoFar {
            maxSoFar = maxEndingHere
        }

        // Kadane 求最小子数组和（变体：取最小值）
        if minEndingHere+nums[i] < nums[i] {
            minEndingHere = minEndingHere + nums[i]
        } else {
            minEndingHere = nums[i]
        }
        if minEndingHere < minSoFar {
            minSoFar = minEndingHere
        }
    }

    // 全为负数的情况：totalSum == minSoFar，此时最大和为 maxSoFar
    if totalSum == minSoFar {
        return maxSoFar
    }

    // 取两种情况的最大值
    if maxSoFar > totalSum-minSoFar {
        return maxSoFar
    }
    return totalSum - minSoFar
}

func main() {
    testCases := [][]int{
        {1, -2, 3, -2},
        {5, -3, 5},
        {-3, -2, -3},
        {3, -1, 2, -1},
    }

    for _, nums := range testCases {
        fmt.Printf("nums = %v, 环形子数组最大和 = %d\n",
            nums, maxSubarraySumCircular(nums))
    }
}
```
