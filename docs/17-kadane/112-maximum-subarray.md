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

本题是 Kadane 算法的经典应用。核心思想是动态规划，定义状态：

- 设 `dp[i]` 表示**以第 i 个元素结尾**的子数组的最大和。
- 状态转移方程：`dp[i] = max(nums[i], dp[i-1] + nums[i])`
  - 要么从当前元素重新开始（当 dp[i-1] < 0 时）
  - 要么接在前面的子数组后面
- 最终答案：`max(dp[0], dp[1], ..., dp[n-1])`

由于 `dp[i]` 只依赖 `dp[i-1]`，我们可以将空间复杂度从 O(n) 优化到 O(1)。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 是数组长度。只需一次遍历。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 状态定义"以 i 结尾"保证了子数组的连续性。
- 当 `maxEndingHere` 为负数时，舍弃之前的部分，从当前元素重新开始。
- 该算法能正确处理全负数数组（返回最大的单个元素）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/112-maximum-subarray-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
