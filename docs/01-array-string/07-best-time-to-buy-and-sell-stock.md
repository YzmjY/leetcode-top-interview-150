# 7. 买卖股票的最佳时机

## 题目描述

给定一个数组 `prices`，它的第 `i` 个元素 `prices[i]` 表示一支给定股票第 `i` 天的价格。

你只能选择 **某一天** 买入这只股票，并选择在 **未来的某一个不同的日子** 卖出该股票。设计一个算法来计算你所能获取的最大利润。

返回你可以从这笔交易中获取的最大利润。如果你不能获取任何利润，返回 `0`。

**示例 1：**

```
输入：[7,1,5,3,6,4]
输出：5
解释：在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5。
注意利润不能是 7-1 = 6, 因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票。
```

**示例 2：**

```
输入：prices = [7,6,4,3,1]
输出：0
解释：在这种情况下, 没有交易完成, 所以最大利润为 0。
```

**约束条件：**

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

## 题目分析

**算法思路：** 暴力做法是枚举所有「买入日 i、卖出日 j（j > i）」的组合取最大利润，需要 O(n²)。要降到 O(n)，可以把问题拆成：**枚举卖出日 j，则最优的买入价就是 j 之前出现过的最低价格**。于是只需一次扫描，边遍历边维护「到目前为止的历史最低价」，同时用当天价格减去历史最低价得到「今天卖出能获得的最大利润」，并随时更新全局最大值。

**算法步骤：**

1. `minPrice = prices[0]`（历史最低买入价），`maxProfit = 0`。
2. 从 `i = 1` 遍历到 `n-1`：
   - 计算 `profit = prices[i] - minPrice`，若大于 `maxProfit` 则更新 `maxProfit`；
   - 若 `prices[i] < minPrice`，更新 `minPrice = prices[i]`。
3. 返回 `maxProfit`。

**为什么正确：** 枚举卖出日 `j`，记前 `j` 天（下标 `0..j-1`）中的最低价为 `minPrice_j`。对固定的 `j`，`prices[j] - minPrice_j` 就是「第 `j` 天卖出」所能取得的最大利润，因为任何买入日 `i < j` 都满足 `prices[i] >= minPrice_j`。算法的每一步正是逐个枚举 `j` 并计算这个值，因此最终的最大值就是所有合法交易中的最大利润。注意 `minPrice` 一定取自 `j` 之前的元素，对应的「买入日」严格早于卖出日，所以这个利润总是对应一次合法交易，不会高估。另外，当价格持续下跌时每天算出的 `profit` 都为负，把 `maxProfit` 初始化为 0 可以保证结果不低于 0，符合「不能获利则返回 0」的要求。

**时间复杂度：** O(n)，只遍历一次数组，每次迭代常数时间。

**空间复杂度：** O(1)，只用了 `minPrice` 与 `maxProfit` 两个变量。

**易错点 / 边界情况：**

- 必须先计算利润、再更新 `minPrice`。若反过来先更新，`profit = prices[i] - min(prices[0..i])` 恒 `<= 0`，`maxProfit` 会一直是 0——这实际上变成了「同一天买入并卖出」。
- `maxProfit` 初始化为 0 而非 `prices[1]-prices[0]`，可以自然处理单调递减的数组（示例 2 返回 0）。
- 单元素数组 `[5]` 返回 0：循环不执行，直接返回初值。
- 不要写 `minPrice = prices[0]` 时假设数组非空——虽然约束保证 `n >= 1`，通用实现应先处理空数组以免 panic。
- 本题只允许完成一次交易（买一次、卖一次），不要累加多次交易的收益，那是下一题（122 买卖股票的最佳时机 II）的做法。
- 利润可能为负，但题目要求返回不低于 0，因此不能直接返回最后一天的 `profit`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/07-best-time-to-buy-and-sell-stock-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="买卖股票的最佳时机 - 交互演示">
</iframe>

## Go 代码实现

```go
// maxProfit 计算买卖股票一次能获得的最大利润
// 使用贪心策略，一次遍历
func maxProfit(prices []int) int {
    // minPrice 记录历史最低买入价格
    minPrice := prices[0]
    // maxProfit 记录当前最大利润
    maxProfit := 0

    for i := 1; i < len(prices); i++ {
        // 计算如果今天卖出能获得的利润
        profit := prices[i] - minPrice
        if profit > maxProfit {
            maxProfit = profit
        }
        // 更新历史最低价格
        if prices[i] < minPrice {
            minPrice = prices[i]
        }
    }

    return maxProfit
}
```
