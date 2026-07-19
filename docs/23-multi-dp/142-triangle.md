# 142. 三角形最小路径和 (Triangle)

## 题目描述

给定一个三角形 `triangle`，找出自顶向下的最小路径和。

每一步只能移动到下一行中相邻的结点上。相邻的结点在这里指的是 **下标** 与上一层结点下标相同或者等于上一层结点下标 +1 的两个结点。也就是说，如果正位于当前行的下标 `i`，那么下一步可以移动到下一行的下标 `i` 或 `i + 1`。

**示例 1：**

```
输入：triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]
输出：11
解释：如下面简图所示：
   2
  3 4
 6 5 7
4 1 8 3
自顶向下的最小路径和为 11（即，2 + 3 + 5 + 1 = 11）。
```

**示例 2：**

```
输入：triangle = [[-10]]
输出：-10
```

**约束条件：**

- `1 <= triangle.length <= 200`
- `triangle[0].length == 1`
- `triangle[i].length == triangle[i-1].length + 1`
- `-10^4 <= triangle[i][j] <= 10^4`

**进阶：** 你可以只使用 O(n) 的额外空间（n 为三角形的总行数）来解决这个问题吗？

## 题目分析

### 算法思路

**方法一：自底向上 DP（推荐）**

从三角形的底层开始向上递推，`dp[i][j]` 表示从位置 `(i, j)` 到底层的最小路径和。

- **状态转移**：`dp[i][j] = triangle[i][j] + min(dp[i+1][j], dp[i+1][j+1])`
- **边界**：最后一行的 `dp` 值就是 `triangle` 最后一行的值。
- **答案**：`dp[0][0]`

**方法二：自顶向下 DP**

从顶层向下递推，每层更新下一层的最小路径和。

**空间优化**：由于每层只依赖下一层，可以只用一维数组存储当前行的 dp 值。自底向上时，一维数组的滚动更新更加自然。

### 复杂度分析

- **时间复杂度**：O(n^2)，其中 n 为行数，需要遍历所有元素。
- **空间复杂度**：O(n)（一维数组优化）或 O(n^2)（完整的二维 DP 表）。

### 关键点

- 自底向上比自顶向下更简洁，不需要处理边界比较。
- 一维空间优化：`dp[j] = triangle[i][j] + min(dp[j], dp[j+1])`


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/142-triangle-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="三角形最小路径和 (Triangle) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func minimumTotal(triangle [][]int) int {
    n := len(triangle)
    if n == 0 {
        return 0
    }

    // dp 初始化为最后一行的值
    dp := make([]int, n)
    copy(dp, triangle[n-1])

    // 自底向上
    for i := n - 2; i >= 0; i-- {
        for j := 0; j < len(triangle[i]); j++ {
            dp[j] = triangle[i][j] + min(dp[j], dp[j+1])
        }
    }

    return dp[0]
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```
