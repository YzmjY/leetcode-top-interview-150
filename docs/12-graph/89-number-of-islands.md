# 89. 岛屿数量

## 题目描述

给你一个由 `'1'`（陆地）和 `'0'`（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。

**示例 1：**

```
输入：grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
输出：1
```

**示例 2：**

```
输入：grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
输出：3
```

**约束条件：**

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 300`
- `grid[i][j]` 的值为 `'0'` 或 `'1'`

## 题目分析

本题是网格图中连通分量计数的经典问题。每一个岛屿对应一个由 `'1'` 组成的连通分量。可以采用 DFS 或 BFS 遍历每个岛屿，标记已访问过的陆地。

**算法思路（DFS）：**

1. 遍历网格中的每个格子
2. 当遇到陆地 `'1'` 时，岛屿计数 +1
3. 以该格子为起点进行 DFS，将所有相邻的陆地标记为 `'0'`（原地标记，避免额外 visited 数组）
4. 继续遍历，直到所有格子处理完毕

**时间复杂度：** O(m * n)，每个格子最多被访问一次。

**空间复杂度：** O(m * n)，最坏情况下递归栈的深度为整个网格大小（全为陆地时）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/89-number-of-islands-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="岛屿数量 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// numIslands 计算岛屿数量（DFS 实现）
func numIslands(grid [][]byte) int {
    if len(grid) == 0 {
        return 0
    }
    m, n := len(grid), len(grid[0])
    count := 0

    var dfs func(i, j int)
    dfs = func(i, j int) {
        // 边界检查 + 水检查
        if i < 0 || i >= m || j < 0 || j >= n || grid[i][j] == '0' {
            return
        }
        // 将当前陆地标记为水（相当于 visited）
        grid[i][j] = '0'
        // 向四个方向探索
        dfs(i+1, j)
        dfs(i-1, j)
        dfs(i, j+1)
        dfs(i, j-1)
    }

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == '1' {
                count++
                dfs(i, j)
            }
        }
    }
    return count
}

// numIslandsBFS 计算岛屿数量（BFS 实现）
func numIslandsBFS(grid [][]byte) int {
    if len(grid) == 0 {
        return 0
    }
    m, n := len(grid), len(grid[0])
    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
    count := 0

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == '1' {
                count++
                grid[i][j] = '0'
                queue := [][2]int{{i, j}}
                for len(queue) > 0 {
                    cur := queue[0]
                    queue = queue[1:]
                    for _, d := range dirs {
                        ni, nj := cur[0]+d[0], cur[1]+d[1]
                        if ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] == '1' {
                            grid[ni][nj] = '0'
                            queue = append(queue, [2]int{ni, nj})
                        }
                    }
                }
            }
        }
    }
    return count
}

func main() {
    grid := [][]byte{
        {'1', '1', '0', '0', '0'},
        {'1', '1', '0', '0', '0'},
        {'0', '0', '1', '0', '0'},
        {'0', '0', '0', '1', '1'},
    }
    fmt.Println(numIslands(grid)) // 输出: 3
}
```
