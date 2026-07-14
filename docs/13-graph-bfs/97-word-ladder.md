# 97. 单词接龙

## 题目描述

字典 `wordList` 中从单词 `beginWord` 到 `endWord` 的**转换序列**是一个按下述规格形成的序列 `beginWord -> s1 -> s2 -> ... -> sk`：

- 每一对相邻的单词只差一个字母。
- 对于 `1 <= i <= k` 时，每个 `si` 都在 `wordList` 中。注意，`beginWord` 不需要在 `wordList` 中。
- `sk == endWord`

给你两个单词 `beginWord` 和 `endWord` 和一个字典 `wordList`，返回从 `beginWord` 到 `endWord` 的**最短转换序列**中的**单词数目**。如果不存在这样的转换序列，返回 `0`。

**示例 1：**

```
输入：beginWord = "hit", endWord = "cog",
     wordList = ["hot","dot","dog","lot","log","cog"]
输出：5
解释：一个最短转换序列是 "hit" -> "hot" -> "dot" -> "dog" -> "cog", 返回它的长度 5。
```

**示例 2：**

```
输入：beginWord = "hit", endWord = "cog",
     wordList = ["hot","dot","dog","lot","log"]
输出：0
解释：endWord "cog" 不在字典中，所以无法进行转换。
```

**约束条件：**

- `1 <= beginWord.length <= 10`
- `endWord.length == beginWord.length`
- `1 <= wordList.length <= 5000`
- `wordList[i].length == beginWord.length`
- `beginWord`、`endWord` 和 `wordList[i]` 由小写英文字母组成
- `beginWord != endWord`
- `wordList` 中的所有字符串互不相同

## 题目分析

本题是经典的状态转换 BFS 问题，与"最小基因变化"类似但规模更大（wordList 最多 5000，单词长度最大 10）。

**基础 BFS（朴素建图）：**

对当前单词，尝试每个位置变为 'a'~'z'（共 26 * L 种可能），检查是否在 wordSet 中。

复杂度：O(N * L * 26)

**双向 BFS 优化：**

同时从 beginWord 和 endWord 出发进行 BFS，每次选择较小的集合扩展，当两个搜索相遇时返回总步数。可将实际搜索空间从 O(b^d) 降低至 O(b^(d/2))。

**虚拟节点 / 通配符优化：**

构建 `h*t` 这类通配符作为中间节点，将建图复杂度从 O(N^2 * L) 降至 O(N * L)。

- 对每个单词，生成所有可能的通配符模式（如 hit -> `*it`, `h*t`, `hi*`）
- 将单词和通配符模式都视为图节点
- 单词通过一条边连接到通配符模式，距离为 0.5（实际上可以每步只计数一次）

**时间复杂度（双向 BFS）：** 实际搜索空间约为 O(b^(d/2))，每次扩展 O(26 * L)。

**空间复杂度：** O(N * L)，wordSet 和 visited 集合。

## Go 代码实现

```go
package main

import "fmt"

// ladderLength 双向 BFS 实现单词接龙
func ladderLength(beginWord string, endWord string, wordList []string) int {
    wordSet := make(map[string]bool)
    for _, w := range wordList {
        wordSet[w] = true
    }
    if !wordSet[endWord] {
        return 0
    }

    beginSet := map[string]bool{beginWord: true}
    endSet := map[string]bool{endWord: true}
    visited := map[string]bool{beginWord: true, endWord: true}
    steps := 1 // 初始单词也算一步

    for len(beginSet) > 0 && len(endSet) > 0 {
        // 始终从较小的集合扩展
        if len(beginSet) > len(endSet) {
            beginSet, endSet = endSet, beginSet
        }

        nextSet := make(map[string]bool)
        for word := range beginSet {
            wordBytes := []byte(word)
            for i := 0; i < len(wordBytes); i++ {
                original := wordBytes[i]
                for c := byte('a'); c <= 'z'; c++ {
                    if c == original {
                        continue
                    }
                    wordBytes[i] = c
                    nextWord := string(wordBytes)
                    if endSet[nextWord] {
                        return steps + 1
                    }
                    if wordSet[nextWord] && !visited[nextWord] {
                        visited[nextWord] = true
                        nextSet[nextWord] = true
                    }
                }
                wordBytes[i] = original
            }
        }
        beginSet = nextSet
        steps++
    }
    return 0
}

func main() {
    wordList := []string{"hot", "dot", "dog", "lot", "log", "cog"}
    fmt.Println(ladderLength("hit", "cog", wordList)) // 输出: 5

    wordList2 := []string{"hot", "dot", "dog", "lot", "log"}
    fmt.Println(ladderLength("hit", "cog", wordList2)) // 输出: 0
}
```
