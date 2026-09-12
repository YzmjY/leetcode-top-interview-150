# 99. 添加与搜索单词 - 数据结构设计

## 题目描述

请你设计一个数据结构，支持添加新单词和查找字符串是否与任何先前添加的字符串匹配。

实现词典类 `WordDictionary`：

- `WordDictionary()` 初始化词典对象
- `void addWord(word)` 将 `word` 添加到数据结构中，之后可以对它进行匹配
- `bool search(word)` 如果数据结构中存在字符串与 `word` 匹配，则返回 `true`；否则，返回 `false`。`word` 中可能包含一些 `'.'`，每个 `.` 都可以表示任何一个字母。

**示例：**

```
输入：
["WordDictionary","addWord","addWord","addWord","search","search","search","search"]
[[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]
输出：
[null,null,null,null,false,true,true,true]

解释：
WordDictionary wordDictionary = new WordDictionary();
wordDictionary.addWord("bad");
wordDictionary.addWord("dad");
wordDictionary.addWord("mad");
wordDictionary.search("pad"); // 返回 False
wordDictionary.search("bad"); // 返回 True
wordDictionary.search(".ad"); // 返回 True
wordDictionary.search("b.."); // 返回 True
```

**约束条件：**

- `1 <= word.length <= 25`
- `addWord` 中的 `word` 由小写英文字母组成
- `search` 中的 `word` 由 `'.'` 或小写英文字母组成
- 最多调用 `10^4` 次 `addWord` 和 `search`

## 题目分析

### 算法思路

**核心思路**：`addWord` 与标准 Trie 完全一致；难点在 `search`——`'.'` 可以匹配任意一个字母，也就是说在 Trie 上遇到 `'.'` 时无法确定唯一的下一个节点，必须**枚举该节点的所有非空子节点**，分别尝试继续匹配。这正是回溯/DFS 的场景。

**算法步骤：**

1. 数据结构仍是 Trie：每个节点含 `children [26]*TrieNode` 和 `isEnd bool`；`addWord` 逐字符建链，末尾置 `isEnd`。
2. `search(word)` 从根开始递归匹配，用 `index` 表示当前要匹配 `word` 的第几个字符。
3. 递归函数 `searchDFS(node, word, index)`：
   - `node == nil` → 返回 false
   - `index == len(word)` → 匹配结束，返回 `node.isEnd`
   - 若 `word[index]` 是普通字母，取 `idx = ch - 'a'`，只递归这一条子链
   - 若是 `'.'`，遍历 `node.children` 中所有非空子节点，任意一个分支成功就返回 true，全部失败返回 false

**实现方式（DFS 递归）：**

```go
func (d *WordDictionary) searchDFS(node *TrieNode, word string, index int) bool {
    if index == len(word) {
        return node.isEnd
    }
    ch := word[index]
    if ch == '.' {
        for _, child := range node.children {
            if child != nil && d.searchDFS(child, word, index+1) {
                return true
            }
        }
        return false
    }
    // 精确字符匹配
    idx := ch - 'a'
    if node.children[idx] == nil {
        return false
    }
    return d.searchDFS(node.children[idx], word, index+1)
}
```

### 为什么正确

- **精确匹配分支**：不含 `'.'` 的位置上，能与 `word` 该位匹配的节点唯一（`children[ch-'a']`），所以只走这一条路既完备又无冗余。
- **通配符分支**：`'.'` 可以匹配任意字母，因此势必要尝试所有可能的后继；DFS 对所有非空子节点各递归一次，恰好穷举了全部候选，只要有一条路径通到 `index == len(word)` 且终点 `isEnd` 为 true，就说明词典中存在与模式匹配的单词。
- **终止条件正确**：递归深度恰好等于模式长度；`index == len(word)` 时返回 `node.isEnd` 保证「模式长度必须与单词长度完全相等」，不会把前缀误判为匹配。
- **完备性**：对模式长度做归纳——长度为 0 时返回 `isEnd` 正确；长度为 k 时，无论首字符是普通字母还是通配符，代码都枚举了所有可能的首字符后继，并在其长度为 k-1 的后缀上由归纳假设得到正确结果。

### 复杂度分析

- **`addWord`：** 时间 O(L)，L 为单词长度（≤ 25）。
- **`search`（无通配符）：** 时间 O(L)，只沿一条链下行。
- **`search`（含通配符）：** 最坏 O(26^K × L)，K 为通配符个数——每遇到一个 `'.'` 就要在最多 26 个子节点上分叉。实际中 Trie 会把不存在的分支剪掉，且单词总长不超过 25，搜索空间远小于该上界。
- **空间复杂度：** 字典存储为 O(总节点数 × 26)，与 Trie 相同；单次 `search` 的递归栈深度为 O(L)。

### 易错点 / 边界情况

- **`'.'` 分支必须遍历所有子节点并返回「任意一个成功」**，不能只试第一个非空子节点。
- **`index == len(word)` 时必须返回 `node.isEnd`**：长度必须完全相等，否则模式 `"app"` 会错误匹配到已插入的 `"apple"`。
- **`node == nil` 的兜底检查不能少**：精确分支里可能直接取到 nil 子节点，通配符分支里的 nil 也要能安全跳过（本仓库代码在递归入口统一判断，因此通配符分支可以直接遍历而不额外判空）。
- **`ch - 'a'` 要求精确匹配分支只收到小写字母**：`'.'` 已在前面单独处理，不会再落到这一分支。
- **重复调用/重复添加同一单词**：只需把 `isEnd` 置 true，天然幂等。
- **模式比词典中所有词都长**：递归会在某层走到 nil 后返回 false，不会 panic。
- **与「实现 Trie」的区别**：`search` 不能复用 `StartsWith` 的逻辑，因为通配符需要真正的分支枚举，而不是单链下移。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/99-design-add-and-search-words-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="添加与搜索单词 - 数据结构设计 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// TrieNode 前缀树节点
type TrieNode struct {
    children [26]*TrieNode
    isEnd    bool
}

// WordDictionary 单词词典
type WordDictionary struct {
    root *TrieNode
}

// Constructor 初始化
func Constructor() WordDictionary {
    return WordDictionary{root: &TrieNode{}}
}

// AddWord 添加单词
func (d *WordDictionary) AddWord(word string) {
    node := d.root
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            node.children[idx] = &TrieNode{}
        }
        node = node.children[idx]
    }
    node.isEnd = true
}

// Search 搜索单词（支持通配符 '.'）
func (d *WordDictionary) Search(word string) bool {
    return d.searchDFS(d.root, word, 0)
}

// searchDFS 递归搜索
func (d *WordDictionary) searchDFS(node *TrieNode, word string, index int) bool {
    if node == nil {
        return false
    }
    if index == len(word) {
        return node.isEnd
    }

    ch := word[index]
    if ch == '.' {
        // 通配符：尝试所有可能的子节点
        for _, child := range node.children {
            if d.searchDFS(child, word, index+1) {
                return true
            }
        }
        return false
    }

    // 精确匹配
    idx := ch - 'a'
    return d.searchDFS(node.children[idx], word, index+1)
}

func main() {
    wd := Constructor()
    wd.AddWord("bad")
    wd.AddWord("dad")
    wd.AddWord("mad")
    fmt.Println(wd.Search("pad"))  // false
    fmt.Println(wd.Search("bad"))  // true
    fmt.Println(wd.Search(".ad"))  // true
    fmt.Println(wd.Search("b.."))  // true
}
```
