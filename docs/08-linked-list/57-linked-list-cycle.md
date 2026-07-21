# 57. 环形链表

## 题目描述

给你一个链表的头节点 `head`，判断链表中是否有环。

如果链表中有某个节点，可以通过连续跟踪 `next` 指针再次到达，则链表中存在环。为了表示给定链表中的环，评测系统内部使用整数 `pos` 来表示链表尾连接到链表中的位置（索引从 0 开始）。**注意：`pos` 不作为参数进行传递**。仅仅是为了标识链表的实际情况。

如果链表中存在环，则返回 `true`。否则，返回 `false`。

**示例 1：**

```
输入：head = [3,2,0,-4], pos = 1
输出：true
解释：链表中有一个环，其尾部连接到第二个节点。
```

**示例 2：**

```
输入：head = [1,2], pos = 0
输出：true
解释：链表中有一个环，其尾部连接到第一个节点。
```

**示例 3：**

```
输入：head = [1], pos = -1
输出：false
解释：链表中没有环。
```

**约束条件：**

- 链表中节点的数目范围是 `[0, 10^4]`
- `-10^5 <= Node.val <= 10^5`
- `pos` 为 `-1` 或者链表中的一个 **有效索引**

**进阶**：你能用 O(1)（即常量）内存解决此问题吗？

## 题目分析

### 算法思路

使用 **快慢指针（Floyd 判圈算法 / 龟兔赛跑算法）**：

1. 创建两个指针 `slow` 和 `fast`，初始都指向 `head`。
2. `slow` 每次移动一步，`fast` 每次移动两步。
3. 如果链表中有环，快慢指针一定会相遇（类似在操场上跑步，快者会追上慢者）。
4. 如果链表中没有环，`fast` 会先到达 `nil`。

**数学原理**：在环中，快指针相对于慢指针的速度是 1 步/次，因此只要存在环，快指针一定会追上慢指针，不会跳过。

### 复杂度分析

- **时间复杂度**：O(n)，n 为链表中节点的数量。最坏情况下快慢指针会遍历所有节点。
- **空间复杂度**：O(1)，只使用了两个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/57-linked-list-cycle-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="环形链表 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func hasCycle(head *ListNode) bool {
    if head == nil || head.Next == nil {
        return false
    }

    // 快慢指针初始都指向头节点
    slow, fast := head, head

    // fast 每次走两步，slow 每次走一步
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        // 快慢指针相遇，说明有环
        if slow == fast {
            return true
        }
    }

    // fast 到达 nil，说明无环
    return false
}
```
