# 67. LRU 缓存

## 题目描述

请你设计并实现一个满足 **LRU（最近最少使用）缓存** 约束的数据结构。

实现 `LRUCache` 类：
- `LRUCache(int capacity)` 以 **正整数** 作为容量 `capacity` 初始化 LRU 缓存。
- `int get(int key)` 如果关键字 `key` 存在于缓存中，则返回关键字的值，否则返回 `-1`。
- `void put(int key, int value)` 如果关键字 `key` 已经存在，则变更其数据值 `value`；如果不存在，则向缓存中插入该组 `key-value`。如果插入操作导致关键字数量超过 `capacity`，则应该 **逐出** 最久未使用的关键字。

函数 `get` 和 `put` 必须以 O(1) 的平均时间复杂度运行。

**示例：**

```
输入：
["LRUCache","put","put","get","put","get","put","get","get","get"]
[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]
输出：
[null,null,null,1,null,-1,null,-1,3,4]

解释：
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1);   // 缓存是 {1=1}
lRUCache.put(2, 2);   // 缓存是 {1=1, 2=2}
lRUCache.get(1);      // 返回 1
lRUCache.put(3, 3);   // 该操作会逐出关键字 2，缓存是 {1=1, 3=3}
lRUCache.get(2);      // 返回 -1 (未找到)
lRUCache.put(4, 4);   // 该操作会逐出关键字 1，缓存是 {4=4, 3=3}
lRUCache.get(1);      // 返回 -1 (未找到)
lRUCache.get(3);      // 返回 3
lRUCache.get(4);      // 返回 4
```

**约束条件：**

- `1 <= capacity <= 3000`
- `0 <= key <= 10000`
- `0 <= value <= 10^5`
- 最多调用 `2 * 10^5` 次 `get` 和 `put`

## 题目分析

### 算法思路

**核心思路：** 先看单独用哪种结构为什么不够：

- **哈希表**：`get`/`put` 的查找、插入都是 O(1)，但它**表达不了顺序**，也没法 O(1) 地找出「最久未使用」的那一项。如果每次淘汰都去遍历找最旧的，就退化成 O(capacity)。
- **普通数组/切片**：移动一个元素到「最近使用」的位置需要整体搬移，O(n)。
- **链表**：把最近使用的放在头部，那么「淘汰」就是删尾节点，O(1)；「访问后刷新」就是把节点移到头部，**如果链表是双向的**，删除任意节点凭借 `prev` 指针只需 O(1)，再头插也只要 O(1)。但链表按位置访问是 O(n)，**无法按 key 快速找到节点**。

所以答案是**组合**：用哈希表 `key → 链表节点` 解决「按 key 定位」，用双向链表维护「使用时间顺序」。两者各补上对方的短板，`get`/`put` 都变成 O(1)。

**为什么必须是双向链表？** 因为「移到头部」= 先删除原位置、再头插。单向链表删除节点需要先找到前驱，得从头遍历，是 O(n)；双向链表通过 `prev` 指针直接拿到前驱，删除是 O(1)。

**结构设计：**

- `cache map[int]*DLinkedNode`：键到链表节点的映射，实现 O(1) 定位。
- 双向链表按使用时间排列：`head` 侧是最近使用，`tail` 侧是最久未使用。
- 用 `head` 和 `tail` 两个**哨兵节点**：真实节点全部位于二者之间。哨兵的好处是 `addToHead`、`removeNode`、`removeTail` 都不需要判断「链表为空」「节点是第一个/最后一个」这些边界。
- 链表节点同时存 `Key` 和 `Val`：淘汰尾节点时需要知道被删掉的是哪个 key，才能同步从哈希表里删除。

**算法步骤与辅助方法：**

1. `Constructor(capacity)`：建空 map，建两个哨兵并互连（`head.Next = tail`、`tail.Prev = head`）。
2. `Get(key)`：在 map 中查 key，没有就返回 `-1`；有则把该节点 `moveToHead`（标记为最近使用），返回 `node.Val`。
3. `Put(key, value)`：
   - **key 已存在**：只需更新 `node.Val`，再 `moveToHead`，直接返回（不新增节点，容量不变）；
   - **key 不存在**：新建节点，写入 map，`addToHead`。此时若 `len(cache) > capacity`，用 `removeTail` 摘掉尾节点，并 `delete(cache, removed.Key)`。
4. 辅助方法：
   - `addToHead(node)`：把节点插到 `head` 与 `head.Next` 之间；
   - `removeNode(node)`：用 `Prev`/`Next` 把节点从链上摘除；
   - `moveToHead(node)`：`removeNode` + `addToHead`；
   - `removeTail()`：`tail.Prev` 就是最久未使用的节点，摘除并返回它。

**为什么正确（不变量）：** **任意时刻，双向链表中（不含两个哨兵）的节点按「最近使用 → 最久未使用」从 `head` 侧到 `tail` 侧排列；并且 map 的键值对与链表中的节点一一对应（每个链上节点都能在 map 里查到，map 里每个节点都在链上）。**

- `Get` 命中：`moveToHead` 把该节点放到最靠近 `head` 的位置，最近使用的顺序被正确刷新；返回 `node.Val` 与哈希表中该键对应的值一致（不变量保证节点上存的就是最新值）。
- `Put` 更新已有键：只改值并刷新位置，键集合与链表节点集合都没变，不变量保持。
- `Put` 插入新键：新节点加入 `head` 侧成为最近使用，同时在 map 中登记，一一对应关系保持。若因此超出容量，`tail.Prev` 正是除新节点外**最久未使用**的那个节点，删除它并同步 `delete` map，两个结构仍一一对应，且容量回到 `capacity`。淘汰的选择与 LRU 定义完全一致。
- `Get` 未命中返回 `-1`：不变量说明 map 中的键与链上节点一致，查不到就意味着缓存中确实没有。

