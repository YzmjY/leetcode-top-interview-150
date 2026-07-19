# 144. 不同路径 II (Unique Paths II)

## 题目描述

一个机器人位于一个 `m x n` 网格的左上角（起始点在下图中标记为 "Start"）。

机器人每次只能向下或者向右移动一步。机器人试图达到网格的右下角（在下图中标记为 "Finish"）。

现在考虑网格中有障碍物。那么从左上角到右下角将会有多少条不同的路径？

网格中的障碍物和空位置分别用 `1` 和 `0` 来表示。

**示例 1：**

```
输入：obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]
输出：2
解释：3x3 网格的正中间有一个障碍物。
从左上角到右下角一共有 2 条不同的路径：
1. 向右 -> 向右 -> 向下 -> 向下
2. 向下 -> 向下 -> 向右 -> 向右
```

**示例 2：**

```
输入：obstacleGrid = [[0,1],[0,0]]
输出：1
```

**约束条件：**

- `m == obstacleGrid.length`
- `n == obstacleGrid[i].length`
- `1 <= m, n <= 100`
- `obstacleGrid[i][j]` 为 `0` 或 `1`

## 题目分析

### 算法思路

**方法：二维 DP（带障碍物处理）**

此题是"不同路径 I"的变种。核心区别是遇到障碍物时需要特殊处理。

- **状态定义**：`dp[i][j]` = 从起点走到 `(i, j)` 的不同路径数。
- **状态转移**：
  - 如果 `obstacleGrid[i][j] == 1`（障碍物）：`dp[i][j] = 0`
  - 否则：`dp[i][j] = dp[i-1][j] + dp[i][j-1]`
- **边界条件**：
  - `dp[0][0] = 1`（除非起点是障碍物）
  - 第一行/列：一旦遇到障碍物，该行/列后续位置都不可达（路径数为 0）。

**空间优化**：可以用一维数组滚动更新。
- `dp[j]` 表示当前行到第 j 列的不同路径数。
- 如果 `obstacleGrid[i][j] == 1`：`dp[j] = 0`
- 否则：`dp[j] = dp[j] + dp[j-1]`（j > 0 时）

### 复杂度分析

- **时间复杂度**：O(m * n)
- **空间复杂度**：O(n)（一维数组优化）

### 关键点

- 障碍物的处理是本题核心：路径数归零，阻断所有经过该点的路径。
- 注意起点或终点可能是障碍物的情况。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/144-unique-paths-ii-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="不同路径 II (Unique Paths II) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func uniquePathsWithObstacles(obstacleGrid [][]int) int {
    m, n := len(obstacleGrid), len(obstacleGrid[0])

    // 如果起点或终点是障碍物，直接返回 0
    if obstacleGrid[0][0] == 1 || obstacleGrid[m-1][n-1] == 1 {
        return 0
    }

    // 一维 DP 数组
    dp := make([]int, n)
    dp[0] = 1 // 起点

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if obstacleGrid[i][j] == 1 {
                dp[j] = 0 // 障碍物，路径数为 0
            } else if j > 0 {
                dp[j] += dp[j-1] // 上方(dp[j]) + 左方(dp[j-1])
            }
            // j == 0 时，dp[j] 保持不变（第一列只能从上方来）
        }
    }

    return dp[n-1]
}
```
