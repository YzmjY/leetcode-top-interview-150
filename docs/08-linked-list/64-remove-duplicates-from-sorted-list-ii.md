# 64. 删除排序链表中的重复元素 II

## 题目描述

给定一个已排序的链表的头 `head`，**删除原始链表中所有重复数字的节点，只留下不同的数字**。返回已排序的链表。

**示例 1：**

```
输入：head = [1,2,3,3,4,4,5]
输出：[1,2,5]
```

**示例 2：**

```
输入：head = [1,1,1,2,3]
输出：[2,3]
```

**约束条件：**

- 链表中节点数目在范围 `[0, 300]` 内
- `-100 <= Node.val <= 100`
- 题目数据保证链表已经按升序排列

## 题目分析

### 算法思路

本题与"删除排序链表中的重复元素 I"的最大区别是：**重复元素要全部删除，一个不留**（而不是保留一个）。这导致头节点也可能被删除，因此需要 `dummy` 节点。

1. 创建 `dummy` 节点，`dummy.Next = head`。
2. 使用 `cur` 指针遍历，初始指向 `dummy`。
3. 检查 `cur.Next` 和 `cur.Next.Next` 是否存在且值相等：
   - 如果相等，说明存在重复值。用一个循环跳过所有重复节点。
   - 将 `cur.Next` 指向第一个不重复的节点（即跳过了所有重复节点）。
   - 如果不等，`cur` 正常前进一次。
4. 返回 `dummy.Next`。

**为什么需要 dummy 节点？**

因为头节点可能是重复的（如 `[1,1,1,2,3]`），头节点会被删除。`dummy` 使得删除头节点与删除中间节点逻辑一致。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：O(1)，只使用常数个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/64-remove-duplicates-from-sorted-list-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="删除排序链表中的重复元素 II - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func deleteDuplicates(head *ListNode) *ListNode {
    // Dummy 节点，处理头节点也可能被删除的情况
    dummy := &ListNode{Next: head}
    cur := dummy

    for cur.Next != nil && cur.Next.Next != nil {
        // 发现重复
        if cur.Next.Val == cur.Next.Next.Val {
            val := cur.Next.Val
            // 跳过所有值为 val 的节点
            for cur.Next != nil && cur.Next.Val == val {
                cur.Next = cur.Next.Next
            }
        } else {
            // 没有重复，正常前进
            cur = cur.Next
        }
    }

    return dummy.Next
}
```
