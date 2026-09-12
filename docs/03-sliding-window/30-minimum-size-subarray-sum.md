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

**算法思路：** 要求「连续子数组之和 >= target」且长度最小。数组元素**全为正数**是关键——它保证窗口的和随右边界扩展单调不减、随左边界收缩单调不增，两个指针才能都不回头地单调移动。暴力枚举所有子数组是 O(n²)，滑动窗口可以做到 O(n)。

**算法步骤：**

1. `left = 0`，`sum = 0`，`minLen = n + 1`（用不可能取到的值作哨兵）。
2. `right` 从 0 到 `n-1` 逐步扩展，把 `nums[right]` 加入 `sum`。
3. 只要 `sum >= target`，就进入收缩循环：
   - 用 `right - left + 1` 更新 `minLen`；
   - 把 `nums[left]` 移出窗口（`sum -= nums[left]`，`left++`），继续尝试更短的窗口。
4. 循环结束后若 `minLen` 仍是 `n + 1`，说明不存在满足条件的子数组，返回 0；否则返回 `minLen`。

**为什么正确：** 对固定的右端点 `right`，收缩循环依次检验以 `right` 结尾、长度从大到小的所有合法窗口，直到和不满足 target 为止。由于全是正数，去掉左端元素后和只会变小，一旦 `sum < target` 再缩短只会更不满足，因此本轮记录到的**最后一个**合法窗口就是「以 `right` 结尾的最短合法窗口」。任何合法子数组都有自己的右端点，枚举所有 `right` 就覆盖了全部候选，取最小值即为全局最优。

**不变量：** 外层每轮开始时，`sum` 等于 `nums[left..right-1]` 的和（上一轮留下的不满足 target 的窗口）；每轮结束时，所有以 `right` 结尾的合法子数组都已被检查，`minLen` 记录了它们中最短的长度。

**时间复杂度：** O(n)。`right` 从 0 走到 n-1，`left` 全程也只增不减地走到 n，每个元素最多被加入、移出各一次。

**空间复杂度：** O(1)，只有窗口和、最小长度和两个指针。

**易错点：**

- 「全部为正数」是滑动窗口成立的前提；若允许负数，收缩左边界不一定让和变小，必须换用前缀和 + 二分等方法。
- `minLen` 用 `n + 1` 作哨兵，返回前必须判断是否更新过，否则无解时会错误返回 `n + 1`。
- 收缩要用 `for` 而不是 `if`：一次扩展可能允许连续收缩多步，用 `if` 会漏掉更短的窗口。
- 更新 `minLen` 必须在移除 `nums[left]` 之前，长度要用当前窗口的 `right - left + 1` 计算。
- 边界：`n = 1` 且 `nums[0] < target` 时返回 0；`target` 可以远大于数组总和。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/30-minimum-size-subarray-sum-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="长度最小的子数组 - 交互演示">
</iframe>

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
