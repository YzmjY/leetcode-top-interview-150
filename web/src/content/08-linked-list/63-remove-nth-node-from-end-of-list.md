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

**核心思路：** 最直接的做法是两趟扫描：第一趟数出链表长度 `L`，第二趟从头走 `L - n` 步，删掉下一个节点。题目问的是「能否一趟扫描」，于是要求我们在还没数清长度时就知道目标位置。

关键观察：**倒数第 n 个节点，就是正数第 `L - n + 1` 个节点**。想删除它，需要拿到它的**前驱**，即倒数第 `n+1` 个节点。如果让两个指针保持固定的间隔，当快指针走到链表末尾时，慢指针自然就落在那个位置——这正是快慢指针的用法。

具体地，让 `fast` 先往前走 `n+1` 步，然后 `slow` 和 `fast` 同步前进。当 `fast` 走到 `nil`（走完了整个链表）时，`slow` 恰好停在倒数第 `n+1` 个节点上——因为它始终落后 `fast` 固定的 `n+1` 步。

再用一个 **dummy** 哨兵让 `slow` 有起步的空间：如果需要删除的是头节点（`n == L`），`slow` 必须能停在「头节点的前驱」这个位置上，而头节点没有真正的前驱，`dummy` 正好充当它。

**算法步骤：**

1. `dummy := &ListNode{Next: head}`，`fast, slow := dummy, dummy`。
2. `fast` 先走 `n+1` 步：`for i := 0; i <= n; i++ { fast = fast.Next }`。
3. `fast` 与 `slow` 同步前进，直到 `fast == nil`：`for fast != nil { fast = fast.Next; slow = slow.Next }`。
4. 此时 `slow` 指向待删节点的前驱，执行 `slow.Next = slow.Next.Next`。
5. 返回 `dummy.Next`。

**为什么正确：** 设链表长度为 `L`（`1 <= n <= L`）。`dummy` 位于头节点之前，可视为「第 0 个节点」，整条带哨兵的链共有 `L + 1` 个节点。

- **第 2 步不会越界**：`fast` 从 `dummy` 出发走 `n+1` 步，而 `n+1 <= L+1`，所以最多正好走到尾节点之后的 `nil`，不会访问空的 `Next`。
- **间隔保持**：从第 3 步开始，两个指针每次都前进 1 步，因此它们之间的节点数（`fast` 领先 `slow` 的步数）始终是 `n+1`，保持不变。
- **终点的位置**：`fast` 从 `dummy` 出发总共走了 `L+1` 步到达 `nil`，其中前 `n+1` 步是第 2 步走的。因此在第 3 步中 `slow` 也正好走了 `L+1-(n+1) = L-n` 步，停在从 `dummy` 数起的第 `L-n` 个节点上，即链表正数第 `L-n` 个节点（`dummy` 是第 0 个）。它的下一个节点是正数第 `L-n+1` 个——由 `L-n+1 = L-(n-1)` 可知它正是倒数第 `n` 个节点。所以 `slow` 是待删节点的前驱，`slow.Next = slow.Next.Next` 精确地删掉目标节点。
- **`dummy` 的作用**：当 `n == L` 时 `slow` 停在 `dummy` 上，删除的是 `dummy.Next`，即原来的头节点，最后返回 `dummy.Next` 就是新的头节点，无需任何特判。

### 复杂度分析

- **时间复杂度**：O(L)。`fast` 一共走了 `L+1` 步，每个节点被常数次访问；只遍历了一遍链表。
- **空间复杂度**：O(1)，只使用了 `dummy`、`fast`、`slow` 三个指针。

### 易错点 / 边界情况

- **`fast` 要先走 `n+1` 步而不是 `n` 步**：这是本题最容易错的地方。走 `n` 步的话，同步前进结束时 `slow` 会落在**待删节点本身**上，而不是它的前驱；此时你手里没有前驱指针，无法完成删除。
- **同步前进的结束条件是 `fast == nil`**：若写成 `fast.Next != nil`，`slow` 会多停在一个节点之前，删除位置整体前移一位。牢记「快指针走到尾后」这个终止点。
- **删除的是 `slow.Next`，不是 `slow`**：`slow` 是前驱，被删掉的是它的后继节点。
- **`dummy` 不可省**：删除头节点时，`slow` 必须能停在 `dummy` 上；没有哨兵就得单独写一段「删除头节点」的分支，容易漏。
- **返回 `dummy.Next`**：当 `n == L` 时头节点已被删除，返回原来的 `head` 会得到一个已经被摘掉的节点。
- **删除后不必手动断开被删节点的 `Next`**：`slow.Next = slow.Next.Next` 之后被删节点已经不在链上，虽然它的 `Next` 仍指向旧后继，但不影响结果；在 Go 里也没有内存泄漏的负担。
- **单节点链表**（示例 2）：`n = 1`，`fast` 从 `dummy` 走 2 步到达 `nil`，`slow` 停在 `dummy`，删除 `dummy.Next`，返回 `nil`。
- **约束保证 `1 <= n <= sz`**：因此不会出现「倒数第 n 个不存在」的情况；如果题目放宽这个约束，需要额外判断 `n` 是否超过链表长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/63-remove-nth-node-from-end-of-list-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
