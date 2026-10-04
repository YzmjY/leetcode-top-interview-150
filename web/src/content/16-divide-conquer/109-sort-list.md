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

**核心思路：**

题目要求在 O(n log n) 时间排序链表。对于数组，快排、堆排都可以原地进行；但链表不能随机访问，快排的 partition 需要来回跳转，代价很高。归并排序只需要顺序扫描、且「合并两个有序链表」这一步对链表极其自然（只改指针、不需要额外数组），因此**归并排序是链表排序的首选**。

归并排序有自顶向下（递归）与自底向上（迭代）两种写法，后者可以做到 O(1) 额外空间。

**自顶向下归并排序步骤：**

1. **分割**：使用快慢指针找到链表中点，断开为两半
2. **递归排序**：分别对左右两半递归排序
3. **合并**：合并两个已排序的链表

其中「合并两个有序链表」的做法是：建一个哨兵 `dummy`，用 `cur` 依次接上 `l1`、`l2` 中较小的节点，某一方走完后把另一方整段接到末尾。

**自底向上归并排序**（实现 O(1) 空间）：

1. 先遍历一遍求出链表长度 `length`。
2. 按步长 `step = 1, 2, 4, 8, ...` 迭代；每一轮把链表按 `step` 个节点一段切分，相邻两段做一次合并。
3. 当 `step >= length` 时结束（此时整个链表已经有序）。

在每一轮中，用 `split(head, step)` 切出长度为 `step` 的第一段并返回第二段的头，再做一次 `merge`；合并后的整段接到 `prev` 之后，`prev` 走到该段末尾，继续处理后面的段。

**为什么正确（正确性论证）：**

- **归并排序的一般性**：对链表长度 n 归纳。n ≤ 1 时天然有序；n > 1 时，算法把链表分成两段分别递归排序（归纳假设保证各自有序），再通过 `merge` 把两条有序链合成一条有序链，故最终整体有序。
- **`merge` 的正确性**：设两条输入链非递减。每次取 `l1`、`l2` 当前的较小者接到结果尾部，未取的那个仍是所在链的最小值，取出的节点一定不大于两条链中所有剩余节点，因此结果非递减；循环结束时一方为空，剩下的整段一定不小于已接好的部分，直接接上即可。
- **自底向上的正确性**：第 `step` 轮开始前，链表被切成长度为 `step` 的有序段（归纳起点：`step=1` 时每个单节点自有序）；本轮把相邻两段合并成长度 `2*step` 的有序段；当 `step >= length` 时全链就是一个有序段。
- **分割不丢节点、不死循环**：`sortList` 中快慢指针初始化为 `slow, fast := head, head.Next`，保证偶数长度时左半比右半短，且 n=2 时能正确拆成 1+1；`split` 在到达第 `step` 个节点处断开，返回下一段起点，两个返回值恰好划分出连续两段、互不重叠。

**时间复杂度：** O(n log n)。自顶向下每层合并总代价 O(n)，共 log n 层；自底向上步长翻倍，也是 log n 轮、每轮 O(n)。

**空间复杂度：** 
- 自顶向下递归：O(log n)，递归栈
- 自底向上迭代：O(1)（只用了常数个指针；注意这里不计待排序节点本身）

**易错点 / 边界情况：**

- **空链表与单节点**：必须先判断 `head == nil || head.Next == nil` 直接返回，否则快慢指针会取到 `nil` 节点。
- **快慢指针的初始化**：`slow, fast := head, head.Next`（而不是都从 `head` 出发）。若从 `head` 出发，n=2 时 `mid` 会取到 `nil`，左半仍是整条链，导致无限递归。
- **合并比较用 `<`**：相等时优先取 `l1`，可以保持稳定性；用 `<=` 也能排序正确，但会破坏稳定。
- **自底向上的 `split` 语义**：从 `head` 出发只需前进 `step-1` 步就到达第 `step` 个节点，代码里循环条件写作 `i < step`（`i` 从 1 开始）正是这个意思；写成前进 `step` 步会多切一个节点。
- **自底向上每轮结束后**：`prev` 必须走到合并段的末尾再继续，否则链表会接错。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/109-sort-list-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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

// split 从 head 出发前进 step-1 步到达第 step 个节点，断开并返回下一段的头
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
