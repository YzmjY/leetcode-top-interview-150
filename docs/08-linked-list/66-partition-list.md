# 66. 分隔链表

## 题目描述

给你一个链表的头节点 `head` 和一个特定值 `x`，请你对链表进行分隔，使得所有 **小于** `x` 的节点都出现在 **大于或等于** `x` 的节点之前。

你应当 **保留** 两个分区中每个节点的初始相对位置。

**示例 1：**

```
输入：head = [1,4,3,2,5,2], x = 3
输出：[1,2,2,4,3,5]
```

**示例 2：**

```
输入：head = [2,1], x = 2
输出：[1,2]
```

**约束条件：**

- 链表中节点的数目在范围 `[0, 200]` 内
- `-100 <= Node.val <= 100`
- `-200 <= x <= 200`

## 题目分析

### 算法思路

使用 **双链表** 拆分再合并的策略：

1. 创建两个 Dummy 节点，分别用于构建两条链：
   - `smallDummy`：存储所有 `val < x` 的节点。
   - `largeDummy`：存储所有 `val >= x` 的节点。
2. 遍历原链表，根据节点值将每个节点连接到对应的链尾。
3. 遍历结束后：
   - 将 `largeDummy.Next` 的末尾置为 `nil`（断开可能存在的环）。
   - 将 `smallTail.Next` 指向 `largeDummy.Next`，拼接两条链表。
4. 返回 `smallDummy.Next`。

**为什么最后要将 large 链尾置为 nil？**

因为原链表中 `largeTail` 节点的 `Next` 可能还指向某个 `small` 链中的节点，如果不置 nil 可能导致环。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历。
- **空间复杂度**：O(1)，只使用常数个指针，不创建新节点。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/66-partition-list-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="分隔链表 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func partition(head *ListNode, x int) *ListNode {
    // 两个 Dummy 节点，分别作为小链表和大链表的哨兵
    smallDummy := &ListNode{}
    largeDummy := &ListNode{}
    small, large := smallDummy, largeDummy

    // 遍历原链表，分配到两条链
    for head != nil {
        if head.Val < x {
            small.Next = head
            small = small.Next
        } else {
            large.Next = head
            large = large.Next
        }
        head = head.Next
    }

    // 断开大链表尾部可能的环
    large.Next = nil
    // 拼接小链表和大链表
    small.Next = largeDummy.Next

    return smallDummy.Next
}
```
