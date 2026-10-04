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

**朴素想法**：枚举所有子序列再判断是否递增，共 2^n 种，不可行。注意到递增子序列的「结尾元素」是关键信息：以某个元素结尾的最长长度一旦确定，就能被后面的元素复用。

**方法一：一维 DP（O(n²)）**

- **状态定义**：`dp[i]` = 以 `nums[i]` **结尾**的最长严格递增子序列长度。
- **状态转移**：枚举所有 j < i。若 `nums[j] < nums[i]`，就可以把 `nums[i]` 接到以 `nums[j]` 结尾的最优子序列后面，得到长度 `dp[j] + 1`；取所有 j 中的最大值：`dp[i] = max(dp[i], dp[j] + 1)`。
- **初始化**：`dp[i] = 1`，即只有 `nums[i]` 自己。
- **答案**：`max(dp[0..n-1])`，因为最长子序列一定以某个元素结尾。

**为什么正确**：任何以 `nums[i]` 结尾的递增子序列，去掉末尾的 `nums[i]` 后（非空时），前一个元素的下标 j 必小于 i 且 `nums[j] < nums[i]`，其长度不超过 `dp[j]`，因此整个子序列长度不超过 `dp[j] + 1`，转移式不会低估；反过来，把以 j 结尾的最优子序列接上 `nums[i]` 是合法的递增子序列，转移式不会高估。于是归纳可得 `dp[i]` 正确。要求**严格**递增，所以判断是 `nums[j] < nums[i]` 而不是 `<=`。

**方法二：贪心 + 二分查找（O(n log n)）**

维护数组 `tails`，其中 `tails[k]` 表示「所有长度为 k+1 的递增子序列中，最小的结尾元素」。可以证明 `tails` 是严格递增的。遍历 nums：

- 若 `nums[i]` 大于 `tails` 的最后一个元素，说明它能延长当前最长子序列，追加到末尾；
- 否则用二分查找找到第一个 `>= nums[i]` 的位置并把它替换成 `nums[i]`。这一步的含义是：`nums[i]` 不能延长这个长度的子序列，但能让「该长度的子序列」结尾更小，为后续元素创造更好的延长机会。

`tails` 的长度即为答案。

**为什么正确**：`tails` 的单调性保证二分合法；替换操作只会让某个长度的最小结尾变小，不会破坏「存在长度为 k+1 的递增子序列」这一事实（替换后仍可由更短的那条子序列接上）。最终 `tails` 的长度就是最长可能长度。

### 复杂度分析

- **方法一**：时间 O(n²)（对每个 i 枚举 j），空间 O(n)（dp 数组）。
- **方法二**：时间 O(n log n)（每个元素一次二分查找），空间 O(n)（tails 数组）。

### 关键点

- DP 的状态必须定义成「以 nums[i] 结尾」，否则写不出转移；这是子序列类 DP 的通用技巧。
- 严格递增用 `<`，非严格递增（如「最长非递减子序列」）才用 `<=`。
- 方法二的 `tails` 本身不一定是某个具体的合法子序列（替换会破坏原有的下标顺序），但它的**长度**始终等于当前的最长值，这点容易被误解。
- 二分查找用「第一个 >= target 的位置」（lower_bound）而不是 `>`，否则重复元素会被错误地延长。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/141-longest-increasing-subsequence-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
