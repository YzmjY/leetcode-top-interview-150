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

**算法思路：** 约束只作用在相邻的两个孩子之间，所以可以逐个方向看：孩子 `i` 的糖果数至少是「1 + 左边连续比他评分低的人数」，也至少是「1 + 右边连续比他评分低的人数」，即两侧的严格递减链长度。这两个下界分别用一次从左到右、一次从右到左的扫描就能求出，最终取每个孩子两个下界的较大值即可同时满足左右两侧的所有约束。

**算法步骤：**

1. `candies` 全部初始化为 1（每人至少 1 颗）。
2. **左规则**：从左向右遍历 `i = 1..n-1`，若 `ratings[i] > ratings[i-1]`，则 `candies[i] = candies[i-1] + 1`；否则保持不变。
3. **右规则**：从右向左遍历 `i = n-2..0`，若 `ratings[i] > ratings[i+1]`，则 `candies[i] = max(candies[i], candies[i+1] + 1)`。
4. 返回 `candies` 的元素总和。

**为什么正确（下界 + 可达性）：**

- **下界：** 记 `inc[i]` 为以 `i` 结尾的严格递增链长度（`ratings[i] > ratings[i-1] > ...`），由相邻约束反复推导可知任何合法方案都满足 `candies[i] >= inc[i]`；左规则算出的恰好就是 `inc[i]`。同理记 `dec[i]` 为以 `i` 开头的严格递减链长度，右规则给出 `dec[i]`。因此任何合法方案都有 `candies[i] >= max(inc[i], dec[i])`，总糖果数不可能少于 `sum(max(inc[i], dec[i]))`。
- **可达性：** 第二次遍历结束后 `candies[i] = max(inc[i], dec[i])`。对相邻的两个孩子：
  - 若 `ratings[i] > ratings[i+1]`，则 `dec[i] = dec[i+1] + 1`，且由于 `i` 不比 `i+1` 小，以 `i+1` 结尾的递增链必然只含它自己（`inc[i+1] = 1 <= dec[i+1]`），故 `candies[i+1] = dec[i+1]`，而 `candies[i] >= dec[i] = dec[i+1] + 1 > candies[i+1]`，满足约束；
  - 若 `ratings[i] < ratings[i+1]` 则完全对称，有 `candies[i] = inc[i]` 且 `candies[i+1] >= inc[i+1] = inc[i] + 1`；
  - 若 `ratings[i] == ratings[i+1]`，题目不施加约束，取不小于 1 的值即可。
  两次扫描后每个位置都取到了下界，且恰好构成合法方案，因此它就是最优解。

**时间复杂度：** O(n)，两次线性遍历加一次求和。

**空间复杂度：** O(n)，保存每个孩子的糖果数。该题也存在用递增/递减段直接累加的 O(1) 额外空间写法。

**易错点：**

- 评分相等时不能加糖果：约束只在「严格大于」时生效。若把左规则的条件误写成 `>=`，`[1,2,2]` 会得到 6，而正确答案是 4。
- 右规则必须取 `max(candies[i], candies[i+1] + 1)` 而不是直接赋值，否则会破坏左规则已建立的关系。
- 右规则要从右往左扫，保证用到的是 `candies[i+1]` 的最终值。
- 边界：`n == 1` 返回 1；严格递增（或递减）的数组答案是 `n*(n+1)/2`；`ratings` 中可能出现 0，初值仍为 1。
- 总和最大可达 `n*(n+1)/2 = 2*10⁸` 量级，用 `int` 计算即可（不会溢出 32 位）。


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
