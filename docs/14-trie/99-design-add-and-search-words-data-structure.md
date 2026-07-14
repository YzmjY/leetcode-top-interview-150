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

本题在标准 Trie 基础上增加了通配符 `'.'` 匹配，`'.'` 可以匹配任意单个字符。

**算法思路：**

数据结构仍然使用 Trie，`addWord` 与标准 Trie 插入完全相同。关键变化在 `search`：当遇到 `'.'` 时，需要递归/迭代地尝试该节点的所有子节点。

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

**时间复杂度：**

- `addWord`: O(L)
- `search`（无通配符）: O(L)
- `search`（有通配符）: 最坏 O(26^K * L)，其中 K 是通配符数量。但实际中由于 Trie 剪枝，搜索空间远小于此。

**空间复杂度：** O(N * L)，N 为单词数量。

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
