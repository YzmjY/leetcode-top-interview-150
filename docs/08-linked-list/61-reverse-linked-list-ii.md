# 61. 反转链表 II

## 题目描述

给你单链表的头指针 `head` 和两个整数 `left` 和 `right`，其中 `left <= right`。请你反转从位置 `left` 到位置 `right` 的链表节点，返回 **反转后的链表**。

**示例 1：**

```
输入：head = [1,2,3,4,5], left = 2, right = 4
输出：[1,4,3,2,5]
```

**示例 2：**

```
输入：head = [5], left = 1, right = 1
输出：[5]
```

**约束条件：**

- 链表中节点数目为 `n`
- `1 <= n <= 500`
- `-500 <= Node.val <= 500`
- `1 <= left <= right <= n`

**进阶**：你可以使用一趟扫描完成反转吗？

## 题目分析

### 算法思路

**核心思路：** 朴素做法是：先走到第 `left-1` 个节点，记下它（作为区间前驱），把第 `left..right` 这一段单独反转，最后把它两端的指针重新接好。这需要同时记住「前驱」「区间原左端」「区间原右端」「右端的后继」四个位置，稍不留神就会接错。

更简洁的是 **头插法（穿针引线）**：不把区间摘下来，而是留在原链上，**每次从区间里拿出一个节点，插到区间最前面**。插 `right - left` 次之后，区间自然就逆序了，且整个过程只需要三个指针。

具体地：`pre` 指向区间前驱，`cur = pre.Next` 是区间的第一个节点（反转后会变成区间的**末尾**）。每一轮把 `cur.Next` 这个节点「拔」出来，插到 `pre` 之后——它就成了区间的新头部。

**算法步骤：**

1. `dummy := &ListNode{Next: head}`，`pre := dummy`。
2. `pre` 向后走 `left - 1` 步，指向第 `left-1` 个节点（`dummy` 视为第 0 个节点；`left == 1` 时 `pre` 就停在 `dummy`，这正是不需要特判头节点的原因）。
3. `cur := pre.Next`，指向待反转区间的第一个节点。
4. 重复 `right - left` 次：
   - `move := cur.Next` —— 需要前插的节点；
   - `cur.Next = move.Next` —— 把它从原位摘除；
   - `move.Next = pre.Next` —— 让它指向当前区间头部；
   - `pre.Next = move` —— 把它接到 `pre` 之后，成为新的区间头部。
5. 返回 `dummy.Next`。

**头插法示例**（`head = [1,2,3,4,5], left=2, right=4`，`pre` 指向 1、`cur` 指向 2，共执行 `4-2=2` 次）：

```
初始：1(pre) -> 2(cur) -> 3 -> 4 -> 5
第1次：将3插入到pre后: 1 -> 3 -> 2 -> 4 -> 5
第2次：将4插入到pre后: 1 -> 4 -> 3 -> 2 -> 5
```

**为什么正确（循环不变量）：** 记第 `t` 次头插操作完成后的状态（`t` 从 0 到 `right-left`）。**不变量：`pre.Next` 起长度为 `t+1` 的一段，恰好是原区间前 `t+1` 个节点（即 `left..left+t`）的逆序；这一段之后紧跟着原链表的剩余部分（从 `left+t+1` 开始）；且 `cur` 指向这段逆序子链的末尾（也就是原区间的第一个节点）。**

- `t = 0`（尚未执行任何操作）：`pre.Next` 起长度为 1 的一段就是原区间第一个节点，逆序平凡成立，`cur` 正指向它，不变量成立。
- 归纳步：此时 `cur.Next = move` 是剩余部分的第一个节点，即原区间的第 `left+t+1` 个。先做 `cur.Next = move.Next` 把它摘出（剩余部分仍保持原有顺序），再把它插到 `pre.Next` 之前作为新的头部。由于原来 `pre.Next` 起的 `t+1` 个节点已经逆序，把原区间的第 `left+t+1` 个节点放到它们前面，得到的恰好是 `left..left+t+1` 的逆序段；`cur` 仍指向这段的末尾（原 `left`），不变量保持。
- 执行 `right - left` 次后（`t = right-left`），逆序段的长度是 `right-left+1`，正好覆盖 `left..right`；区间之后的剩余部分顺序不变，`pre` 之前的部分也没动过。因此整个链表从 `dummy.Next` 读出来就是「前段原样 + 区间逆序 + 后段原样」。

### 复杂度分析

- **时间复杂度**：O(n)。`pre` 走 `left-1` 步，头插执行 `right-left` 次，每次都是常数次指针操作，合计 O(n)（区间右端可到链尾）。
- **空间复杂度**：O(1)，只用了 `dummy`、`pre`、`cur`、`move` 四个指针。

### 易错点 / 边界情况

- **`left == 1` 必须靠 `dummy` 处理**：如果不用 `dummy`，头部被反转时要额外记录并更新头指针。用 `dummy` 后，`pre` 从 `dummy` 出发，走 `left-1 = 0` 步仍指向 `dummy`，后续逻辑完全一致。
- **头插的循环次数是 `right - left`，不是 `right - left + 1`**：区间的第一个节点本来就已经在 `pre` 之后，只需要再插入剩余 `right-left` 个节点。写成 `+1` 次会多插一个区间外的节点，链表被破坏。
- **四步指针操作的顺序不能改**：必须先用 `move := cur.Next` 记住节点，再 `cur.Next = move.Next` 把它摘出来，然后 `move.Next = pre.Next` 指向当前头部，最后 `pre.Next = move`。如果先把 `move.Next` 指向 `cur`（第一次恰好也对）而不是 `pre.Next`，第二次插入就会把 `cur` 又接到前面，破坏结构。
- **`cur` 全程不用移动**：它始终指向区间的原第一个节点，也就是逆序段的末尾。每次 `cur.Next` 被改写后指向的是新的待摘节点，所以循环里只管操作 `cur.Next` 即可。如果额外写 `cur = cur.Next`，反而会丢掉位置。
- **`left == right` 时循环执行 0 次**，链表原样返回，天然正确。
- **不要复制节点的值**：题目要求实际交换节点（通过改指针实现），不能只交换 `Val`。头插法改的是指针，符合要求。
- **返回 `dummy.Next`**：`dummy` 只是哨兵，不能返回它；也不要在 `left == 1` 时误返回原本的 `head`（它此刻可能已经不在链表头部了）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/61-reverse-linked-list-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="反转链表 II - 交互演示">
</iframe>

## Go 代码实现

```go
// ListNode 链表节点定义
type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseBetween(head *ListNode, left int, right int) *ListNode {
    // Dummy 节点，简化头节点被反转的情况
    dummy := &ListNode{Next: head}
    pre := dummy

    // pre 走到第 left-1 个节点
    for i := 0; i < left-1; i++ {
        pre = pre.Next
    }

    // cur 指向待反转区域的第一个节点
    cur := pre.Next

    // 执行 right-left 次头插法操作
    for i := 0; i < right-left; i++ {
        // 将 cur.Next 节点"拔出"
        move := cur.Next
        cur.Next = move.Next
        // 插入到 pre 之后
        move.Next = pre.Next
        pre.Next = move
    }

    return dummy.Next
}
```
