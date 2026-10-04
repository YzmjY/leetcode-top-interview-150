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

**关键观察**：环形数组上的子数组（长度不超过 n）只有两种形态——要么完全落在某个断点之后（在数组「中间」，不跨越首尾），要么首尾相连、绕过一次边界。

- **情况一：最大子数组不跨越边界**
  这就是普通的最大子数组问题，用 Kadane 算法直接求最大子数组和 `maxSum`。

- **情况二：最大子数组跨越边界（首尾相连）**
  如果一个子数组绕过了边界，它在数组上占据「一段后缀 + 一段前缀」，被它排除的恰好是**中间一段连续的、不含首尾的整体**。要想让「首尾部分」的和最大，等价于让被排除的中间部分的和最小。于是：
  - 用 Kadane 的变体求**最小**子数组和 `minSum`；
  - 情况二的最大和 = `totalSum - minSum`。

**最终答案** = `max(maxSum, totalSum - minSum)`，两种情况取优即可覆盖所有子数组形态。

**为什么整体不会漏解**：任意一个长度不超过 n 的子数组，要么**不跨越边界**（在展开的线性数组里是一段连续区间），归入情况一；要么**跨越边界**（同时包含下标 0 和下标 n-1），归入情况二。两类互斥且完备。

**退化情况（必须处理）**：`totalSum - minSum` 的含义是「总和减去中间被排除的一段」，它要求中间那段非空。当**整段数组本身就是最小子数组**时 `minSum == totalSum`，此时 `totalSum - minSum = 0` 对应的是「空子数组」，题目要求非空，所以这个候选值不合法，应直接返回 `maxSum`。

什么时候会出现 `minSum == totalSum`？判断依据就是代码里的 `totalSum == minSoFar`，它的含义是**整段数组本身就是一个和最小的子数组**。常见情形有：

- 数组中没有正数（全负数或含 0，如 `[-3,-2,-3]`、`[-1,0]`、`[0,0]`），此时去掉任何非正元素都不会让和更小；
- 数组里虽有正数，但整段的和仍然小于任何「真子数组」的和，例如 `[-3,1,-3]`（整段和为 -5，任何真子数组的和都大于 -5）；
- `n == 1`。

这些情况下 `totalSum - minSum = 0` 只对应空子数组，属非法，所以直接返回 `maxSum`。注意不要简单理解成「数组全为负数」——含 0 的非正数组、乃至 `[-3,1,-3]` 这类数组同样会触发该分支。

### 为什么正确

- **情况一**：Kadane 算法的正确性（见 112 题）保证 `maxSum` 是所有不跨越边界的连续子数组的最大和。
- **情况二**：跨越边界的子数组与「其补集——中间一段连续子数组」一一对应；补集和越小，首尾部分和越大。`minSum` 是所有连续子数组的最小和，因此 `totalSum - minSum` 是这类子数组的最大和（在补集非空即 `minSum < totalSum` 时）。
- **合并**：答案取两者较大者，覆盖全部合法子数组。
- **退化分支**：`minSum == totalSum` 时 `totalSum - minSum` 只代表空子数组，属非法，直接取 `maxSum`；此时任何真子数组的和都大于整段的和，情况二不可能更优。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历同时维护最大、最小两组 Kadane 状态与总和。
- **空间复杂度**：O(1)，只使用常数个滚动变量。

### 关键点

- 巧妙地将环形问题转化为求「最大子数组和」与「最小子数组和」的结合。
- 判断退化的正确依据是 `totalSum == minSum`（整段数组就是最小子数组），代码正是这么写的；不要只按「全为负数」理解。
- 求最小子数组和时也要用非空的初始值 `nums[0]`，不能用 0。

### 易错点 / 边界情况

- **退化条件**：全负数（如 `[-3,-2,-3]` 返回 `-2`）、含 0 的非正数组（如 `[-1,0]` 返回 `0`）、`[-3,1,-3]`（整段和 -5 就是最小子数组）以及 `n == 1` 都会触发，必须返回 `maxSum`。判断依据是 `totalSum == minSoFar`，不要只按「数组全为负数」理解。
- **空数组**：题目约束 `n ≥ 1`，代码的 `n == 0` 分支只是防御性写法。
- **长度限制**：环形子数组最多只能包含每个元素一次，所以情况二「首尾拼接」不会重复使用元素——被排除的中间段非空即可保证这一点。
- **溢出**：`n ≤ 3·10⁴`、`|nums[i]| ≤ 3·10⁴`，和的绝对值不超过 9·10⁸，`int` 足够。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/113-maximum-sum-circular-subarray-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="环形子数组的最大和 - 交互演示">
</iframe>

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
