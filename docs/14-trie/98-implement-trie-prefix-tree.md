# 98. 实现 Trie (前缀树)

## 题目描述

**[Trie](https://baike.baidu.com/item/%E5%AD%97%E5%85%B8%E6%A0%91/9825209?fr=aladdin)**（发音类似 "try"）或者说**前缀树**是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。这一数据结构有相当多的应用情景，例如自动补全和拼写检查。

请你实现 Trie 类：

- `Trie()` 初始化前缀树对象。
- `void insert(String word)` 向前缀树中插入字符串 `word`。
- `boolean search(String word)` 如果字符串 `word` 在前缀树中，返回 `true`（即在检索之前已经插入）；否则，返回 `false`。
- `boolean startsWith(String prefix)` 如果之前已经插入的字符串 `word` 的前缀之一为 `prefix`，返回 `true`；否则，返回 `false`。

**示例：**

```
输入：
["Trie", "insert", "search", "search", "startsWith", "insert", "search"]
[[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]
输出：
[null, null, true, false, true, null, true]

解释：
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // 返回 True
trie.search("app");     // 返回 False
trie.startsWith("app"); // 返回 True
trie.insert("app");
trie.search("app");     // 返回 True
```

**约束条件：**

- `1 <= word.length, prefix.length <= 2000`
- `word` 和 `prefix` 仅由小写英文字母组成
- `insert`、`search` 和 `startsWith` 调用次数总计不超过 `3 * 10^4` 次

## 题目分析

本题是 Trie 的标准实现题，要求实现插入、精确查找和前缀匹配三个操作。

**数据结构设计：**

使用固定大小的子节点数组 `[26]*Trie`（因为只有小写字母），比使用 map 更高效。

**核心细节：**

- `isEnd` 标记：区分"apple"和"app"——search("app") 应返回 false（如果只插入了 apple）或 true（如果也插入了 app）
- 前缀匹配：与完整查找的唯一区别是不检查 `isEnd`

**时间复杂度：**

- Insert: O(L)，L 为单词长度
- Search: O(L)
- StartsWith: O(L)

**空间复杂度：** O(N * L * 26)，N 为单词数量，实际上由于共享前缀，实际空间远小于此。

## Go 代码实现

```go
package main

import "fmt"

// Trie 前缀树节点
type Trie struct {
    children [26]*Trie
    isEnd    bool
}

// Constructor 初始化 Trie
func Constructor() Trie {
    return Trie{}
}

// Insert 插入单词
func (t *Trie) Insert(word string) {
    node := t
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            node.children[idx] = &Trie{}
        }
        node = node.children[idx]
    }
    node.isEnd = true
}

// Search 精确查找单词
func (t *Trie) Search(word string) bool {
    node := t.searchPrefix(word)
    return node != nil && node.isEnd
}

// StartsWith 查找前缀
func (t *Trie) StartsWith(prefix string) bool {
    return t.searchPrefix(prefix) != nil
}

// searchPrefix 辅助方法：返回 prefix 对应的最后一个节点
func (t *Trie) searchPrefix(prefix string) *Trie {
    node := t
    for _, ch := range prefix {
        idx := ch - 'a'
        if node.children[idx] == nil {
            return nil
        }
        node = node.children[idx]
    }
    return node
}

func main() {
    trie := Constructor()
    trie.Insert("apple")
    fmt.Println(trie.Search("apple"))   // true
    fmt.Println(trie.Search("app"))     // false
    fmt.Println(trie.StartsWith("app")) // true
    trie.Insert("app")
    fmt.Println(trie.Search("app"))     // true
}
```
