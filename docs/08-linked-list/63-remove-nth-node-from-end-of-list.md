# 63. 删除链表的倒数第 N 个结点

## 题目描述

给你一个链表，删除链表的倒数第 `n` 个结点，并且返回链表的头结点。

**示例 1：**

```
输入：head = [1,2,3,4,5], n = 2
输出：[1,2,3,5]
```

**示例 2：**

```
输入：head = [1], n = 1
输出：[]
```

**示例 3：**

```
输入：head = [1,2], n = 1
输出：[1]
```

**约束条件：**

- 链表中结点的数目为 `sz`
- `1 <= sz <= 30`
- `0 <= Node.val <= 100`
- `1 <= n <= sz`

**进阶**：你能尝试使用一趟扫描实现吗？

## 题目分析

### 算法思路

使用 **双指针（快慢指针）** 实现一趟扫描：

1. 创建 `dummy` 节点简化删除头节点的情况。
2. 初始化两个指针 `fast` 和 `slow`，都指向 `dummy`。
3. `fast` 先向前走 `n + 1` 步（因为要删除倒数第 n 个节点，我们需要找到倒数第 n+1 个节点作为前驱）。
4. 然后 `fast` 和 `slow` 同时前进，直到 `fast` 到达 `nil`。
5. 此时 `slow` 指向倒数第 n+1 个节点（即待删除节点的前驱），执行删除：
   - `slow.Next = slow.Next.Next`

**数学原理**：`fast` 和 `slow` 之间始终相隔 `n + 1` 个节点。当 `fast` 到达 `nil` 时，`slow` 自然在倒数第 `n + 1` 个位置。

### 复杂度分析

- **时间复杂度**：O(L)，其中 L 为链表长度，一次遍历。
- **空间复杂度**：O(1)，只使用常数个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/63-remove-nth-node-from-end-of-list-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="删除链表的倒数第 N 个结点 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func removeNthFromEnd(head *ListNode, n int) *ListNode {
    // Dummy 节点，处理删除头节点的情况
    dummy := &ListNode{Next: head}
    fast, slow := dummy, dummy

    // fast 先走 n+1 步（找到倒数第 n+1 个节点）
    for i := 0; i <= n; i++ {
        fast = fast.Next
    }

    // fast 和 slow 同时移动直到 fast 到达 nil
    for fast != nil {
        fast = fast.Next
        slow = slow.Next
    }

    // slow 现在指向待删除节点的前驱，执行删除
    slow.Next = slow.Next.Next

    return dummy.Next
}
```
