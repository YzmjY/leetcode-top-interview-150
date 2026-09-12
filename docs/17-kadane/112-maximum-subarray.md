# 112. 最大子数组和

## 题目描述

给你一个整数数组 `nums`，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

**子数组** 是数组中的一个连续部分。

### 示例 1

```
输入：nums = [-2,1,-3,4,-1,2,1,-5,4]
输出：6
解释：连续子数组 [4,-1,2,1] 的和最大，为 6 。
```

### 示例 2

```
输入：nums = [1]
输出：1
```

### 示例 3

```
输入：nums = [5,4,-1,7,8]
输出：23
```

### 约束条件

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## 题目分析

### 算法思路

**朴素想法**：枚举所有子数组 `[i, j]` 求和，共有 O(n²) 个区间、每个区间求和 O(n)，复杂度 O(n³)（前缀和优化后 O(n²)），对于 n = 10⁵ 太慢。需要利用「子数组连续」这一结构把重复计算省掉。

**关键观察**：固定子数组的右端点 `i`。所有以 `i` 结尾的子数组，要么就是 `nums[i]` 本身，要么是「某个以 `i-1` 结尾的子数组」再接上 `nums[i]`。也就是说，只要知道「以 `i-1` 结尾的最大和」，就能 O(1) 推出「以 `i` 结尾的最大和」——这正是动态规划。

**状态定义**：设 `dp[i]` 表示**以第 i 个元素结尾**的所有子数组中的最大和（第 i 个元素必须被选中）。

**状态转移**：

```
dp[i] = max(nums[i], dp[i-1] + nums[i])
```

含义是二选一：

- 从当前元素**重新开始**（放弃前面的部分）——当 `dp[i-1] < 0` 时加进来只会变小；
- **接在**前面的子数组后面。

**最终答案**：`max(dp[0], dp[1], ..., dp[n-1])`。注意答案不是 `dp[n-1]`，因为最大子数组不一定以最后一个元素结尾。

由于 `dp[i]` 只依赖 `dp[i-1]`，可以用一个变量滚动更新，把空间从 O(n) 降到 O(1)。代码中的 `maxEndingHere` 就是 `dp[i]`，`maxSoFar` 是所有 `dp` 值的最大值。

代码里把 `max` 展开成了 if：`if maxEndingHere+nums[i] > nums[i]`，等价于判断 `maxEndingHere > 0`；当 `maxEndingHere == 0` 时两个分支算出的值相同，所以与状态转移方程完全一致。

### 为什么正确

对下标 `i` 归纳证明 `maxEndingHere` 恰好等于 `dp[i]`：

- `i = 0` 时，唯一以 `nums[0]` 结尾的子数组是 `[nums[0]]`，故 `dp[0] = nums[0]`，与初始化一致。
- 设 `maxEndingHere` 在进入第 i 轮前等于 `dp[i-1]`。以 `nums[i]` 结尾的子数组只有两类：`[nums[i]]` 和「以 `nums[i-1]` 结尾的某个子数组 + `nums[i]`」。前者的最大和是 `nums[i]`，后者的最大和是 `dp[i-1] + nums[i]`（子数组和与右端点后缀可分离），所以 `dp[i] = max(nums[i], dp[i-1]+nums[i])`，代码的转移正确。
- 每轮更新 `maxSoFar = max(maxSoFar, dp[i])`，遍历结束后 `maxSoFar = max_i dp[i]`。而任意子数组都以其右端点 i 结尾，因此最大子数组和必等于某个 `dp[i]`，故答案正确。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 是数组长度。只需一次遍历，每个元素 O(1) 工作。
- **空间复杂度**：O(1)，滚动变量 + 常数个临时变量。若保留整个 `dp` 数组则为 O(n)。

### 关键点

- 状态定义「以 i 结尾」保证了子数组的连续性，也让转移只需看前一个状态。
- 当 `maxEndingHere` 为负数时，舍弃之前的部分、从当前元素重新开始，一定不会丢失更优解。
- 答案要取所有 `dp[i]` 的最大值，不能只返回最后一个状态。
- 该算法能正确处理全负数数组（此时答案是数组中最大的单个元素，例如 `[-1,-2,-3]` 返回 `-1`）。

### 易错点 / 边界情况

- **初始化为 `nums[0]` 而不是 0**：否则全负数数组会被错误地返回 0。
- **`maxSoFar` 也要用 `nums[0]` 初始化**，同样是为了全负数的情况。
- **空数组**：题目约束 `n ≥ 1`，代码里的 `len(nums) == 0` 分支是防御性写法，正常输入不会走到。
- **溢出**：n ≤ 10⁵、|nums[i]| ≤ 10⁴，和的绝对值不超过 10⁹，`int` 足够。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/112-maximum-subarray-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="最大子数组和 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func maxSubArray(nums []int) int {
    if len(nums) == 0 {
        return 0
    }

    maxEndingHere := nums[0]
    maxSoFar := nums[0]

    for i := 1; i < len(nums); i++ {
        // 以当前位置结尾的最大子数组和：
        // 要么接在前面的子数组后面，要么从当前元素重新开始
        if maxEndingHere+nums[i] > nums[i] {
            maxEndingHere = maxEndingHere + nums[i]
        } else {
            maxEndingHere = nums[i]
        }

        // 更新全局最大值
        if maxEndingHere > maxSoFar {
            maxSoFar = maxEndingHere
        }
    }

    return maxSoFar
}

func main() {
    testCases := [][]int{
        {-2, 1, -3, 4, -1, 2, 1, -5, 4},
        {1},
        {5, 4, -1, 7, 8},
        {-1, -2, -3},
    }

    for _, nums := range testCases {
        fmt.Printf("nums = %v, 最大子数组和 = %d\n", nums, maxSubArray(nums))
    }
}
```
