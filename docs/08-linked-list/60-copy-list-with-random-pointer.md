# 60. 随机链表的复制

## 题目描述

给你一个长度为 `n` 的链表，每个节点包含一个额外增加的随机指针 `random`，该指针可以指向链表中的任何节点或空节点。

构造这个链表的 **深拷贝**。深拷贝应该正好由 `n` 个 **全新** 节点组成，其中每个新节点的值都设为其对应的原节点的值。新节点的 `next` 指针和 `random` 指针也都应指向复制链表中的新节点，并使原链表和复制链表中的这些指针能够表示相同的链表状态。**复制链表中的指针都不应指向原链表中的节点**。

例如，如果原链表中有 `X` 和 `Y` 两个节点，其中 `X.random --> Y`。那么在复制链表中对应的两个节点 `x` 和 `y`，同样有 `x.random --> y`。

返回复制链表的头节点。

用一个由 `n` 个节点组成的链表来表示输入/输出中的链表。每个节点用一个 `[val, random_index]` 表示：
- `val`：一个表示 `Node.val` 的整数。
- `random_index`：随机指针指向的节点索引（范围从 `0` 到 `n-1`）；如果不指向任何节点，则为 `null`。

你的代码 **只** 接受原链表的头节点 `head` 作为传入参数。

**示例 1：**

```
输入：head = [[7,null],[13,0],[11,4],[10,2],[1,0]]
输出：[[7,null],[13,0],[11,4],[10,2],[1,0]]
```

**示例 2：**

```
输入：head = [[1,1],[2,1]]
输出：[[1,1],[2,1]]
```

**示例 3：**

```
输入：head = [[3,null],[3,0],[3,null]]
输出：[[3,null],[3,0],[3,null]]
```

**约束条件：**

- `0 <= n <= 1000`
- `-10^4 <= Node.val <= 10^4`
- `Node.random` 为 `null` 或指向链表中的节点

## 题目分析

### 算法思路

**核心思路：** 如果只有 `next` 指针，一次遍历就能复制；麻烦的是 `random`——它可能指向链表中任意位置，包括**还没创建**的节点，甚至是后面才出现的节点。所以「一边遍历一边创建」是行不通的。

关键观察是：**只要先保证所有新节点都已创建，那么设置任何指针时，目标节点一定已经存在。** 于是自然地分成两遍：

- 第一遍只做一件事：为每个原节点创建一个对应的新节点，并用哈希表记下「原节点 → 新节点」的映射。此时新节点之间的指针还是空的，但「节点池」已经齐了。
- 第二遍再遍历一次，对每个原节点 `cur`，把它的新节点 `old2New[cur]` 的两个指针分别指向 `old2New[cur.Next]` 和 `old2New[cur.Random]`——也就是原指针所指节点的**副本**。所有被指向的节点在第一遍已经建好，查表即可。

**算法步骤：**

1. `head == nil` 时直接返回 `nil`。
2. 建哈希表 `old2New := make(map[*Node]*Node)`。
3. **第一遍**：`for cur := head; cur != nil; cur = cur.Next`，执行 `old2New[cur] = &Node{Val: cur.Val}`。
4. **第二遍**：再遍历一次原链表，对每个 `cur` 取出 `newNode := old2New[cur]`，设置：
   - `newNode.Next = old2New[cur.Next]`
   - `newNode.Random = old2New[cur.Random]`
5. 返回 `old2New[head]`。

**为什么正确：**

- **每个节点都被复制且只复制一次**：第一遍对原链表的每个节点恰好执行一次赋值，`old2New` 的键集合就是原链表节点集合，值是两两不同的新节点。
- **结构同构**：第二遍对每个 `cur` 设置 `newNode.Next` 时，`old2New[cur.Next]` 正是「`cur.Next` 所指节点的副本」；若 `cur.Next == nil`，利用 Go 中「从 map 取不存在的键返回零值」的特性，`old2New[nil]` 返回 `nil`，无需特判就得到空指针。`Random` 同理。因此原链表中任何一条边 `X → Y`（`Next` 或 `Random`、或 `Y` 为 `nil`）在复制链表中都对应 `copy(X) → copy(Y)`，结构完全一致（示例 3 中三个节点的值都是 3，靠节点身份而不是值来区分，哈希表以指针为键正好保证这一点）。
- **是深拷贝**：复制链表中的所有节点都是第一遍用 `&Node{}` 新建的对象，与任何原节点都是不同的指针；复制链表内部的指针也全部经过 `old2New` 转换，不可能指回原链表。

### 复杂度分析

- **时间复杂度**：O(n)，两次线性遍历，哈希表的插入与查询均摊 O(1)。
- **空间复杂度**：O(n)，哈希表存 n 条「原节点 → 新节点」的映射；结果链表另有 n 个节点（不计入额外空间的话，额外开销是 O(n)）。

### 易错点 / 边界情况

- **必须第一遍先把所有节点建完**：如果一边遍历一边创建新节点、同时设置 `Random`，当 `random` 指向后面的节点时会拿到 `nil`，导致随机指针丢失。这正是本题与普通链表复制的区别所在。
- **哈希表的键必须是指针，不能是 `Val`**：节点值可能重复（示例 3 是 `[3,3,3]`），用值作键会把三个节点映射到一起，`random` 立刻出错。
- **`old2New[nil]` 返回 `nil` 是刻意利用的语言特性**：Go 的 map 查询不存在的键返回「值类型的零值」，指针类型的零值就是 `nil`。所以对 `cur.Next`、`cur.Random` 为 `nil` 的情况不需要额外判断，代码更短。理解这一点很重要，否则会误以为漏了空指针保护而画蛇添足。
- **`head == nil` 要提前返回**：空链表没有任何节点，若往下走，最后 `old2New[head]` 也是 `nil`，返回结果同样正确；但显式返回更清晰，且避免创建无用的 map。
- **不要复用原节点**：任何一处写成 `newNode.Next = cur.Next` 都会让复制链表的指针指回原链表，破坏了「深拷贝」的要求；必须全部经过 `old2New` 转换。
- **另一种解法是 O(1) 额外空间**：把新节点直接插到对应原节点之后（形成 `原1 → 新1 → 原2 → 新2 → …`），这样 `cur.Next` 就是它的副本，可以借此就地设置 `Random`；最后再把两条链拆开。本解法选择了更直观的哈希表法，代价是 O(n) 空间。
- **返回的必须是新链表的头**：即 `old2New[head]`，而不是 `head` 或 `dummy`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/60-copy-list-with-random-pointer-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="随机链表的复制 - 交互演示">
</iframe>

## Go 代码实现

```go
// Node 链表节点定义（包含随机指针）
type Node struct {
    Val    int
    Next   *Node
    Random *Node
}

func copyRandomList(head *Node) *Node {
    if head == nil {
        return nil
    }

    // 哈希表：原节点 -> 新节点
    old2New := make(map[*Node]*Node)

    // 第一遍遍历：创建所有新节点并建立映射
    for cur := head; cur != nil; cur = cur.Next {
        old2New[cur] = &Node{Val: cur.Val}
    }

    // 第二遍遍历：设置新节点的 Next 和 Random 指针
    for cur := head; cur != nil; cur = cur.Next {
        newNode := old2New[cur]
        newNode.Next = old2New[cur.Next]     // Next 指针
        newNode.Random = old2New[cur.Random] // Random 指针
    }

    return old2New[head]
}
```
