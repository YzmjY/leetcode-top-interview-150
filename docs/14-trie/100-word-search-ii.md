# 100. 单词搜索 II

## 题目描述

给定一个 `m x n` 二维字符网格 `board` 和一个单词（字符串）列表 `words`，返回所有二维网格上的单词。

单词必须按照字母顺序，通过**相邻的单元格**内的字母构成，其中"相邻"单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母在一个单词中不允许被重复使用。

**示例 1：**

```
输入：board = [
  ["o","a","a","n"],
  ["e","t","a","e"],
  ["i","h","k","r"],
  ["i","f","l","v"]
], words = ["oath","pea","eat","rain"]
输出：["eat","oath"]
（顺序不限，返回任意顺序均可）
```

**示例 2：**

```
输入：board = [["a","b"],["c","d"]], words = ["abcb"]
输出：[]
```

**约束条件：**

- `m == board.length`
- `n == board[i].length`
- `1 <= m, n <= 12`
- `board[i][j]` 是一个小写英文字母
- `1 <= words.length <= 3 * 10^4`
- `1 <= words[i].length <= 10`
- `words[i]` 由小写英文字母组成
- `words` 中的所有字符串互不相同

## 题目分析

### 算法思路

**核心思路**：如果对 `words` 中的每个单词单独做一次「单词搜索」，相同的网格前缀会被反复遍历（例如 `oath` 和 `oat` 共享前三步）。把 `words` 整体建成一棵 Trie 后，网格上的 DFS 每走一步只需在 Trie 中下移一层，一次搜索就能同时匹配所有单词；某条分支在 Trie 中走不下去时立刻剪枝。

**算法步骤：**

1. 把 `words` 全部插入 Trie。节点中用 `word string` 保存完整单词（只在单词末尾节点非空），这样 DFS 命中时无需拼接字符串。
2. 枚举 `board` 中的每个格子作为起点，以 Trie 根节点为初始位置做 DFS。
3. DFS `(i, j, node)` 的过程：
   - 当前格为 `'#'`（本路径上已经访问过）直接返回；
   - `next := node.children[board[i][j]-'a']`，为 nil 说明没有任何待搜索单词以当前路径为前缀，剪枝返回；
   - 若 `next.word != ""`，说明找到了一个单词：收集它，并把 `next.word` 置空以免同一条路径被重复收集；
   - 把 `board[i][j]` 临时改成 `'#'`，向上下左右四个方向递归，之后恢复原字符（回溯）。
4. 所有起点搜索完毕后返回 `result`。

**剪枝策略：**

- **Trie 剪枝**：当前字符在 Trie 中没有对应子节点时直接返回，等价于一次性排除所有不以此为前缀的单词。
- **删除已匹配单词**：命中后把 `next.word` 置空，避免从不同路径重复收集同一个单词。
- **（可选）节点删除优化**：若某个 Trie 节点的所有子节点都为空且自身不是单词结尾，可以在回溯时从父节点摘除，进一步缩小 Trie。本项目代码未实现该优化，因为它对本约束下的性能影响很小。

### 为什么正确

- **Trie 的路径与网格路径一一对应**：从根出发沿字符走，Trie 中的某条路径就是按顺序排列的一段字符；`board` 上的 DFS 每一步同时把 Trie 位置下移一层，所以「网格上存在一条不重复走格子的路径拼出单词 w」等价于「按该路径走能到达 Trie 中 `word == w` 的节点」。
- **不会漏解**：外层枚举所有起点、内层枚举四个方向，且只在路径字符能在 Trie 中前进时才继续，因此任何合法单词对应的路径都会被某次 DFS 走到。
- **不会重复**：同一个单词可能对应多条网格路径（例如网格里有多个 `a`），但第一次命中后 `word` 被清空，之后即使再走到该节点也不会再次收集。
- **访问标记可恢复**：把已走过的格子临时置为 `'#'` 保证同一个格子不在一条单词路径中重复使用；`'#'` 不是小写字母，只可能出现在当前递归栈上，所以入口处的 `ch == '#'` 检查足以拦截「走回头路」。

