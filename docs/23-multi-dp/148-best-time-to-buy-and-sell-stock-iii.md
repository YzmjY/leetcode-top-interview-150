# 148. 买卖股票的最佳时机 III (Best Time to Buy and Sell Stock III)

## 题目描述

给定一个数组，它的第 `i` 个元素是一支给定的股票在第 `i` 天的价格。

设计一个算法来计算你所能获取的最大利润。你最多可以完成 **两笔** 交易。

**注意：** 你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。

**示例 1：**

```
输入：prices = [3,3,5,0,0,3,1,4]
输出：6
解释：在第 4 天（股票价格 = 0）的时候买入，在第 6 天（股票价格 = 3）的时候卖出，这笔交易所能获得利润 = 3-0 = 3 。
     随后，在第 7 天（股票价格 = 1）的时候买入，在第 8 天 （股票价格 = 4）的时候卖出，这笔交易所能获得利润 = 4-1 = 3 。
```

**示例 2：**

```
输入：prices = [1,2,3,4,5]
输出：4
解释：在第 1 天（股票价格 = 1）的时候买入，在第 5 天 （股票价格 = 5）的时候卖出, 这笔交易所能获得利润 = 5-1 = 4 。
     注意你不能在第 1 天和第 2 天接连购买股票，之后再将它们卖出。
     因为这样属于同时参与了多笔交易，你必须在再次购买前出售掉之前的股票。
```

**示例 3：**

```
输入：prices = [7,6,4,3,1]
输出：0
解释：在这个情况下, 没有交易完成, 所以最大利润为 0。
```

**示例 4：**

```
输入：prices = [1]
输出：0
```

**约束条件：**

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^5`

## 题目分析

### 算法思路

**方法：状态机 DP（三维 -> 二维优化）**

每天有 4 种状态（因为最多 2 笔交易）：
- `buy1`：第一次买入后的最大利润
- `sell1`：第一次卖出后的最大利润
- `buy2`：第二次买入后的最大利润
- `sell2`：第二次卖出后的最大利润

**状态转移：**
- `buy1 = max(buy1, -prices[i])`：要么保持之前的 buy1，要么在第 i 天第一次买入。
- `sell1 = max(sell1, buy1 + prices[i])`：要么保持，要么在 buy1 的基础上卖出。
- `buy2 = max(buy2, sell1 - prices[i])`：在第一次卖出的基础上第二次买入。
- `sell2 = max(sell2, buy2 + prices[i])`：在第二次买入的基础上卖出。

初始值：`buy1 = buy2 = -inf`，`sell1 = sell2 = 0`。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历。
- **空间复杂度**：O(1)，只用 4 个变量。

### 关键点

- 状态机模型的精髓在于用少数几个变量表示所有可能的"当前状态"。
- `buy1` 的初始值为 `math.MinInt32`（或 `-prices[0]`），表示初始时不可能持有股票。
- 此题也可以转化为"两次交易的分割"：枚举分割点，左边做一次买卖，右边做一次买卖。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/148-best-time-to-buy-and-sell-stock-iii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="买卖股票的最佳时机 III (Best Time to Buy and Sell Stock III) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "math"

func maxProfit3(prices []int) int {
    buy1 := math.MinInt32  // 第一次买入后的最大利润
    sell1 := 0              // 第一次卖出后的最大利润
    buy2 := math.MinInt32   // 第二次买入后的最大利润
    sell2 := 0              // 第二次卖出后的最大利润

    for _, price := range prices {
        buy1 = max(buy1, -price)
        sell1 = max(sell1, buy1+price)
        buy2 = max(buy2, sell1-price)
        sell2 = max(sell2, buy2+price)
    }

    return sell2
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```
