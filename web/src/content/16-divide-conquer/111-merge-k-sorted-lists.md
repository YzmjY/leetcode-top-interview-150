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

**核心思路：**

「合并两个有序链表」是链表题里最基本的操作（见 21 题）。本题的难点在于如何把 K 个链表合并得足够快：

- 如果一条一条往结果上并（方法三），越靠后的链表要越长的前缀被反复扫描；
- 如果每次从 K 个头节点里挑最小的（方法二），挑一次是 O(K)，总共 O(NK)，也不够好；
- 把「挑最小」交给**最小堆**（方法二），或把「多路合并」化成两两合并的**分治**（方法一），都能把每条链的贡献压到 log K 级别。

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

**为什么正确**：与归并排序同一套论证。对区间长度归纳：区间内只有一条链表时它本身有序；否则左右两半分别递归后都有序（归纳假设），`mergeTwo` 把两条有序链合成一条有序链，故整个区间有序。

- 时间复杂度：O(N log K)，N 为所有节点总数，K 为链表数。每一层把所有链表合并一遍，节点总数恒为 N，共 log K 层。
- 空间复杂度：O(log K)，递归栈。

**方法二：优先队列（最小堆）**

将 K 个链表的头节点放入最小堆，每次弹出最小的节点加入结果链表，然后将该节点的 next 入堆。

**为什么正确**：堆中始终保存每条链「尚未被取走的最小节点」。当前堆顶是全体剩余节点中的最小值，把它接到结果尾部后，用它的 `next` 顶替它，堆的不变量得以维持。反复取出即得到全局升序序列。

- 时间复杂度：O(N log K)，每个节点入堆、出堆各一次，每次 O(log K)
- 空间复杂度：O(K)，堆的大小

**方法三：逐一两两合并**

顺序合并：依次将第 i 个链表与当前结果合并。设 N 为所有节点总数、K 为链表数，第 i 次合并要扫描「已有结果 + 第 i 条链」，累计代价在最坏情况下为 O(K·N)（前面已合并的节点会被反复扫描），不如分治法。

**推荐方案：** 分治合并（思路清晰，代码简洁）或优先队列（迭代实现，无递归开销）。

**易错点 / 边界情况：**

- **`lists` 为空、或其中全是空链表**：分治入口要先判 `len(lists) == 0`，否则 `divide(0, -1)` 会越界；`mergeTwo(nil, nil)` 返回 `nil`，所以全空链表也能自然得到 `nil`。
- **分治的递归出口是 `l == r`**（区间只剩一条链），不要写成 `l >= r` 时返回 `nil`，否则会丢掉这条链。
- **`mergeTwo` 用哨兵节点**：避免为空结果单独特判头节点。
- **堆中只放非空头节点**：入堆前判断 `head != nil`；弹出后先用 `node.Next` 继续入堆，再把它接到结果上。
- **比较用 `<` 而非 `<=`**：相等时优先取第一条链的节点，结果更稳定。
- **合并会改写节点的 `Next`**：同一批节点不能被两个不同的合并过程复用（测试或验证时要用全新的链表）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/111-merge-k-sorted-lists-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
