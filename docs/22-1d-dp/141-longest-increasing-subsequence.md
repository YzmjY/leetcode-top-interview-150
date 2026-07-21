# 141. 最长递增子序列 (Longest Increasing Subsequence)

## 题目描述

给你一个整数数组 `nums`，找到其中最长严格递增子序列的长度。

**子序列** 是由数组派生而来的序列，删除（或不删除）数组中的元素而不改变其余元素的顺序。例如，`[3,6,2,7]` 是数组 `[0,3,1,6,2,2,7]` 的子序列。

**示例 1：**

```
输入：nums = [10,9,2,5,3,7,101,18]
输出：4
解释：最长递增子序列是 [2,3,7,101]，因此长度为 4 。
```

**示例 2：**

```
输入：nums = [0,1,0,3,2,3]
输出：4
```

**示例 3：**

```
输入：nums = [7,7,7,7,7,7,7]
输出：1
```

**约束条件：**

- `1 <= nums.length <= 2500`
- `-10^4 <= nums[i] <= 10^4`

**进阶：** 你能将算法的时间复杂度降低到 O(n log n) 吗？

## 题目分析

### 算法思路

**方法一：一维 DP（O(n^2)）**

- **状态定义**：`dp[i]` = 以 `nums[i]` 结尾的最长递增子序列长度。
- **状态转移**：对于每个 i，枚举 j < i：
  - 如果 `nums[j] < nums[i]`，则 `dp[i] = max(dp[i], dp[j] + 1)`
- **初始化**：`dp[i] = 1`（每个元素自身构成长度为 1 的子序列）。
- **答案**：`max(dp[0..n-1])`

**方法二：贪心 + 二分查找（O(n log n)）**

维护一个数组 `tails`，其中 `tails[i]` 表示长度为 `i+1` 的递增子序列的最小末尾值。

遍历 nums：
- 如果 `nums[i]` 大于 `tails` 的最后一个元素，追加到末尾。
- 否则，用二分查找找到第一个 `>= nums[i]` 的位置并替换。

`tails` 的长度即为 LIS 长度。

### 复杂度分析

- **方法一**：时间 O(n^2)，空间 O(n)
- **方法二**：时间 O(n log n)，空间 O(n)

### 关键点

- DP 方法体现了"以...结尾"这种常见的状态定义模式。
- 二分优化是经典技巧，LIS 和耐心排序（Patience Sorting）有密切联系。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/141-longest-increasing-subsequence-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="最长递增子序列 (Longest Increasing Subsequence) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

// 方法一：O(n^2) DP
func lengthOfLIS(nums []int) int {
    n := len(nums)
    dp := make([]int, n)
    maxLen := 0

    for i := 0; i < n; i++ {
        dp[i] = 1 // 每个元素自身构成长度为1的子序列
        for j := 0; j < i; j++ {
            if nums[j] < nums[i] && dp[j]+1 > dp[i] {
                dp[i] = dp[j] + 1
            }
        }
        if dp[i] > maxLen {
            maxLen = dp[i]
        }
    }

    return maxLen
}

// 方法二：O(n log n) 贪心 + 二分查找
func lengthOfLISBS(nums []int) int {
    tails := make([]int, 0)

    for _, num := range nums {
        // 二分查找 tails 中第一个 >= num 的位置
        idx := lowerBound(tails, num)

        if idx == len(tails) {
            // num 大于所有 tails 元素，追加
            tails = append(tails, num)
        } else {
            // 替换
            tails[idx] = num
        }
    }

    return len(tails)
}

// lowerBound 返回第一个 >= target 的位置
func lowerBound(arr []int, target int) int {
    left, right := 0, len(arr)
    for left < right {
        mid := left + (right-left)/2
        if arr[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left
}
```
