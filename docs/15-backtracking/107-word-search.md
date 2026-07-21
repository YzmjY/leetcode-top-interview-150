# 107. 单词搜索

## 题目描述

给定一个 `m x n` 二维字符网格 `board` 和一个字符串单词 `word`。如果 `word` 存在于网格中，返回 `true`；否则，返回 `false`。

单词必须按照字母顺序，通过相邻的单元格内的字母构成，其中"相邻"单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母不允许被重复使用。

**示例 1：**

```
输入：board = [
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], word = "ABCCED"
输出：true
```

**示例 2：**

```
输入：board = [
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], word = "SEE"
输出：true
```

**示例 3：**

```
输入：board = [
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], word = "ABCB"
输出：false
```

**约束条件：**

- `m == board.length`
- `n = board[i].length`
- `1 <= m, n <= 6`
- `1 <= word.length <= 15`
- `board` 和 `word` 仅由大小写英文字母组成

## 题目分析

本题是网格回溯的经典问题。从每个格子出发进行 DFS，尝试匹配 word 的每个字符。

**算法思路：**

1. 遍历 board 每个格子，若首字符匹配，则以该格子为起点进行 DFS
2. DFS 中：
   - 检查当前字符是否匹配 word 的当前位置
   - 若已匹配到 word 末尾，返回 true
   - 标记当前格子为已访问（原地修改，如设为 `'#'`）
   - 向四个方向递归
   - 恢复格子原始字符

**剪枝策略：**

- 字符不匹配直接返回 false
- 边界检查
- 单词搜索 II 中可使用 Trie 批量剪枝

**时间复杂度：** O(M * N * 3^L)，每个格子最多走 3 个方向（不回头），L 为单词长度。

**空间复杂度：** O(L)，递归栈深度等于单词长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/107-word-search-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="单词搜索 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// exist 判断 word 是否在 board 中存在
func exist(board [][]byte, word string) bool {
    m, n := len(board), len(board[0])

    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

    var dfs func(i, j, index int) bool
    dfs = func(i, j, index int) bool {
        // 匹配完成
        if index == len(word) {
            return true
        }
        // 越界或字符不匹配
        if i < 0 || i >= m || j < 0 || j >= n || board[i][j] != word[index] {
            return false
        }

        // 原地标记已访问
        tmp := board[i][j]
        board[i][j] = '#'

        for _, d := range dirs {
            if dfs(i+d[0], j+d[1], index+1) {
                board[i][j] = tmp // 恢复
                return true
            }
        }

        board[i][j] = tmp // 恢复
        return false
    }

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if board[i][j] == word[0] && dfs(i, j, 0) {
                return true
            }
        }
    }
    return false
}

func main() {
    board := [][]byte{
        {'A', 'B', 'C', 'E'},
        {'S', 'F', 'C', 'S'},
        {'A', 'D', 'E', 'E'},
    }
    fmt.Println(exist(board, "ABCCED")) // true
    fmt.Println(exist(board, "SEE"))    // true
    fmt.Println(exist(board, "ABCB"))   // false
}
```
