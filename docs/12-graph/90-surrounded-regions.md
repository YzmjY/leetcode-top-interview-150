# 90. 被围绕的区域

## 题目描述

给你一个 `m x n` 的矩阵 `board`，由若干字符 `'X'` 和 `'O'` 组成，**捕获**所有被围绕的区域：

- **连接：** 一个单元格与水平或垂直方向上相邻的单元格连接。
- **区域：** 连接所有 `'O'` 的单元格连接形成一个区域。
- **围绕：** 如果你可以用 `'X'` 单元格连接这个区域，并且区域中没有任何单元格与边缘 `'O'` 相连，则该区域被围绕。

通过将被围绕的区域中的所有 `'O'` 转换为 `'X'` 来捕获。

**示例 1：**

```
输入：board = [
  ["X","X","X","X"],
  ["X","O","O","X"],
  ["X","X","O","X"],
  ["X","O","X","X"]
]
输出：[
  ["X","X","X","X"],
  ["X","X","X","X"],
  ["X","X","X","X"],
  ["X","O","X","X"]
]
```

**示例 2：**

```
输入：board = [["X"]]
输出：[["X"]]
```

**约束条件：**

- `m == board.length`
- `n == board[i].length`
- `1 <= m, n <= 200`
- `board[i][j]` 为 `'X'` 或 `'O'`

## 题目分析

本题的关键在于逆向思维：与其直接寻找被围绕的 `'O'` 区域，不如先找到**不会被围绕**的 `'O'` 区域——即与边界相连的 `'O'` 区域。

**算法思路：**

1. 遍历四条边界，以边界上的 `'O'` 为起点进行 DFS/BFS
2. 将与边界相连的 `'O'` 临时标记为特殊字符（如 `'#'`）
3. 遍历整个矩阵：
   - 将剩余的 `'O'`（被围绕的）改为 `'X'`
   - 将 `'#'` 恢复为 `'O'`

**时间复杂度：** O(m * n)，每个格子最多被访问常数次。

**空间复杂度：** O(m * n)，最坏情况下递归栈深度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/90-surrounded-regions-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="被围绕的区域 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// solve 捕获被围绕的区域（DFS 实现）
func solve(board [][]byte) {
    if len(board) == 0 || len(board[0]) == 0 {
        return
    }
    m, n := len(board), len(board[0])

    var dfs func(i, j int)
    dfs = func(i, j int) {
        if i < 0 || i >= m || j < 0 || j >= n || board[i][j] != 'O' {
            return
        }
        board[i][j] = '#' // 临时标记为不可捕获
        dfs(i+1, j)
        dfs(i-1, j)
        dfs(i, j+1)
        dfs(i, j-1)
    }

    // 从边界 'O' 出发，标记所有与边界相连的 'O'
    for i := 0; i < m; i++ {
        if board[i][0] == 'O' {
            dfs(i, 0)
        }
        if board[i][n-1] == 'O' {
            dfs(i, n-1)
        }
    }
    for j := 0; j < n; j++ {
        if board[0][j] == 'O' {
            dfs(0, j)
        }
        if board[m-1][j] == 'O' {
            dfs(m-1, j)
        }
    }

    // 处理标记
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if board[i][j] == '#' {
                board[i][j] = 'O'
            } else if board[i][j] == 'O' {
                board[i][j] = 'X'
            }
        }
    }
}

func main() {
    board := [][]byte{
        {'X', 'X', 'X', 'X'},
        {'X', 'O', 'O', 'X'},
        {'X', 'X', 'O', 'X'},
        {'X', 'O', 'X', 'X'},
    }
    solve(board)
    for _, row := range board {
        fmt.Println(string(row))
    }
}
```
