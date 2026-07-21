# 105. N 皇后 II

## 题目描述

**n 皇后问题**研究的是如何将 `n` 个皇后放置在 `n x n` 的棋盘上，并且使皇后彼此之间不能相互攻击。

给你一个整数 `n`，返回 **n 皇后问题** 不同的解决方案的数量。

皇后可以攻击同一行、同一列、同一正对角线（左上到右下）、同一反对角线（右上到左下）上的棋子。

**示例 1：**

```
输入：n = 4
输出：2
解释：如上图所示，4 皇后问题存在两个不同的解法。
```

**示例 2：**

```
输入：n = 1
输出：1
```

**约束条件：**

- `1 <= n <= 9`

## 题目分析

N 皇后是经典的回溯+约束满足问题。核心在于高效判断当前放置位置是否与已有皇后冲突。

**约束条件（不可攻击）：**

- 不同行：回溯按行放置，天然保证
- 不同列：使用 `cols` 布尔数组记录
- 不同正对角线（左上到右下）：`row - col` 为常量，使用 `diag1` 记录
- 不同反对角线（右上到左下）：`row + col` 为常量，使用 `diag2` 记录

**对角线索引计算：**

- 正对角线索引：`row - col + n - 1`（偏移使其非负，范围 0 ~ 2n-2）
- 反对角线索引：`row + col`（范围 0 ~ 2n-2）

**时间复杂度：** O(n!)，实际远小于此因为剪枝。

**空间复杂度：** O(n)，列和对角线标记数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/105-n-queens-ii-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="N 皇后 II - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// totalNQueens 返回 N 皇后的解法总数
func totalNQueens(n int) int {
    cols := make([]bool, n)        // 列标记
    diag1 := make([]bool, 2*n-1)   // 正对角线 (row - col + n - 1)
    diag2 := make([]bool, 2*n-1)   // 反对角线 (row + col)
    count := 0

    var backtrack func(row int)
    backtrack = func(row int) {
        if row == n {
            count++
            return
        }

        for col := 0; col < n; col++ {
            d1 := row - col + n - 1 // 正对角线索引
            d2 := row + col         // 反对角线索引

            if cols[col] || diag1[d1] || diag2[d2] {
                continue // 冲突，跳过
            }

            // 做选择
            cols[col] = true
            diag1[d1] = true
            diag2[d2] = true

            backtrack(row + 1)

            // 撤销选择
            cols[col] = false
            diag1[d1] = false
            diag2[d2] = false
        }
    }

    backtrack(0)
    return count
}

func main() {
    fmt.Println(totalNQueens(4)) // 2
    fmt.Println(totalNQueens(1)) // 1
    fmt.Println(totalNQueens(8)) // 92
}
```
