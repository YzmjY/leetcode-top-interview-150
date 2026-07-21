# 61. 反转链表 II

## 题目描述

给你单链表的头指针 `head` 和两个整数 `left` 和 `right`，其中 `left <= right`。请你反转从位置 `left` 到位置 `right` 的链表节点，返回 **反转后的链表**。

**示例 1：**

```
输入：head = [1,2,3,4,5], left = 2, right = 4
输出：[1,4,3,2,5]
```

**示例 2：**

```
输入：head = [5], left = 1, right = 1
输出：[5]
```

**约束条件：**

- 链表中节点数目为 `n`
- `1 <= n <= 500`
- `-500 <= Node.val <= 500`
- `1 <= left <= right <= n`

**进阶**：你可以使用一趟扫描完成反转吗？

## 题目分析

### 算法思路

使用 **头插法（穿针引线法）** 进行原地反转，一次遍历完成：

1. 创建 `dummy` 节点，简化处理（当 `left = 1` 即从头反转时）。
2. 用 `pre` 指针走到第 `left - 1` 个节点（待反转区域的前驱）。
3. 初始化 `cur = pre.Next`（待反转区域的第一个节点）。
4. 执行 `right - left` 次头插操作：
   - 每次将 `cur.Next` 节点从原位置"拔出"。
   - 插入到 `pre` 之后（即待反转区域的最前面）。
5. 返回 `dummy.Next`。

**头插法示例**（`head = [1,2,3,4,5], left=2, right=4`）：

```
初始：pre->1, cur->2, 2->3->4->5
第1次：将3插入到pre后: 1->3->2->4->5
第2次：将4插入到pre后: 1->4->3->2->5
```

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历。
- **空间复杂度**：O(1)，只使用常数个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/61-reverse-linked-list-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="反转链表 II - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseBetween(head *ListNode, left int, right int) *ListNode {
    // Dummy 节点，简化头节点被反转的情况
    dummy := &ListNode{Next: head}
    pre := dummy

    // pre 走到第 left-1 个节点
    for i := 0; i < left-1; i++ {
        pre = pre.Next
    }

    // cur 指向待反转区域的第一个节点
    cur := pre.Next

    // 执行 right-left 次头插法操作
    for i := 0; i < right-left; i++ {
        // 将 cur.Next 节点"拔出"
        move := cur.Next
        cur.Next = move.Next
        // 插入到 pre 之后
        move.Next = pre.Next
        pre.Next = move
    }

    return dummy.Next
}
```
