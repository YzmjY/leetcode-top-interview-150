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

### 算法思路

**核心思路**：把 `wordList` 中的单词看成图的节点，两个单词只差一个字母就在它们之间连一条边。转换序列就是一条路径，题目要的是 `beginWord` 到 `endWord` 的最短路径上的**单词数目**，用 BFS 求最短路，注意计数口径是「节点数」而不是「边数」。

**基础 BFS（朴素建图）：**

对当前单词，逐个位置枚举 `'a'`~`'z'`（共 26 × L 种候选），若候选词在 `wordSet` 中且未访问过就入队；出队时判断是否等于 `endWord`。这等价于隐式地在图上做 BFS，无需显式建图，复杂度 O(N × L × 26)。

**双向 BFS 优化：**

同时从 `beginWord` 和 `endWord` 两侧扩展，每轮扩展**规模较小**的一侧。当从一侧前沿生成的新词出现在另一侧前沿时，两侧「接上」，返回总单词数。由于两棵树深度各减半，实际搜索空间从 O(b^d) 降到 O(b^(d/2))。

**代码中的计数方式**：`steps` 初值为 1（`beginWord` 本身算一个单词），每扩展一层加一。设起点一侧已扩展 `a` 层、终点一侧已扩展 `b` 层，则 `steps = a + b + 1`，并且此时一个待扩展集合位于「距 `beginWord` 为 `a` 步」处，另一个位于「距 `endWord` 为 `b` 步」处。当从「距 `endWord` 为 `b` 步」的集合再走一步得到新词 `w` 时，`w` 距 `endWord` 为 `b+1` 步；若 `w` 落在「距 `beginWord` 为 `a` 步」的集合里，就存在一条边数为 `a + (b+1) = steps` 的转换序列，单词数为边数加一，即 `steps + 1`——这正是相遇时返回 `steps + 1` 的由来。

**虚拟节点 / 通配符优化（另一种可选做法，本项目代码未实现）：**

对每个单词生成 L 个通配符模式（如 `hit` → `*it`、`h*t`、`hi*`），把单词节点与通配符节点都作为图上的点：单词连到它的每个通配符，通配符再连到具有该模式的所有单词。这样「单词 → 通配符 → 单词」两跳恰好对应一次字母替换，建图规模从 O(N² × L) 降到 O(N × L)。代价是每条原始边被拆成两跳，距离要乘 1/2 再折算回单词数（实现时通常把以通配符层为单位的距离每两层算作一步），因此本文仍采用直接在单词上枚举 26 个字母的写法。

### 为什么正确

- **建模正确**：题目要求相邻单词只差一个字母，并且中间单词都必须属于 `wordList`（`beginWord` 除外），这正好是「枚举当前位置换成其他字母后查 `wordSet`」的过程；`endWord` 必须存在于字典中，否则直接返回 0。
- **BFS 的最短性**：BFS 按层推进，每个单词第一次被访问时所在的层数就是它与 `beginWord` 之间的最短边数，因此最短路径长度可以最先确定。
- **双向 BFS 的相遇判据**：每轮只扩展一侧的一整层，两侧前沿的深度之和单调递增为 `steps - 1 + 2`，首次相遇对应的就是最短路径的单词数（若存在更短的路径，它会在更早的某一轮相遇时被先发现）。
- **`visited` 的作用**：无权图中第一次到达某节点即为最短距离，后续到达不可能更优，因此可以安全地去重；`beginWord` 也预先标记，避免被重新访问（它可能同时出现在 `wordList` 中）。

### 复杂度分析

- **时间复杂度：** 基础 BFS 为 O(N × L × 26)，N 为字典大小（≤ 5000）、L 为单词长度（≤ 10）；每个单词最多出队一次，出队时枚举 26 × L 个候选并做 O(L) 的哈希查找（Go 的字符串哈希对短串近似 O(L)）。双向 BFS 的实际扩展量约为 O(b^(d/2)) 级别，常数上显著优于单向 BFS。
- **空间复杂度：** O(N × L)，用于 `wordSet`、`visited`、以及两侧的集合，其中每个字符串占 O(L)。

### 易错点 / 边界情况

- **`endWord` 不在 `wordList` 中直接返回 0**，不要继续搜索。
- **计数口径是单词数**：`hit -> hot` 是 2 而不是 1。`steps` 初值必须为 1，相遇时返回 `steps + 1`。
- **`beginWord` 不必在字典中**，但字典里允许出现 `beginWord`，此时要预先把它标记为已访问，避免绕回起点。
- **修改字符后要恢复**：`wordBytes[i] = original` 不能漏，否则会生成字符串错乱的候选词，`wordSet` 查找全部失效。
- **`visited` 要同时覆盖两侧**：双向 BFS 中两侧的访问集合必须共享，否则同一个单词会被两侧分别扩展，逻辑上可能重复计数。
- **词典中单词长度都等于 `beginWord`**：所以不需要额外判断长度。
- **原题约束 `beginWord != endWord`**，因此不必处理起点即终点的情况；若脱离该约束使用本代码，需要像「最小基因变化」那样单独处理 `beginWord == endWord` 返回 1。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/97-word-ladder-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="单词接龙 - 交互演示">
</iframe>

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
