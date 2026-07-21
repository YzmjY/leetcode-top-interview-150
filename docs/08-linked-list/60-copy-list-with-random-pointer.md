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

本题的难点在于 `random` 指针可能指向还未创建的节点。

**方法：哈希表 + 两次遍历**

1. **第一次遍历**：创建所有新节点，并建立原节点 -> 新节点的哈希映射 `old2New`。
2. **第二次遍历**：根据哈希映射，设置每个新节点的 `Next` 和 `Random` 指针。

这样做的关键是：利用哈希表保证我们在设置 `random` 指针时，目标节点已经存在（所有节点在第一遍就已经创建完毕）。

### 复杂度分析

- **时间复杂度**：O(n)，两次遍历链表。
- **空间复杂度**：O(n)，哈希表存储 n 个节点的映射关系。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/60-copy-list-with-random-pointer-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
