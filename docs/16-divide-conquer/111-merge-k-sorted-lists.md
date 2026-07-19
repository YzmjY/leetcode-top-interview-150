# 111. 合并 K 个升序链表

## 题目描述

给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

**示例 1：**

```
输入：lists = [[1,4,5],[1,3,4],[2,6]]
输出：[1,1,2,3,4,4,5,6]
解释：链表数组如下：
[
  1->4->5,
  1->3->4,
  2->6
]
将它们合并到一个有序链表中得到。
1->1->2->3->4->4->5->6
```

**示例 2：**

```
输入：lists = []
输出：[]
```

**示例 3：**

```
输入：lists = [[]]
输出：[]
```

**约束条件：**

- `k == lists.length`
- `0 <= k <= 10^4`
- `0 <= lists[i].length <= 500`
- `-10^4 <= lists[i][j] <= 10^4`
- `lists[i]` 按**升序**排列
- `lists[i].length` 的总和不超过 `10^4`

## 题目分析

本题有三种主流解法。

**方法一：分治合并（两两合并）**

类似归并排序的思想，将 K 个链表分治合并。

```
mergeKLists(lists, l, r):
    if l == r: return lists[l]
    mid = (l + r) / 2
    left = mergeKLists(lists, l, mid)
    right = mergeKLists(lists, mid+1, r)
    return mergeTwo(left, right)
```

- 时间复杂度：O(N log K)，N 为所有节点总数，K 为链表数。每层合并 O(N)，共 log K 层。
- 空间复杂度：O(log K)，递归栈。

**方法二：优先队列（最小堆）**

将 K 个链表的头节点放入最小堆，每次弹出最小的节点加入结果链表，然后将该节点的 next 入堆。

- 时间复杂度：O(N log K)，每个节点入堆出堆各一次
- 空间复杂度：O(K)，堆的大小

**方法三：逐一两两合并**

顺序合并：依次将第 i 个链表与当前结果合并。时间复杂度 O(K * N)，不如分治法。

**推荐方案：** 分治合并（思路清晰，代码简洁）或优先队列（迭代实现，无递归开销）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/111-merge-k-sorted-lists-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="合并 K 个升序链表 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import (
    "container/heap"
    "fmt"
)

// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

// ========== 方法一：分治合并 ==========

// mergeKLists 分治合并 K 个升序链表
func mergeKLists(lists []*ListNode) *ListNode {
    if len(lists) == 0 {
        return nil
    }

    var divide func(l, r int) *ListNode
    divide = func(l, r int) *ListNode {
        if l == r {
            return lists[l]
        }
        mid := l + (r-l)/2
        left := divide(l, mid)
        right := divide(mid+1, r)
        return mergeTwo(left, right)
    }

    return divide(0, len(lists)-1)
}

// mergeTwo 合并两个有序链表
func mergeTwo(l1, l2 *ListNode) *ListNode {
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

// ========== 方法二：优先队列（最小堆） ==========

// MinHeap 最小堆实现
type MinHeap []*ListNode

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i].Val < h[j].Val }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MinHeap) Push(x interface{}) {
    *h = append(*h, x.(*ListNode))
}

func (h *MinHeap) Pop() interface{} {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

// mergeKListsHeap 优先队列解法
func mergeKListsHeap(lists []*ListNode) *ListNode {
    h := &MinHeap{}
    heap.Init(h)

    // 所有非空链表头节点入堆
    for _, head := range lists {
        if head != nil {
            heap.Push(h, head)
        }
    }

    dummy := &ListNode{}
    cur := dummy

    for h.Len() > 0 {
        node := heap.Pop(h).(*ListNode)
        cur.Next = node
        cur = cur.Next
        if node.Next != nil {
            heap.Push(h, node.Next)
        }
    }

    return dummy.Next
}

// ========== 辅助函数 ==========

func buildList(vals []int) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for _, v := range vals {
        cur.Next = &ListNode{Val: v}
        cur = cur.Next
    }
    return dummy.Next
}

func printList(head *ListNode) {
    for head != nil {
        fmt.Printf("%d ", head.Val)
        head = head.Next
    }
    fmt.Println()
}

func main() {
    lists := []*ListNode{
        buildList([]int{1, 4, 5}),
        buildList([]int{1, 3, 4}),
        buildList([]int{2, 6}),
    }
    result := mergeKLists(lists)
    printList(result) // 1 1 2 3 4 4 5 6

    lists2 := []*ListNode{
        buildList([]int{1, 4, 5}),
        buildList([]int{1, 3, 4}),
        buildList([]int{2, 6}),
    }
    result2 := mergeKListsHeap(lists2)
    printList(result2) // 1 1 2 3 4 4 5 6
}
```
