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

### 算法思路

**核心思路**：用一棵多叉树（前缀树 / 字典树）存单词集合。每个节点代表一个前缀，节点向下的一条边代表追加一个字母。于是「单词是否存在」等价于「从根沿着单词的字符走到底，并且终点被标记为单词结尾」；「前缀是否存在」等价于「沿着前缀的字符能走到底，不需要看结尾标记」。

**数据结构设计：**

- 每个节点维护 `children [26]*Trie` 与 `isEnd bool`。因为只有小写字母，用固定长度数组比 map 更快，且 `ch - 'a'` 可直接算出下标。
- `isEnd` 用来区分「某个单词的结尾」和「只是别人前缀的中间节点」，这是本题最核心的设计点。

**算法步骤：**

1. `Constructor()` 返回一个空的根节点（根节点不表示任何字母，`isEnd` 恒为 false）。
2. `Insert(word)`：从根开始，对每个字符求下标 `idx = ch - 'a'`，子节点不存在就新建，然后下移；走到最后一个字符后把该节点的 `isEnd` 置为 `true`。
3. `searchPrefix(prefix)`：从根开始沿字符下移，任一子节点为空就返回 nil（说明不存在这个前缀），全部字符都走完则返回终点节点。
4. `Search(word)`：调用 `searchPrefix`，同时要求返回节点非空**且** `isEnd == true`。
5. `StartsWith(prefix)`：调用 `searchPrefix`，只要求返回节点非空。

### 为什么正确

- **结构不变量**：从根到任意节点的路径恰好拼出一个前缀，且节点存在当且仅当该前缀被至少一个已插入单词使用过。插入时逐字符建节点，归纳可知不变量始终成立。
- **`Search` 的判据**：若 `searchPrefix(word)` 返回节点 n，则 `word` 是某个已插入单词的前缀；`n.isEnd` 表示它本身也被作为完整单词插入过。两者同时成立当且仅当 `word` 在集合中，所以判据充分必要。
- **`StartsWith` 的判据**：只需存在某个已插入单词以 `prefix` 开头，而根据不变量，这正是 `searchPrefix(prefix) != nil`。
- **插入顺序无关**：每个节点只记录「是否作为单词结尾」，与插入的先后顺序无关，因此重复插入同一单词是幂等的。

### 复杂度分析

- **时间复杂度：** `Insert`、`Search`、`StartsWith` 都是 O(L)，L 为单词/前缀长度，因为每个字符只做一次数组索引与指针移动。
- **空间复杂度：** 最坏 O(总节点数 × 26)。每个节点固定分配 26 个指针，即使只用到其中一两个；所有单词共用一个字符都不重复时总节点数为 O(N × L)，所以是 O(N × L × 26)。实际由于大量共享前缀，节点数通常远小于 N × L。

### 易错点 / 边界情况

- **`Search` 不能只判断节点是否存在**：只插入 `apple` 时 `Search("app")` 必须为 false、`StartsWith("app")` 必须为 true，区别就在 `isEnd`。
- **`isEnd` 只标在最后一个字符对应的节点上**，不要在遍历过程中提前标记。
- **`insert` 之后节点指针要整体下移**：循环里写 `node = node.children[idx]`，不要漏掉。
- **前缀比已有单词更长**：沿途中遇到 nil 就返回 nil；反之，前缀比某个单词短时 `searchPrefix` 正常返回节点，`isEnd` 为 false。
- **空串**：本题约束长度 ≥ 1，但代码对空串的行为是 `Search("") == false`、`StartsWith("") == true`（空前缀是任何非空单词的前缀），如需支持空串插入要额外约定。
- **指针接收者**：`Insert`/`Search`/`StartsWith` 都是指针方法，`trie := Constructor()` 得到的变量可直接调用（Go 自动取地址）；如果把 `Constructor()` 的返回值直接当右值使用（例如 `Constructor().Insert("a")`）虽然合法，但插入的对象会立刻被丢弃。
- **字符范围**：`ch - 'a'` 依赖输入只含小写字母，若加入大写或数字会越界，需要换用 map 或扩大数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/98-implement-trie-prefix-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="实现 Trie (前缀树) - 交互演示">
</iframe>

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
