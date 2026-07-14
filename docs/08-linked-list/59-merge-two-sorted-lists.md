# 59. 合并两个有序链表

## 题目描述

将两个升序链表合并为一个新的 **升序** 链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。

**示例 1：**

```
输入：l1 = [1,2,4], l2 = [1,3,4]
输出：[1,1,2,3,4,4]
```

**示例 2：**

```
输入：l1 = [], l2 = []
输出：[]
```

**示例 3：**

```
输入：l1 = [], l2 = [0]
输出：[0]
```

**约束条件：**

- 两个链表的节点数目范围是 `[0, 50]`
- `-100 <= Node.val <= 100`
- `l1` 和 `l2` 均按 **非递减顺序** 排列

## 题目分析

### 算法思路

使用**双指针 + Dummy 节点**的方法：

1. 创建一个 `dummy` 节点作为新链表的哨兵（简化边界处理）。
2. 使用 `cur` 指针指向当前新链表的末尾。
3. 比较 `l1` 和 `l2` 当前节点的值，将较小者连接到 `cur` 后面，并移动对应的指针。
4. 当其中一个链表遍历完毕后，将另一个链表的剩余部分直接连接到结果链表末尾。

**Dummy 节点的作用**：避免处理头节点为空的特殊情况，最后只需返回 `dummy.Next` 即可。

### 复杂度分析

- **时间复杂度**：O(n + m)，其中 n、m 分别两个链表的长度。每个节点被访问一次。
- **空间复杂度**：O(1)，只使用了常数个额外指针（不计算新链表本身）。

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    // Dummy 节点简化边界处理
    dummy := &ListNode{}
    cur := dummy

    // 双指针遍历两个链表
    for list1 != nil && list2 != nil {
        if list1.Val <= list2.Val {
            cur.Next = list1
            list1 = list1.Next
        } else {
            cur.Next = list2
            list2 = list2.Next
        }
        cur = cur.Next
    }

    // 将剩余的节点直接连接（至多一个链表非空）
    if list1 != nil {
        cur.Next = list1
    } else {
        cur.Next = list2
    }

    return dummy.Next
}
```
