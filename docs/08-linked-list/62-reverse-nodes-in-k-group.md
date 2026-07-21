# 62. K 个一组翻转链表

## 题目描述

给你链表的头节点 `head`，每 `k` 个节点一组进行翻转，请你返回修改后的链表。

`k` 是一个正整数，它的值小于或等于链表的长度。如果节点总数不是 `k` 的整数倍，那么请将最后剩余的节点保持原有顺序。

你不能只是单纯的改变节点内部的值，而是需要实际进行节点交换。

**示例 1：**

```
输入：head = [1,2,3,4,5], k = 2
输出：[2,1,4,3,5]
```

**示例 2：**

```
输入：head = [1,2,3,4,5], k = 3
输出：[3,2,1,4,5]
```

**约束条件：**

- 链表中的节点数目为 `n`
- `1 <= k <= n <= 5000`
- `0 <= Node.val <= 1000`

**进阶**：你可以设计一个只用 O(1) 额外内存空间的算法解决此问题吗？

## 题目分析

### 算法思路

使用 **Dummy + 分组 + 头插法** 的思路：

1. 创建 `dummy` 节点，指向头节点。
2. 使用 `pre` 指针标记当前分组的前驱节点（`pre` 指向待翻转组的前一个节点）。
3. 每轮：
   - 先用一个指针检查剩余节点是否足够 `k` 个。不够就结束。
   - 若足够，对 `pre` 后面的 `k` 个节点进行翻转。
   - 翻转使用**头插法**：将当前组中的节点依次插入到 `pre` 之后。
4. 翻转完成后更新 `pre` 到当前组的末尾（下一组的前驱）。

**头插法翻转步骤示例**（k=3）：

```
pre -> 1 -> 2 -> 3 -> rest

第一轮头插：pre -> 2 -> 1 -> 3 -> rest
第二轮头插：pre -> 3 -> 2 -> 1 -> rest
```

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问常数次。
- **空间复杂度**：O(1)，只用于常数个指针。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/62-reverse-nodes-in-k-group-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="K 个一组翻转链表 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseKGroup(head *ListNode, k int) *ListNode {
    // Dummy 节点，简化边界处理
    dummy := &ListNode{Next: head}
    pre := dummy

    for head != nil {
        // 检查剩余节点是否够 k 个
        tail := pre
        for i := 0; i < k; i++ {
            tail = tail.Next
            if tail == nil {
                return dummy.Next // 不够 k 个，直接返回
            }
        }

        // 保存下一组的起始节点
        nextGroup := tail.Next

        // 翻转当前组的 k 个节点（头插法）
        cur := pre.Next
        for i := 0; i < k-1; i++ {
            // 将 cur.Next 节点移到 pre 之后
            move := cur.Next
            cur.Next = move.Next
            move.Next = pre.Next
            pre.Next = move
        }

        // 更新 pre 和 head，准备下一组
        pre = cur
        head = nextGroup
        pre.Next = head
    }

    return dummy.Next
}
```
