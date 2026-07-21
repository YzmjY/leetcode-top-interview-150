# 65. 旋转链表

## 题目描述

给你一个链表的头节点 `head`，旋转链表，将链表每个节点向右移动 `k` 个位置。

**示例 1：**

```
输入：head = [1,2,3,4,5], k = 2
输出：[4,5,1,2,3]
```

**示例 2：**

```
输入：head = [0,1,2], k = 4
输出：[2,0,1]
```

**约束条件：**

- 链表中节点的数目在范围 `[0, 500]` 内
- `-100 <= Node.val <= 100`
- `0 <= k <= 2 * 10^9`

## 题目分析

### 算法思路

旋转链表的核心是**形成一个环，然后在正确的位置断开**。

1. **特殊情况处理**：如果链表为空、只有一个节点或 `k = 0`，直接返回。
2. **计算链表长度 `n`**：遍历链表到末尾，同时记录长度。
3. **形成环**：将链表尾节点的 `Next` 指向头节点 `head`。
4. **计算实际旋转步数**：`k = k % n`（因为旋转 `n` 次等于没旋转）。如果 `k = 0`，断开环后直接返回。
5. **找到新尾节点的位置**：向右旋转 `k` 次，相当于找到从头部数第 `n - k` 个节点作为新尾节点（即从环中该节点之后断开）。
6. **断开环**：新尾节点的 `Next` 即为新头节点，将新尾节点的 `Next` 置为 `nil`。

**关键理解**：
- 向右旋转 k 次 = 倒数第 k 个节点成为新头节点（模 n 后）。
- 因此新尾节点是倒数第 k+1 个节点，即正数第 n - k 个节点。

### 复杂度分析

- **时间复杂度**：O(n)，计算长度和找断点各遍历一次。
- **空间复杂度**：O(1)，只使用常数个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/65-rotate-list-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="旋转链表 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func rotateRight(head *ListNode, k int) *ListNode {
    // 特殊情况：空链表、单节点、k = 0
    if head == nil || head.Next == nil || k == 0 {
        return head
    }

    // 计算链表长度，同时定位尾节点
    tail := head
    n := 1
    for tail.Next != nil {
        tail = tail.Next
        n++
    }

    // 实际需要旋转的步数
    k = k % n
    if k == 0 {
        return head
    }

    // 形成环
    tail.Next = head

    // 找到新尾节点（倒数第 k+1 个，正数第 n-k 个）
    newTail := head
    for i := 0; i < n-k-1; i++ {
        newTail = newTail.Next
    }

    // 断开环：新头节点 = 新尾节点的 Next
    newHead := newTail.Next
    newTail.Next = nil

    return newHead
}
```
