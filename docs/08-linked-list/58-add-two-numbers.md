# 58. 两数相加

## 题目描述

给你两个 **非空** 的链表，表示两个非负的整数。它们每位数字都是按照 **逆序** 的方式存储的，并且每个节点只能存储 **一位** 数字。

请你将两个数相加，并以相同形式返回一个表示和的链表。

你可以假设除了数字 0 之外，这两个数都不会以 0 开头。

**示例 1：**

```
输入：l1 = [2,4,3], l2 = [5,6,4]
输出：[7,0,8]
解释：342 + 465 = 807
```

**示例 2：**

```
输入：l1 = [0], l2 = [0]
输出：[0]
```

**示例 3：**

```
输入：l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
输出：[8,9,9,9,0,0,0,1]
```

**约束条件：**

- 每个链表中的节点数在范围 `[1, 100]` 内
- `0 <= Node.val <= 9`
- 题目数据保证列表表示的数字不含前导零

## 题目分析

### 算法思路

模拟加法竖式计算过程，逐位相加并处理进位：

1. 使用 `dummy` 节点简化结果链表的构建。
2. 遍历两个链表，同时维护一个 `carry` 变量记录进位。
3. 每一步：
   - 取出两个节点当前位的值（如果已到末尾则为 0）。
   - 计算 `sum = val1 + val2 + carry`。
   - 新节点的值为 `sum % 10`，进位为 `sum / 10`。
4. 遍历结束后，如果还有进位（`carry > 0`），需要额外添加一个节点。

**注意事项**：链表是逆序存储的（低位在前，高位在后），这恰好与笔算加法从低位开始的习惯一致，无需额外反转。

### 复杂度分析

- **时间复杂度**：O(max(n, m))，其中 n、m 分别为两个链表的长度。遍历到较长的链表结束。
- **空间复杂度**：O(max(n, m))，结果链表的长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/58-add-two-numbers-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="两数相加 - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    // Dummy 节点，简化结果链表的构建
    dummy := &ListNode{}
    cur := dummy
    carry := 0 // 进位

    // 只要还有节点或进位未处理完，就继续循环
    for l1 != nil || l2 != nil || carry > 0 {
        sum := carry

        if l1 != nil {
            sum += l1.Val
            l1 = l1.Next
        }
        if l2 != nil {
            sum += l2.Val
            l2 = l2.Next
        }

        // 当前位的值 = sum % 10
        cur.Next = &ListNode{Val: sum % 10}
        cur = cur.Next

        // 进位 = sum / 10
        carry = sum / 10
    }

    return dummy.Next
}
```
