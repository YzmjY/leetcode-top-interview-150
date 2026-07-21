# 137. 爬楼梯 (Climbing Stairs)

## 题目描述

假设你正在爬楼梯。需要 `n` 阶你才能到达楼顶。

每次你可以爬 `1` 或 `2` 个台阶。你有多少种不同的方法可以爬到楼顶呢？

**示例 1：**

```
输入：n = 2
输出：2
解释：有两种方法可以爬到楼顶。
1. 1 阶 + 1 阶
2. 2 阶
```

**示例 2：**

```
输入：n = 3
输出：3
解释：有三种方法可以爬到楼顶。
1. 1 阶 + 1 阶 + 1 阶
2. 1 阶 + 2 阶
3. 2 阶 + 1 阶
```

**约束条件：**

- `1 <= n <= 45`

## 题目分析

### 算法思路

**方法：斐波那契递推（DP）**

到达第 `i` 级台阶的方法数等于到达第 `i-1` 级的方法数（再爬 1 级）加上到达第 `i-2` 级的方法数（再爬 2 级）。

- **状态定义**：`dp[i]` = 爬到第 i 级台阶的方法数。
- **状态转移**：`dp[i] = dp[i-1] + dp[i-2]`
- **边界条件**：`dp[0] = 1`（从地面到第 0 级），`dp[1] = 1`。

这本质上就是斐波那契数列。

**空间优化**：由于 `dp[i]` 只依赖于前两个状态，可以用两个变量滚动更新，将空间复杂度降至 O(1)。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历。
- **空间复杂度**：O(1)，只使用两个变量。

### 关键点

- 这是一道最经典的 DP 入门题，体现了"最优子结构"思想。
- 滚动数组优化的模板适用于很多一维 DP 问题。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/137-climbing-stairs-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="爬楼梯 (Climbing Stairs) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func climbStairs(n int) int {
    if n <= 1 {
        return 1
    }

    // prev2 = dp[i-2], prev1 = dp[i-1]
    prev2, prev1 := 1, 1

    for i := 2; i <= n; i++ {
        current := prev1 + prev2
        prev2 = prev1
        prev1 = current
    }

    return prev1
}
```
