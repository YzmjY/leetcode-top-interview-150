# 149. 买卖股票的最佳时机 IV (Best Time to Buy and Sell Stock IV)

## 题目描述

给你一个整数数组 `prices` 和一个整数 `k`，其中 `prices[i]` 是某支给定的股票在第 `i` 天的价格。

设计一个算法来计算你所能获取的最大利润。你最多可以完成 `k` 笔交易。也就是说，你最多可以买 `k` 次，卖 `k` 次。

**注意：** 你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。

**示例 1：**

```
输入：k = 2, prices = [2,4,1]
输出：2
解释：在第 1 天 (股票价格 = 2) 的时候买入，在第 2 天 (股票价格 = 4) 的时候卖出，这笔交易所能获得利润 = 4-2 = 2 。
```

**示例 2：**

```
输入：k = 2, prices = [3,2,6,5,0,3]
输出：7
解释：在第 2 天 (股票价格 = 2) 的时候买入，在第 3 天 (股票价格 = 6) 的时候卖出, 这笔交易所能获得利润 = 6-2 = 4 。
     随后，在第 5 天 (股票价格 = 0) 的时候买入，在第 6 天 (股票价格 = 3) 的时候卖出, 这笔交易所能获得利润 = 3-0 = 3 。
```

**约束条件：**

- `1 <= k <= 100`
- `1 <= prices.length <= 1000`
- `0 <= prices[i] <= 1000`

## 题目分析

### 算法思路

**方法：泛化状态机 DP（k 笔交易）**

此题是 Stock III（k=2）的泛化版，支持任意 k。

定义 `buy[i]` 和 `sell[i]` 分别表示第 i 次交易（买入/卖出）后的最大利润。

**状态转移：**
- `buy[j] = max(buy[j], sell[j-1] - price)`：在第 j 次买入。
- `sell[j] = max(sell[j], buy[j] + price)`：在第 j 次卖出。

**优化：当 k 很大时**

如果 k >= n/2（n 为总天数），问题退化为可以无限次交易（Stock II），直接用贪心：
- 累加所有 prices[i] > prices[i-1] 的差值即可。

### 复杂度分析

- **时间复杂度**：O(n * k)，但 k 被限制在 min(k, n/2) 内。实际为 O(n * min(k, n/2))。
- **空间复杂度**：O(k)。

### 关键点

- 泛化状态机的模板通用性强，可以解决整个 Stock 系列（I-VI）。
- 注意 k 很大时的退化处理。

## Go 代码实现

```go
package main

import "math"

func maxProfit4(k int, prices []int) int {
    n := len(prices)
    if n == 0 || k == 0 {
        return 0
    }

    // 如果 k 大于 n/2，相当于可以无限交易（Stock II）
    if k >= n/2 {
        maxProfit := 0
        for i := 1; i < n; i++ {
            if prices[i] > prices[i-1] {
                maxProfit += prices[i] - prices[i-1]
            }
        }
        return maxProfit
    }

    // 初始化 buy 和 sell 数组
    buy := make([]int, k+1)
    sell := make([]int, k+1)
    for i := 0; i <= k; i++ {
        buy[i] = math.MinInt32
    }

    for _, price := range prices {
        for j := 1; j <= k; j++ {
            buy[j] = max(buy[j], sell[j-1]-price)
            sell[j] = max(sell[j], buy[j]+price)
        }
    }

    return sell[k]
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```
