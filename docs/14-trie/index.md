# 第14章：前缀树 (Trie)

## 概述

Trie（又称前缀树或字典树）是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。Trie 的每个节点代表一个字符串的前缀，从根节点到某一节点的路径上的字符连接起来即为该节点对应的字符串。

## 核心特征

- **根节点**不包含字符，除根节点外每一个节点都只包含一个字符
- 从根节点到某一节点，路径上经过的字符连接起来，为该节点对应的字符串
- 每个节点的所有子节点包含的字符都不相同
- 通常用一个布尔标记表示该节点是否是一个完整单词的结尾

## 基本结构

```go
type Trie struct {
    children [26]*Trie  // 假设只包含小写字母
    isEnd    bool        // 标记是否为单词结尾
}
```

## 基本操作

### 插入（Insert）

从根节点开始，逐个字符向下查找或创建节点，最后标记单词结尾。

```go
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
```

时间复杂度：O(L)，L 为单词长度。

### 查找（Search）

从根节点开始，逐字符向下匹配。若中途节点不存在则返回 false。到达最后一个字符时检查 `isEnd` 标记。

```go
func (t *Trie) Search(word string) bool {
    node := t
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            return false
        }
        node = node.children[idx]
    }
    return node.isEnd
}
```

时间复杂度：O(L)。

### 前缀匹配（StartsWith）

与 Search 类似，但不检查 `isEnd` 标记，只要能遍历完整个前缀串即可。

## 变体与扩展

- **字符集扩展**：使用 `map[byte]*Trie` 代替固定大小数组，支持任意字符集
- **通配符匹配**：支持 `.` 匹配任意字符（如 LeetCode 211）
- **Trie + DFS**：结合回溯进行模式匹配（如 LeetCode 212 单词搜索 II）
- **压缩 Trie（Radix Tree）**：合并只有一个子节点的链，节省空间

## 时间复杂度总结

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| Insert | O(L) | L 为单词长度 |
| Search | O(L) | 精确查找 |
| StartsWith | O(L) | 前缀查找 |
| Delete | O(L) | 需要递归清理无用节点 |

## 本章题目

| 题号 | 题目 | 核心知识点 |
|------|------|-----------|
| 98 | 实现 Trie 前缀树 | Trie 基本结构，Insert/Search/StartsWith |
| 99 | 添加与搜索单词 | Trie + 通配符匹配（DFS） |
| 100 | 单词搜索 II | Trie + 回溯（Backtracking），剪枝优化 |
