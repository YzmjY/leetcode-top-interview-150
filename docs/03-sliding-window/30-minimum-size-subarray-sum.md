# 30. 长度最小的子数组

## 题目描述

给定一个含有 `n` 个正整数的数组和一个正整数 `target`。

找出该数组中满足其总和大于等于 `target` 的长度最小的 **连续子数组** `[nums_l, nums_{l+1}, ..., nums_{r-1}, nums_r]`，并返回其长度。如果不存在符合条件的子数组，返回 `0`。

**示例 1：**

```
输入：target = 7, nums = [2,3,1,2,4,3]
输出：2
解释：子数组 [4,3] 是该条件下的长度最小的子数组。
```

**示例 2：**

```
输入：target = 4, nums = [1,4,4]
输出：1
```

**示例 3：**

```
输入：target = 11, nums = [1,1,1,1,1,1,1,1]
输出：0
```

**约束条件：**

- `1 <= target <= 10^9`
- `1 <= nums.length <= 10^5`
- `1 <= nums[i] <= 10^4`

**进阶：** 如果你已经实现 O(n) 的解法，请尝试设计一个 O(n log(n)) 的解法。

## 题目分析

**算法思路：** 使用变长滑动窗口。维护 `left` 和 `right` 两个指针，`sum` 记录窗口内元素和：

1. 不断扩展右边界 `right`，将 `nums[right]` 加入 `sum`
2. 当 `sum >= target` 时，尝试收缩左边界 `left`，同时更新最小长度
3. 收缩时从 `sum` 中减去 `nums[left]`，直到 `sum < target`

**时间复杂度：** O(n)，每个元素最多被加入和移除各一次。

**空间复杂度：** O(1)。

## Go 代码实现

```go
// minSubArrayLen 找到和 >= target 的最短连续子数组的长度
// 使用变长滑动窗口
func minSubArrayLen(target int, nums []int) int {
    n := len(nums)
    // minLen 记录最短子数组长度，初始化为 n+1（不可能的值）
    minLen := n + 1
    // left 为窗口左边界，sum 为窗口内元素和
    left := 0
    sum := 0

    // right 为窗口右边界，不断扩展
    for right := 0; right < n; right++ {
        // 将右边界元素加入窗口
        sum += nums[right]

        // 当窗口和满足条件时，尝试收缩左边界
        for sum >= target {
            // 更新最短长度
            curLen := right - left + 1
            if curLen < minLen {
                minLen = curLen
            }
            // 收缩左边界
            sum -= nums[left]
            left++
        }
    }

    // 如果 minLen 没有被更新过，说明不存在符合条件的子数组
    if minLen == n+1 {
        return 0
    }
    return minLen
}
```
