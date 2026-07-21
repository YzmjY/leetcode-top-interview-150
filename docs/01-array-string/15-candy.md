# 15. 分发糖果

## 题目描述

`n` 个孩子站成一排。给你一个整数数组 `ratings` 表示每个孩子的评分。

你需要按照以下要求，给这些孩子分发糖果：

- 每个孩子至少分配到 `1` 个糖果。
- 相邻两个孩子中，评分更高的孩子必须获得更多的糖果。

请你给每个孩子分发糖果，计算并返回需要准备的 **最少糖果数目**。

**示例 1：**

```
输入：ratings = [1,0,2]
输出：5
解释：你可以分别给第一个、第二个、第三个孩子分发 2、1、2 颗糖果。
```

**示例 2：**

```
输入：ratings = [1,2,2]
输出：4
解释：你可以分别给第一个、第二个、第三个孩子分发 1、2、1 颗糖果。
第三个孩子只得到 1 颗糖果，这满足题面中的两个条件。
```

**约束条件：**

- `n == ratings.length`
- `1 <= n <= 2 * 10^4`
- `0 <= ratings[i] <= 2 * 10^4`

## 题目分析

**算法思路：** 使用贪心策略，分两次遍历。

- **左规则**：从左向右遍历，如果 `ratings[i] > ratings[i-1]`，则 `candies[i] = candies[i-1] + 1`；否则 `candies[i] = 1`
- **右规则**：从右向左遍历，如果 `ratings[i] > ratings[i+1]`，则 `candies[i] = max(candies[i], candies[i+1] + 1)`

第一次遍历确保每个孩子比左边评分低的孩子拿得多，第二次遍历确保每个孩子比右边评分低的孩子拿得多。取两者最大值即可同时满足两个规则。

**时间复杂度：** O(n)，两次遍历。

**空间复杂度：** O(n)，需要糖果数组。可优化为 O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/15-candy-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="分发糖果 - 交互演示">
</iframe>

## Go 代码实现

```go
// candy 计算需要准备的最少糖果数量
// 使用两次遍历的贪心策略
func candy(ratings []int) int {
    n := len(ratings)
    // candies 记录每个孩子分配的糖果数量，初始都为 1
    candies := make([]int, n)
    for i := range candies {
        candies[i] = 1
    }

    // 从左向右遍历：处理左规则
    // 如果当前评分比左边高，糖果数 = 左边糖果数 + 1
    for i := 1; i < n; i++ {
        if ratings[i] > ratings[i-1] {
            candies[i] = candies[i-1] + 1
        }
    }

    // 从右向左遍历：处理右规则
    // 如果当前评分比右边高，取当前值和右边 + 1 的最大值
    for i := n - 2; i >= 0; i-- {
        if ratings[i] > ratings[i+1] {
            if candies[i+1]+1 > candies[i] {
                candies[i] = candies[i+1] + 1
            }
        }
    }

    // 计算总糖果数
    total := 0
    for _, c := range candies {
        total += c
    }
    return total
}
```
