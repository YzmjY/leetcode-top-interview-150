# 138. 打家劫舍 (House Robber)

## 题目描述

你是一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响你偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，**如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警**。

给定一个代表每个房屋存放金额的非负整数数组，计算你 **不触动警报装置的情况下**，一夜之内能够偷窃到的最高金额。

**示例 1：**

```
输入：[1,2,3,1]
输出：4
解释：偷窃 1 号房屋 (金额 = 1) ，然后偷窃 3 号房屋 (金额 = 3)。
     偷窃到的最高金额 = 1 + 3 = 4 。
```

**示例 2：**

```
输入：[2,7,9,3,1]
输出：12
解释：偷窃 1 号房屋 (金额 = 2), 偷窃 3 号房屋 (金额 = 9)，接着偷窃 5 号房屋 (金额 = 1)。
     偷窃到的最高金额 = 2 + 9 + 1 = 12 。
```

**约束条件：**

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 400`

## 题目分析

### 算法思路

**方法：一维 DP（选/不选模式）**

对于第 i 间房屋，有两种选择：
- **不偷**：最大收益 = `dp[i-1]`
- **偷**：最大收益 = `dp[i-2] + nums[i]`（不能偷相邻的 i-1）

- **状态定义**：`dp[i]` = 偷前 i 间房子的最大收益。
- **状态转移**：`dp[i] = max(dp[i-1], dp[i-2] + nums[i])`
- **边界条件**：`dp[0] = nums[0]`，`dp[1] = max(nums[0], nums[1])`

**空间优化**：只需要 `dp[i-1]` 和 `dp[i-2]`，可以用两个变量维护。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历。
- **空间复杂度**：O(1)，滚动变量。

### 关键点

- 这是"选/不选"模式的经典模板。
- 与爬楼梯的区别在于：状态转移中多了"选与不选"的比较。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/138-house-robber-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="打家劫舍 (House Robber) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func rob(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }
    if n == 1 {
        return nums[0]
    }

    // prev2 = dp[i-2], prev1 = dp[i-1]
    prev2 := nums[0]
    prev1 := max(nums[0], nums[1])

    for i := 2; i < n; i++ {
        current := max(prev1, prev2+nums[i])
        prev2 = prev1
        prev1 = current
    }

    return prev1
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```