### 复杂度分析

- **时间复杂度**：`get` 和 `put` 都是 **平均 O(1)**。哈希表的查找/插入/删除均摊 O(1)；`addToHead`、`removeNode`、`moveToHead`、`removeTail` 都只改常数个指针。
- **空间复杂度**：O(capacity)。链表与哈希表各存至多 `capacity` 个元素（外加两个哨兵，属常数）。

### 易错点 / 边界情况

- **淘汰时要同步删除哈希表条目**：`removeTail` 只把节点从链表摘掉，必须紧接着 `delete(lru.cache, removed.Key)`，否则哈希表里会残留一个已经不在链上的节点；后续 `Get` 会命中它并试图 `moveToHead`，把脏节点接回链表，缓存彻底损坏。这也是节点必须保存 `Key` 的原因。
- **`Put` 已有 key 时不要新建节点**：如果不先判断 key 是否存在，就会插入重复节点，容量被无端撑大，淘汰逻辑也会错。正确做法是「存在则改值 + 移到头部，然后返回」。
- **哨兵节点不能省**：`addToHead` 里有 `head.Next.Prev = node`，`removeTail` 里有 `tail.Prev`；链表为空时 `head.Next` 就是 `tail`、`tail.Prev` 就是 `head`，这些操作恰好正确，无需任何空链判断。若不用哨兵，每个方法都要写一堆 `nil` 分支。
- **`addToHead` 的指针顺序**：必须先 `node.Prev = head`、`node.Next = head.Next`，再 `head.Next.Prev = node`，最后 `head.Next = node`。如果先执行 `head.Next = node`，`node.Next` 就会指向自己，链表断裂。
- **`removeNode` 不必处理节点是否为头/尾**：双向链表里 `Prev`/`Next` 一定存在（哨兵兜底），两句赋值即可。
- **`Get` 命中后必须刷新位置**：LRU 的语义是「读也算使用」。若 `Get` 只返回值而不移动节点，淘汰顺序就退化成 FIFO 而不是 LRU。
- **`key` 可以等于 0，`value` 也可以等于 0**：所以「查不到」必须用 `node, ok := lru.cache[key]` 的 `ok` 判断，绝不能拿 `0` 当「不存在」的哨兵值。
- **容量恒为正**：`1 <= capacity`，不必处理 `capacity == 0` 的退化情形；但仍要注意 `Put` 新键的判断是 `len(cache) > capacity`（先插入后淘汰），顺序反过来也能写对，但不要漏删。
- **`Get` 返回的是值，不是节点**：对外接口只暴露 `int`。
- **不要在 `moveToHead` 里直接用 `addToHead` 而不先删除**：节点还在链上时直接插入会造成同一节点出现两次。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/67-lru-cache-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="LRU 缓存 - 交互演示">
</iframe>

## Go 代码实现

```go
// DLinkedNode 双向链表节点
type DLinkedNode struct {
    Key, Val int
    Prev     *DLinkedNode
    Next     *DLinkedNode
}

// LRUCache LRU 缓存结构
type LRUCache struct {
    capacity int
    cache    map[int]*DLinkedNode // 哈希表：key -> 链表节点
    head     *DLinkedNode         // 链表头哨兵（最近使用）
    tail     *DLinkedNode         // 链表尾哨兵（最久未使用）
}

// Constructor 初始化 LRU 缓存
func Constructor(capacity int) LRUCache {
    lru := LRUCache{
        capacity: capacity,
        cache:    make(map[int]*DLinkedNode),
        head:     &DLinkedNode{},
        tail:     &DLinkedNode{},
    }
    // 初始化双向链表：head <-> tail
    lru.head.Next = lru.tail
    lru.tail.Prev = lru.head
    return lru
}

// Get 获取 key 对应的值
func (lru *LRUCache) Get(key int) int {
    if node, ok := lru.cache[key]; ok {
        // 移动到头部（最近使用）
        lru.moveToHead(node)
        return node.Val
    }
    return -1
}

// Put 插入或更新 key-value
func (lru *LRUCache) Put(key int, value int) {
    if node, ok := lru.cache[key]; ok {
        // key 已存在，更新值并移到头部
        node.Val = value
        lru.moveToHead(node)
        return
    }

    // key 不存在，创建新节点
    newNode := &DLinkedNode{Key: key, Val: value}
    lru.cache[key] = newNode
    lru.addToHead(newNode)

    // 超出容量，删除尾部节点（最久未使用）
    if len(lru.cache) > lru.capacity {
        removed := lru.removeTail()
        delete(lru.cache, removed.Key)
    }
}

// addToHead 将节点添加到链表头部
func (lru *LRUCache) addToHead(node *DLinkedNode) {
    node.Prev = lru.head
    node.Next = lru.head.Next
    lru.head.Next.Prev = node
    lru.head.Next = node
}

// removeNode 从链表中删除指定节点
func (lru *LRUCache) removeNode(node *DLinkedNode) {
    node.Prev.Next = node.Next
    node.Next.Prev = node.Prev
}

// moveToHead 将节点移动到头部
func (lru *LRUCache) moveToHead(node *DLinkedNode) {
    lru.removeNode(node)
    lru.addToHead(node)
}

// removeTail 删除尾部节点并返回
func (lru *LRUCache) removeTail() *DLinkedNode {
    node := lru.tail.Prev
    lru.removeNode(node)
    return node
}
```
