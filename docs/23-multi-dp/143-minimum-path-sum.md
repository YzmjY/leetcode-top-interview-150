# 143. 最小路径和 (Minimum Path Sum)

## 题目描述

给定一个包含非负整数的 `m x n` 网格 `grid`，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。

**说明：** 每次只能向下或者向右移动一步。

**示例 1：**

```
输入：grid = [[1,3,1],[1,5,1],[4,2,1]]
输出：7
解释：因为路径 1->3->1->1->1 的总和最小。
```

**示例 2：**

```
输入：grid = [[1,2,3],[4,5,6]]
输出：12
```

**约束条件：**

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 200`
- `0 <= grid[i][j] <= 200`

## 题目分析

### 算法思路

**方法：二维 DP**

- **状态定义**：`dp[i][j]` = 从左上角 `(0, 0)` 走到 `(i, j)` 的最小路径和。
- **状态转移**：
  - 每个位置 `(i, j)` 只能从上方 `(i-1, j)` 或左方 `(i, j-1)` 到达。
  - `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`
- **边界条件**：
  - `dp[0][0] = grid[0][0]`
  - 第一行：`dp[0][j] = dp[0][j-1] + grid[0][j]`（只能从左边来）
  - 第一列：`dp[i][0] = dp[i-1][0] + grid[i][0]`（只能从上方来）

**空间优化**：由于 `dp[i][j]` 只依赖于上方和左方，可以用一维数组滚动更新：
- `dp[j] = grid[i][j] + min(dp[j]（上方）, dp[j-1]（左方）)`

### 复杂度分析

- **时间复杂度**：O(m * n)，需要遍历整个网格。
- **空间复杂度**：O(n)（一维数组优化）或 O(m * n)（完整 DP 表）。

### 关键点

- 这是最经典的网格 DP 问题之一，与"不同路径"问题思路一致。
- 可以直接在原数组上修改以节省空间（如果可以修改输入）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/143-minimum-path-sum-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="最小路径和 (Minimum Path Sum) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func minPathSum(grid [][]int) int {
    m, n := len(grid), len(grid[0])

    // 可以直接在原数组上修改，节省空间
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if i == 0 && j == 0 {
                continue // 起点不变
            } else if i == 0 {
                // 第一行：只能从左来
                grid[i][j] += grid[i][j-1]
            } else if j == 0 {
                // 第一列：只能从上来
                grid[i][j] += grid[i-1][j]
            } else {
                // 取上方和左方的最小值
                if grid[i-1][j] < grid[i][j-1] {
                    grid[i][j] += grid[i-1][j]
                } else {
                    grid[i][j] += grid[i][j-1]
                }
            }
        }
    }

    return grid[m-1][n-1]
}
```
