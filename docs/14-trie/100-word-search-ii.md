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

本题是"单词搜索 I"的进阶版，需要同时搜索多个单词。如果对每个单词独立地进行回溯搜索，会做大量重复工作。使用 Trie 可以大幅剪枝优化。

**算法思路（Trie + 回溯）：**

1. 将所有 `words` 插入 Trie 中
2. 遍历 board 的每个格子作为起点，进行 DFS 回溯
3. 回溯过程中，始终维护当前在 Trie 中的节点位置
4. 当遇到 `isEnd` 标记时，收集当前单词，并将 `isEnd` 置为 false 以避免重复收集
5. 回溯时在 board 上原地标记已访问（如改为 `'#'`）

**剪枝策略：**

- Trie 剪枝：如果当前字符在 Trie 中不存在对应子节点，直接返回
- 删除已匹配单词：匹配到单词后将 `isEnd` 设为 false
- 节点删除优化：如果某个 Trie 节点的所有子节点都为空且自身不是单词结尾，则可以删除该节点

**时间复杂度：** O(M * N * 4^L)，其中 M*N 为 board 大小，L 为单词最大长度。实际由于 Trie 剪枝，搜索空间远小于此。

**空间复杂度：** O(W * L)，Trie 的存储空间，W 为单词数，L 为平均单词长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/100-word-search-ii-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
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
    fmt.Println(findWords(board, words)) // ["eat", "oath"] 或 ["oath", "eat"]
}
```
