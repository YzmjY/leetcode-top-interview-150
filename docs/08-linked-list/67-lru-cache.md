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

LRU 缓存的经典实现是 **哈希表 + 双向链表**：

- **哈希表**：键为 `key`，值为双向链表节点的指针，实现 O(1) 的键值查找。
- **双向链表**：按访问时间排序，最近访问的在头部，最久未使用的在尾部。

**核心操作**：

1. **get(key)**：
   - 在哈希表中查找 key，不存在返回 -1。
   - 存在：将对应节点移到链表头部（标记为最近使用），返回 value。

2. **put(key, value)**：
   - key 已存在：更新 value，将节点移到头部。
   - key 不存在：创建新节点放入头部。如果容量已满，删除尾部节点（最久未使用）。

**双向链表的辅助方法**：
- `addToHead(node)`：将节点插入头部。
- `removeNode(node)`：从链表中删除指定节点。
- `moveToHead(node)`：`removeNode` + `addToHead`。
- `removeTail()`：移除尾部节点并返回。

**为什么用双向链表而非单向链表？**

因为需要 O(1) 地删除任意位置的节点。双向链表可以通过前驱指针直接定位，而单向链表需要从头遍历找到前驱。

### 复杂度分析

- **时间复杂度**：`get` 和 `put` 均为 O(1)。
- **空间复杂度**：O(capacity)，哈希表 + 双向链表最多存储 capacity 个元素。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/67-lru-cache-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
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
