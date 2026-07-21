# 11. H 指数

## 题目描述

给你一个整数数组 `citations`，其中 `citations[i]` 表示研究者的第 `i` 篇论文被引用的次数。计算并返回该研究者的 **h 指数**。

根据维基百科上 **h 指数的定义**：`h` 代表"高引用次数"，一名科研人员的 `h` 指数是指他（她）至少发表了 `h` 篇论文，并且每篇论文至少被引用了 `h` 次。如果 `h` 有多种可能的值，**h 指数** 是其中最大的那个。

**示例 1：**

```
输入：citations = [3,0,6,1,5]
输出：3
解释：给定数组表示研究者总共有 5 篇论文，每篇论文相应的被引用了 3, 0, 6, 1, 5 次。
由于研究者有 3 篇论文每篇至少被引用了 3 次，其余两篇论文每篇不多于 3 次，所以他的 h 指数是 3。
```

**示例 2：**

```
输入：citations = [1,3,1]
输出：1
```

**约束条件：**

- `n == citations.length`
- `1 <= n <= 5000`
- `0 <= citations[i] <= 1000`

## 题目分析

**算法思路：** 使用计数排序的思想。由于 h 指数不会超过论文总数 n，我们只需要关注引用次数在 0 到 n 之间的论文。创建一个长度为 `n+1` 的计数数组 `count`，`count[i]` 表示引用次数为 `i` 的论文数量（引用次数大于 n 的论文统一归入 `count[n]`）。然后从后向前遍历计数数组，累加论文数量，当累计数量大于等于当前引用次数时，就找到了 h 指数。

**时间复杂度：** O(n)，需要一次遍历和一次从后向前的扫描。

**空间复杂度：** O(n)，计数数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/11-h-index-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="H 指数 - 交互演示">
</iframe>

## Go 代码实现

```go
// hIndex 计算研究者的 H 指数
// 使用计数排序思想，h 指数不会超过数组长度 n
func hIndex(citations []int) int {
    n := len(citations)
    // count[i] 记录引用次数为 i 的论文数量
    // 引用次数大于等于 n 的论文统一记录在 count[n] 中
    count := make([]int, n+1)

    for _, c := range citations {
        if c >= n {
            count[n]++
        } else {
            count[c]++
        }
    }

    // total 记录引用次数 >= i 的论文累计数量
    total := 0
    // 从大到小遍历，寻找最大的满足条件的 h
    for i := n; i >= 0; i-- {
        total += count[i]
        // 如果引用次数 >= i 的论文数量 >= i，则 i 就是 h 指数
        if total >= i {
            return i
        }
    }
    return 0
}
```
