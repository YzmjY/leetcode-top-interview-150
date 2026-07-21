# 140. 零钱兑换 (Coin Change)

## 题目描述

给你一个整数数组 `coins`，表示不同面额的硬币；以及一个整数 `amount`，表示总金额。

计算并返回可以凑成总金额所需的 **最少的硬币个数**。如果没有任何一种硬币组合能组成总金额，返回 `-1`。

你可以认为每种硬币的数量是无限的。

**示例 1：**

```
输入：coins = [1, 2, 5], amount = 11
输出：3 
解释：11 = 5 + 5 + 1
```

**示例 2：**

```
输入：coins = [2], amount = 3
输出：-1
```

**示例 3：**

```
输入：coins = [1], amount = 0
输出：0
```

**约束条件：**

- `1 <= coins.length <= 12`
- `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`

## 题目分析

### 算法思路

**方法一：一维 DP（完全背包变种）**

- **状态定义**：`dp[i]` = 凑出金额 i 所需的最少硬币数。
- **状态转移**：对于金额 i，枚举每种硬币面额 coin：
  - `dp[i] = min(dp[i], dp[i-coin] + 1)`
  - 前提：`i >= coin` 且 `dp[i-coin]` 可达（不是 -1 或无穷大）。
- **边界条件**：`dp[0] = 0`（凑出 0 元需要 0 个硬币）。
- **初始化**：`dp[1..amount] = amount + 1`（一个不可能的大数）。

**方法二：BFS（进阶思路）**

将问题建模为图：每个金额是一个节点，每使用一枚硬币相当于走一步。用 BFS 从 0 出发找 amount，找到时步数即为最少硬币数。

### 复杂度分析

- **时间复杂度**：O(amount * n)，n 为硬币种类数。
- **空间复杂度**：O(amount)。

### 关键点

- 这是"完全背包"问题的变种，物品（硬币）可以无限使用。
- 注意无法凑出时的返回值。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/140-coin-change-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="零钱兑换 (Coin Change) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "math"

func coinChange(coins []int, amount int) int {
    if amount == 0 {
        return 0
    }

    // dp[i] 表示凑出金额 i 所需的最少硬币数
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ {
        dp[i] = math.MaxInt32
    }

    for i := 1; i <= amount; i++ {
        for _, coin := range coins {
            if i >= coin && dp[i-coin] != math.MaxInt32 {
                if dp[i-coin]+1 < dp[i] {
                    dp[i] = dp[i-coin] + 1
                }
            }
        }
    }

    if dp[amount] == math.MaxInt32 {
        return -1
    }
    return dp[amount]
}
```
