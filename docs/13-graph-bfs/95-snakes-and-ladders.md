# 95. 蛇梯棋

## 题目描述

给你一个大小为 `n x n` 的整数矩阵 `board`，方格按从 `1` 到 `n^2` 编号，编号从方格 1 开始（在左上角），然后交替改变方向：从底部开始向顶部，交替改变每一行的方向。

例如，一个 `6 x 6` 的棋盘，编号如下：

```
36 35 34 33 32 31
25 26 27 28 29 30
24 23 22 21 20 19
13 14 15 16 17 18
12 11 10  9  8  7
 1  2  3  4  5  6
```

玩家从方格 `1` 开始（总是在最后一行、第一列）。每一回合，玩家需要从当前方格开始，按照如下方式移动：

- 如果玩家位于方格 `curr`，投掷一个六面骰子，点数决定下一步的移动步数，即移动到 `curr + k`，其中 `k` 是骰子的点数（1-6）。
- 如果移动到的方格 `curr + k` 处存在蛇或梯子，则玩家必须移动到该蛇或梯子的目的地。如果同时有蛇或梯子，只能选择其中一个。
- 当玩家到达方格 `n^2` 时游戏结束。

`board[r][c] == -1` 表示该方格既没有蛇也没有梯子。否则，`board[r][c]` 表示蛇或梯子的目的地。

返回达到方格 `n^2` 所需的最少移动次数。如果不可能，则返回 `-1`。

**示例 1：**

```
输入：board = [
  [-1,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,-1],
  [-1,-1,-1,-1,-1,-1],
  [-1,35,-1,-1,13,-1],
  [-1,-1,-1,-1,-1,-1],
  [-1,15,-1,-1,-1,-1]
]
输出：4
```

**约束条件：**

- `n == board.length == board[i].length`
- `2 <= n <= 20`
- `board[i][j]` 的值是 `-1` 或在范围 `[1, n^2]` 内
- 编号为 `1` 和 `n^2` 的方格上没有蛇或梯子

## 题目分析

本题的关键在于正确地将棋盘上的编号映射到二维坐标，然后在编号序列上进行 BFS 求最短路径。

**坐标映射：**

给定编号 `id`，需要计算其在棋盘上的行和列：

- 行索引：`r = n - 1 - (id - 1) / n`
- 列索引：`c = (id - 1) % n`，但如果该行是反向的（从右向左），则需要调整为 `c = n - 1 - ((id - 1) % n)`

**BFS 流程：**

1. 从编号 1 开始 BFS
2. 每步尝试 1~6 的骰子点数，计算下一个编号
3. 如果下一个格子有蛇/梯子，则传送到目标编号
4. 使用 visited 数组避免重复访问
5. 到达 n^2 时返回步数

**时间复杂度：** O(n^2)，每个格子最多被访问一次。

**空间复杂度：** O(n^2)，visited 数组和队列。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/95-snakes-and-ladders-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="蛇梯棋 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// snakesAndLadders 蛇梯棋 BFS 最短路径
func snakesAndLadders(board [][]int) int {
    n := len(board)
    target := n * n

    // 将编号 id 转换为棋盘坐标 (r, c)
    getPos := func(id int) (int, int) {
        r := n - 1 - (id-1)/n
        c := (id - 1) % n
        // 如果该行是从右往左编号的，则需要翻转列
        if ((id-1)/n)%2 == 1 {
            c = n - 1 - c
        }
        return r, c
    }

    visited := make([]bool, target+1)
    queue := []int{1}
    visited[1] = true
    steps := 0

    for len(queue) > 0 {
        size := len(queue)
        for i := 0; i < size; i++ {
            cur := queue[0]
            queue = queue[1:]

            if cur == target {
                return steps
            }

            // 尝试 1~6 步
            for k := 1; k <= 6; k++ {
                next := cur + k
                if next > target {
                    break
                }
                r, c := getPos(next)
                // 如果有蛇或梯子，传送到目标
                if board[r][c] != -1 {
                    next = board[r][c]
                }
                if !visited[next] {
                    visited[next] = true
                    queue = append(queue, next)
                }
            }
        }
        steps++
    }

    return -1
}

func main() {
    board := [][]int{
        {-1, -1, -1, -1, -1, -1},
        {-1, -1, -1, -1, -1, -1},
        {-1, -1, -1, -1, -1, -1},
        {-1, 35, -1, -1, 13, -1},
        {-1, -1, -1, -1, -1, -1},
        {-1, 15, -1, -1, -1, -1},
    }
    fmt.Println(snakesAndLadders(board)) // 输出: 4
}
```