### 复杂度分析

- **时间复杂度：** O(W × L) 建 Trie，其中 W 为单词数（≤ 3×10⁴）、L 为单词长度（≤ 10）；搜索部分的上界是 O(M × N × 3^L)，即每个格子作为起点，每步最多 3 个方向（不能原路返回），递归深度不超过最长单词长度 L。由于 Trie 剪枝会在字符不匹配时立刻返回，实际访问量远小于这个上界。
- **空间复杂度：** O(W × L × 26) 存储 Trie（每个节点固定 26 个指针，共享前缀后节点数远小于 W × L）；递归栈深度为 O(L)。

### 易错点 / 边界情况

- **必须原地标记并在返回前恢复**：`board[i][j] = '#'` 一定要在四个方向递归完之后写回原字符，否则后续以别的格子为起点的搜索会看到残留在棋盘上的 `'#'`。
- **入口要先判断 `'#'`**：因为 `'#' - 'a'` 会得到负下标直接 panic；判断顺序是「先看是否访问过，再查 Trie 子节点」。
- **命中单词后不能立即 return**：更长的单词可能以当前单词为前缀（如 `oath` 之于 `oat`），收集后要继续往下搜。
- **用 `word` 字段而非拼字符串**：DFS 过程中拼接前缀会让复杂度乘上字符串长度；改用「在节点上存完整单词 + 命中后清空」是本题的常见写法。
- **返回顺序不作要求**：题目允许任意顺序返回（本仓库代码对示例 1 的实际输出是 `["oath","eat"]`，与官方示例的 `["eat","oath"]` 只是顺序不同）。
- **`words` 中单词可能互为前缀**（例如同时存在 `a` 和 `ab`），上面的「命中后继续搜索」正是为这种情况准备的。
- **单格棋盘**：`m = n = 1` 时也要能正确匹配长度为 1 的单词。
- **同一单词多条路径**：靠清空 `word` 去重，而不是靠 `result` 里做去重判断。
- **`board` 中字符只含小写字母**，因此 `ch - 'a'` 合法；`'#'` 只作为临时标记，递归结束即恢复。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/100-word-search-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="单词搜索 II - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// TrieNode 前缀树节点
type TrieNode struct {
    children [26]*TrieNode
    word     string // 存储完整单词（仅叶节点非空），避免在 DFS 中拼接字符串
}

// insert 向 Trie 中插入单词
func (root *TrieNode) insert(word string) {
    node := root
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            node.children[idx] = &TrieNode{}
        }
        node = node.children[idx]
    }
    node.word = word
}

// findWords 查找 board 中存在的所有单词
func findWords(board [][]byte, words []string) []string {
    // 构建 Trie
    root := &TrieNode{}
    for _, w := range words {
        root.insert(w)
    }

    m, n := len(board), len(board[0])
    result := []string{}

    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

    var dfs func(i, j int, node *TrieNode)
    dfs = func(i, j int, node *TrieNode) {
        ch := board[i][j]
        if ch == '#' {
            return
        }
        idx := ch - 'a'
        next := node.children[idx]
        if next == nil {
            return // Trie 剪枝
        }

        // 找到单词
        if next.word != "" {
            result = append(result, next.word)
            next.word = "" // 避免重复收集
        }

        // 回溯
        board[i][j] = '#'
        for _, d := range dirs {
            ni, nj := i+d[0], j+d[1]
            if ni >= 0 && ni < m && nj >= 0 && nj < n {
                dfs(ni, nj, next)
            }
        }
        board[i][j] = ch
    }

    // 从每个格子出发搜索
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            dfs(i, j, root)
        }
    }

    return result
}

func main() {
    board := [][]byte{
        {'o', 'a', 'a', 'n'},
        {'e', 't', 'a', 'e'},
        {'i', 'h', 'k', 'r'},
        {'i', 'f', 'l', 'v'},
    }
    words := []string{"oath", "pea", "eat", "rain"}
    fmt.Println(findWords(board, words)) // ["oath" "eat"]（任意顺序均可）
}
```
