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

**朴素想法**：枚举所有硬币组合再取最少数量，组合数随 amount 爆炸。换角度想：考虑凑出金额 i，枚举**最后一枚硬币**的面额 coin，则凑出 i 的最少硬币数 = 凑出 `i-coin` 的最少硬币数 + 1。由于 i-coin < i，这是天然的无后效性递推；又因为每种硬币可无限使用，属于完全背包。

**方法一：一维 DP（完全背包变种）**

- **状态定义**：`dp[i]` = 凑出金额 i 所需的最少硬币数，无法凑出时记为一个「不可达」的哨兵值。
- **状态转移**：`dp[i] = min(dp[i], dp[i-coin] + 1)`，对所有满足 `i >= coin` 且 `dp[i-coin]` 可达的 coin。枚举最后一枚硬币的面额即可覆盖所有组合。
- **边界条件**：`dp[0] = 0`（凑 0 元不需要硬币）。
- **初始化**：`dp[1..amount]` 全部置为 `math.MaxInt32` 作为「不可达」标记。代码用 `math.MaxInt32` 而不是 `amount+1`，并在转移前检查 `dp[i-coin] != math.MaxInt32`：既不会把不可达状态误当作有效值，也避免了 `+1` 溢出。最后若 `dp[amount]` 仍是 `math.MaxInt32`，说明不可达，返回 -1。

**为什么正确**：设最优解中最后一枚硬币面额为 coin，则去掉它之后是凑出 `i-coin` 的一个方案。若该方案不是凑出 `i-coin` 的最优解（还能更少），替换后整体会更少，与最优性矛盾；因此 `dp[i-coin] + 1` 在取遍所有 coin 后一定能取到最优解。反过来，每个 `dp[i-coin] + 1` 都对应一个合法方案，不会得到比最优更小的非法值。据此由小到大递推即可。

**方法二：BFS（进阶思路）**

把每个金额看作图上的节点，从金额 y 使用面额 coin 到 y+coin 连一条边，所有边权为 1。问题变成从 0 出发到 amount 的最短路，用 BFS 逐层扩展即可；第一次访问到 amount 时的层数就是最少硬币数。复杂度与 DP 同级，并且能在很多「无解」输入上更早退出。

### 复杂度分析

- **时间复杂度**：O(amount × n)，n 为硬币种类数。状态数 O(amount)，每个状态枚举 n 种硬币。
- **空间复杂度**：O(amount)，dp 数组（BFS 还需一个访问标记数组，量级相同）。

### 关键点

- 这是「完全背包」求最小值的问题，物品可以无限使用；因为状态转移用的是更小的金额，金额从 1 到 amount 正序遍历即可，无需考虑硬币顺序。
- 不可达状态必须用哨兵值显式标记，否则 `0 + 1` 会被误当成「1 枚硬币」。
- 用 `math.MaxInt32` 做哨兵时，转移前必须判 `dp[i-coin] != math.MaxInt32`，否则 `+1` 会溢出成负数。
- amount = 0 的输入直接返回 0（代码开头已处理）；硬币面额可以大于 amount，`i >= coin` 会把它们跳过。


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
