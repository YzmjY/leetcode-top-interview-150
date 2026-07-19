# 150. 最大正方形 (Maximal Square)

## 题目描述

在一个由 `'0'` 和 `'1'` 组成的二维矩阵内，找到只包含 `'1'` 的最大正方形，并返回其面积。

**示例 1：**

```
输入：matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]
输出：4
```

**示例 2：**

```
输入：matrix = [["0","1"],["1","0"]]
输出：1
```

**示例 3：**

```
输入：matrix = [["0"]]
输出：0
```

**约束条件：**

- `m == matrix.length`
- `n == matrix[i].length`
- `1 <= m, n <= 300`
- `matrix[i][j]` 为 `'0'` 或 `'1'`

## 题目分析

### 算法思路

**方法：二维 DP**

- **状态定义**：`dp[i][j]` = 以 `(i, j)` 为右下角的最大正方形的边长。
- **状态转移**：
  - 如果 `matrix[i][j] == '1'`：
    - `dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1`
  - 如果 `matrix[i][j] == '0'`：
    - `dp[i][j] = 0`

**直觉解释**：以 `(i, j)` 为右下角的正方形，其大小受到左方、上方和左上方三个位置中最小值的限制（因为正方形要求三个方向都足够大）。

- **边界条件**：第一行和第一列：如果 `matrix[i][j] == '1'`，则 `dp[i][j] = 1`，否则为 0。
- **答案**：遍历过程中记录 `maxSide`，最终返回 `maxSide * maxSide`。

**空间优化**：可以用一维数组滚动更新（需额外保存左上角的旧值）。

### 复杂度分析

- **时间复杂度**：O(m * n)，遍历整个矩阵。
- **空间复杂度**：O(n)，一维数组优化。或 O(m * n)，使用完整 DP 表。

### 关键点

- "以某点为右下角" 是正方形类问题的经典套路。
- 递推公式体现了正方形必须满足左、上、左上三个方向的最小约束。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/150-maximal-square-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="最大正方形 (Maximal Square) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func maximalSquare(matrix [][]byte) int {
    m, n := len(matrix), len(matrix[0])
    maxSide := 0

    // dp[j] 表示当前行以位置 j 为右下角的最大正方形边长
    dp := make([]int, n+1)
    // prev 保存 dp[i-1][j-1]（左上角）
    prev := 0

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            temp := dp[j+1] // 保存旧的 dp[j+1]（上一行的值，即 dp[i-1][j]）

            if matrix[i][j] == '1' {
                // dp[j+1] = min(左, 上, 左上) + 1
                // dp[j] = 左, dp[j+1]旧值 = 上, prev = 左上
                dp[j+1] = min(dp[j], min(dp[j+1], prev)) + 1
                if dp[j+1] > maxSide {
                    maxSide = dp[j+1]
                }
            } else {
                dp[j+1] = 0
            }

            prev = temp // 更新 prev 为下一列的左上角值
        }
    }

    return maxSide * maxSide
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```
