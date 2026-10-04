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

**核心思路：** 先解决「怎么翻转 k 个节点」，再解决「怎么把各组串起来」。

- 翻转组内节点用 **头插法**，与第 61 题完全一样：把 `pre` 放在组的前驱位置，`cur` 指向组内第一个节点，每轮把 `cur.Next` 拔出来插到 `pre` 之后，执行 `k-1` 次后这一组就逆序了。
- 「串起来」的关键是：**翻转之前先确认剩余节点是否够 k 个**。题目要求不足 k 个时保持原顺序，所以必须先用一个探测指针从组前驱往后数 k 个节点；数不满就直接结束，后面的部分原封不动。

**算法步骤：**

变量约定：`dummy` 是哨兵，`pre` 指向**当前待翻转组的前驱**，`head` 指向当前待翻转组的第一个节点（初始为整条链的头）。

1. `dummy := &ListNode{Next: head}`，`pre := dummy`。
2. 只要 `head != nil`，循环：
   - **探测**：`tail := pre`，循环 k 次 `tail = tail.Next`；若中途 `tail == nil`，说明剩余节点不足 k 个，直接返回 `dummy.Next`。
   - 记下下一组的起点：`nextGroup := tail.Next`。
   - **翻转**：`cur := pre.Next`，执行 `k-1` 次头插（`move := cur.Next; cur.Next = move.Next; move.Next = pre.Next; pre.Next = move`）。
   - **推进**：翻转后本组的末尾是 `cur`，因此 `pre = cur`（成为下一组的前驱），`head = nextGroup`。
3. 返回 `dummy.Next`。

**头插法翻转步骤示例**（k=3）：

```
pre -> 1 -> 2 -> 3 -> rest

第一轮头插：pre -> 2 -> 1 -> 3 -> rest
第二轮头插：pre -> 3 -> 2 -> 1 -> rest
```

**为什么正确（循环不变量）：** **外层循环每轮开始时：从 `dummy.Next` 读出的链表 =「前面若干组的逆序结果」+「尚未处理的剩余链表」；其中已处理部分全部正确，`pre` 指向已处理部分的最后一个节点，`head` 指向剩余部分的第一个节点（也就是下一组的第一个节点）。**

- **探测循环保证不越界翻转**：`tail` 从 `pre` 出发数 k 步，恰好落在本组第 k 个节点上（若存在）。若数不满 k 个就返回，此时剩余部分没有被任何操作触碰，保持原顺序，符合题目要求。
- **内层头插的正确性**：与第 61 题的论证相同——每执行一次，`pre` 之后逆序段的长度增加 1；执行 `k-1` 次后，`pre` 之后的 k 个节点恰好是原组 k 个节点的逆序。
- **推进的正确性**：翻转前`tail` 是本组的第 k 个节点，翻转后它变成了本组的第一个节点；而 `cur` 是本组的第一个节点，翻转后变成了最后一个节点。因此 `pre = cur` 正好让 `pre` 停在已处理部分的末尾，下一轮的探测从它开始，不变量保持。
- 当 `head` 变为 `nil` 时所有节点都已成组处理完，`dummy.Next` 即为答案。

### 复杂度分析

- **时间复杂度**：O(n)。每个节点在探测循环里被访问一次、在头插里被移动一次，都是常数次指针操作；组数约为 `n/k`，总工作量与 n 成正比。
- **空间复杂度**：O(1)。只使用了 `dummy`、`pre`、`head`、`tail`、`nextGroup`、`cur`、`move` 这些指针（`dummy` 是常数个节点）。

### 易错点 / 边界情况

- **必须先探测再翻转**：探测循环让 `tail` 从 `pre` 走 k 步。写成「从 `head` 走 `k-1` 步」也等价，但要保证最终检查的是「第 k 个节点是否存在」，否则会把不足一组的部分也翻转。
- **头插次数是 `k-1`**：组内第一个节点本来就在 `pre` 之后，只需要把后面 k-1 个节点依次插到最前面。写成 `k` 次会从下一组借一个节点过来，链表结构被破坏。
- **`pre` 要更新为 `cur`，不是 `tail`**：翻转后 `cur`（原组第一个节点）是本组的末尾，而 `tail`（原组最后一个节点）变成了本组的**开头**。若写成 `pre = tail`，`pre` 会落在本组开头而不是末尾，下一组的起点随之错位，链表会被拆坏。
- **`k == 1` 的退化情况**：内层头插执行 0 次，但探测循环仍会正常走 1 步、`pre` 前移一个节点，链表原样返回。逻辑不需要特判。
- **`k` 等于链表长度**：整个链表翻转，`tail` 停在尾节点，`nextGroup == nil`，`head` 变为 `nil`，循环退出，返回 `dummy.Next`。
- **用 `dummy` 处理头节点变化**：整条链的前 k 个节点会被翻转，头节点会变，没有 `dummy` 就得额外维护头指针。
- **返回 `dummy.Next` 而不是 `head`**：`head` 在循环中已经被推到链表末尾附近，不再是头节点。
- **不能只交换节点的值**：题目明确要求实际进行节点交换，头插法改的是指针，符合要求。
- **代码中 `pre.Next = head` 是冗余但不影响的赋值**：头插结束后 `cur.Next`（即 `pre.Next`）已经等于 `nextGroup`，这次赋值是重复的。它不会造成错误，理解时可以忽略。


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
