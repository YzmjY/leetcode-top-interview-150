# 109. 排序链表

## 题目描述

给你链表的头结点 `head`，请将其按**升序**排列并返回**排序后的链表**。

**示例 1：**

```
输入：head = [4,2,1,3]
输出：[1,2,3,4]
```

**示例 2：**

```
输入：head = [-1,5,3,4,0]
输出：[-1,0,3,4,5]
```

**示例 3：**

```
输入：head = []
输出：[]
```

**约束条件：**

- 链表中节点的数目在范围 `[0, 5 * 10^4]` 内
- `-10^5 <= Node.val <= 10^5`

**进阶：** 你可以在 O(n log n) 时间复杂度和常数级空间复杂度下，对链表进行排序吗？

## 题目分析

题目要求在 O(n log n) 时间排序链表。对于链表，归并排序（自顶向下的分治法）是最自然的选择，因为链表不能随机访问，不适合快排的 partition 操作。

**自顶向下归并排序步骤：**

1. **分割**：使用快慢指针找到链表中点，断开为两半
2. **递归排序**：分别对左右两半递归排序
3. **合并**：合并两个已排序的链表

**自底向上归并排序**（实现 O(1) 空间）：

1. 按步长从 1, 2, 4, 8... 迭代
2. 每次将链表按步长分组，两两合并
3. 直到步长 >= 链表长度

**时间复杂度：** O(n log n)。

**空间复杂度：** 
- 自顶向下递归：O(log n)，递归栈
- 自底向上迭代：O(1)


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/109-sort-list-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="排序链表 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

// sortList 自顶向下归并排序链表
func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }

    // 1. 快慢指针找中点并断开
    slow, fast := head, head.Next
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    mid := slow.Next
    slow.Next = nil

    // 2. 递归排序两边
    left := sortList(head)
    right := sortList(mid)

    // 3. 合并两个有序链表
    return merge(left, right)
}

// merge 合并两个有序链表
func merge(l1, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for l1 != nil && l2 != nil {
        if l1.Val < l2.Val {
            cur.Next = l1
            l1 = l1.Next
        } else {
            cur.Next = l2
            l2 = l2.Next
        }
        cur = cur.Next
    }
    if l1 != nil {
        cur.Next = l1
    }
    if l2 != nil {
        cur.Next = l2
    }
    return dummy.Next
}

// sortListBottomUp 自底向上迭代归并排序（O(1) 额外空间）
func sortListBottomUp(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }

    // 计算链表长度
    length := 0
    for cur := head; cur != nil; cur = cur.Next {
        length++
    }

    dummy := &ListNode{Next: head}

    // 按步长迭代合并
    for step := 1; step < length; step <<= 1 {
        prev := dummy
        cur := dummy.Next

        for cur != nil {
            // 分割出第一段
            left := cur
            right := split(left, step)
            cur = split(right, step) // cur 指向下一段的起点

            // 合并两段，接到 prev 后面
            prev.Next = merge(left, right)
            for prev.Next != nil {
                prev = prev.Next
            }
        }
    }
    return dummy.Next
}

// split 从 head 开始走 step 步，断开并返回下一段的头
func split(head *ListNode, step int) *ListNode {
    if head == nil {
        return nil
    }
    for i := 1; head.Next != nil && i < step; i++ {
        head = head.Next
    }
    next := head.Next
    head.Next = nil
    return next
}

// buildList 辅助函数：从切片构建链表
func buildList(vals []int) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for _, v := range vals {
        cur.Next = &ListNode{Val: v}
        cur = cur.Next
    }
    return dummy.Next
}

// printList 辅助函数：打印链表
func printList(head *ListNode) {
    for head != nil {
        fmt.Printf("%d ", head.Val)
        head = head.Next
    }
    fmt.Println()
}

func main() {
    head := buildList([]int{4, 2, 1, 3})
    sorted := sortList(head)
    printList(sorted) // 1 2 3 4

    head2 := buildList([]int{-1, 5, 3, 4, 0})
    sorted2 := sortListBottomUp(head2)
    printList(sorted2) // -1 0 3 4 5
}
```
