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

### 算法思路

**核心思路**：单词的每个字母对应网格上的一个格子，且相邻两字母所在格子必须上下左右相邻、同一格子不能重复使用。于是问题变成「能否在网格中找出一条简单路径，依次拼出 `word`」——从每个可能的首字母位置出发做 DFS，失败就回溯换方向。

**算法步骤：**

1. 预处理下标越界：`dfs(i, j, index)` 表示「正在把 `word[index]` 放到格子 `(i, j)` 上」，返回能否匹配完剩余部分。
2. DFS 内部：
   - `index == len(word)` → 整个单词已经匹配完，返回 true；
   - `i`、`j` 越界，或 `board[i][j] != word[index]` → 返回 false；
   - 用 `tmp` 保存 `board[i][j]`，把它临时改成 `'#'` 表示本路径已访问；
   - 对四个方向递归 `dfs(ni, nj, index+1)`，任一方向成功就恢复棋盘并返回 true；
   - 四个方向都失败则恢复棋盘并返回 false。
3. 外层遍历每个格子，若 `board[i][j] == word[0]` 就调用 `dfs(i, j, 0)`，成功即返回 true；全部起点都失败则返回 false。

**剪枝策略：**

- 首字母不匹配的起点直接跳过（外层循环里的 `board[i][j] == word[0]` 判断）；
- DFS 入口一次判掉「越界」和「字符不匹配」两种情况，越界与不匹配都无需继续；
- 已访问的格子被改成 `'#'`，`'#'` 不等于任何字母，天然挡住了「走回头路」，因此每步最多只有 3 个有效后继（不会回到来路）。

### 为什么正确

- **状态完备**：`dfs(i, j, index)` 的语义是「当前站在 `(i,j)`，已经匹配了 `word[0..index-1]`，`(i,j)` 是接下来要放 `word[index]` 的位置」。入口的越界/字符检查恰好是这个语义成立的必要条件。
- **不重不漏地枚举路径**：每个起点加每个方向组合都对应一条具体的网格路径；递归枚举了「当前格子 → 四邻之一」的所有扩展，因此所有以该起点开头的简单路径都被覆盖。合法路径一定会在 `index == len(word)` 时被识别。
- **访问标记保证简单路径**：标记 `'#'` 后，任何回到已走过的格子的尝试都会因字符不匹配（`'#' != word[index]`）而失败，从而保证每条路径不重复用格。
- **恢复标记保证分支独立**：「失败后恢复」使兄弟分支看到的是未被污染的棋盘，否则一条错误分支会把格子永久标记，造成漏解。
- **终止性**：`index` 每层加 1，最多增加到 `len(word)`，递归深度有界。

### 复杂度分析

- **时间复杂度：** O(M × N × 3^L)。外层有 M × N 个起点；每个起点一旦确定第一步，后续每步最多 3 个方向（不能原路返回），故上界为 `3^L`，L 为单词长度（≤ 15）。剪枝（首字母、越界、字符不匹配）会大幅减少实际访问量。
- **空间复杂度：** O(L)，递归栈深度等于单词长度；棋盘是原地修改的，没有额外数据结构。

### 易错点 / 边界情况

- **`index == len(word)` 的判断必须放在最前面**：若先做字符检查，`index == len(word)` 时会去访问 `word[len(word)]`，直接下标越界 panic。
- **恢复必须在所有返回路径上执行**：包括「某个方向成功提前 return true」这条路径——本仓库代码在 `return true` 前先写回 `tmp`，这一点容易漏。
- **该题会原地修改 `board`**：虽然返回前会恢复，但如果业务上需要保留棋盘，应改用单独的 `visited` 数组。
- **`'#'` 只作临时标记**：题目保证 `board` 中只有大小写字母，不会与真实字符冲突。
- **相邻只算上下左右**，斜对角不算相邻；`dirs` 里四个方向要写全。
- **单词长度可能超过格子总数**（如 1×1 棋盘匹配长度 2 的词），此时必然无解，靠递归深度限制自然返回 false。
- **起点可能很多**：同一个字母出现多次（例如 6×6 全 `'a'`）时，需要保证每个起点都从「干净」的棋盘开始，所以恢复标记是正确性的关键。
- **`word` 长度为 1**：外层循环遇到相同字符即返回 true；`index == len(word)` 的分支会在第一次递归时命中。


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
