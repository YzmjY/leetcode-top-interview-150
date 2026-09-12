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

**核心思路：** 一个偷懒的想法是「把链表排序」——但这样会打乱分区内节点的相对顺序，而题目明确要求**保留**初始相对位置，而且排序还需要 O(n log n)。

换个角度：题目要求的其实就是「把所有 `< x` 的节点移到前面，`>= x` 的移到后面，两侧内部各保持原顺序」。这正是**稳定分区**（stable partition）的语义。要在链表中「稳定」地做这件事，最自然的做法是：**准备两条链，一条收小节点、一条收大节点，遍历时按原顺序依次接到各自链尾，最后把两条链首尾相接。**

链表的尾插天生就是稳定的（按遍历顺序追加），所以相对顺序自然保持。用两个 `dummy` 哨兵分别作为两条链的头，`small`、`large` 分别指向两条链的尾，就能避免「第一条节点要特殊处理」的麻烦。

**算法步骤：**

1. `smallDummy := &ListNode{}`、`largeDummy := &ListNode{}`，`small := smallDummy`、`large := largeDummy`。
2. 遍历原链表：若 `head.Val < x`，把它接到小链表尾（`small.Next = head; small = small.Next`）；否则接到大链表尾（`large.Next = head; large = large.Next`）。然后 `head = head.Next` 继续。
3. 遍历结束后做两件事，**顺序不能反**：
   - `large.Next = nil`：把大链表的尾节点收口，断开它指向原链表中原后继的指针；
   - `small.Next = largeDummy.Next`：把小链表的尾接到大链表的头上。
4. 返回 `smallDummy.Next`。

**为什么正确：**

- **小链表内部保持原相对顺序**：遍历是按住原链表顺序进行的，每个 `< x` 的节点都按遇到它的先后被追加到 `small` 之后（尾插），所以小链表中节点的先后顺序与它们在原链表中的先后顺序一致。大链表同理。
- **分区性质成立**：拼接后，`smallDummy.Next` 起的所有节点都满足 `< x`，`largeDummy.Next` 起的所有节点都满足 `>= x`，且前者整体位于后者之前，正是题目要求的「所有小于 x 的节点都出现在大于或等于 x 的节点之前」。
- **节点一个不多一个不少**：每个原节点在遍历中被接入且仅被接入一条链，拼接只改变两条链之间的连接关系，不增删节点。因此结果包含全部原节点，只是重排了顺序。
- **`large.Next = nil` 的必要性**：大链表的尾节点在原链表中的后继，可能是一个**属于小链表**的节点（小链表恰好接在它后面时）。如果不把大链表尾的 `Next` 置空，拼接后那条链会绕回小链表，形成环或重复节点。例如示例 1 `[1,4,3,2,5,2], x=3`：小链是 `1→2→2`，大链是 `4→3→5`，而节点 `5`（大链尾）原本的后继正是小链中的最后一个 `2`。若不置空，结果会连成 `1→2→2→4→3→5→2→…`，陷入环。置空后大链尾不再指向任何节点，拼接得到的 `1→2→2→4→3→5` 才是正确的。
- **两种极端情况**：若所有节点都 `< x`，大链表为空（`largeDummy.Next == nil`），`large.Next = nil` 作用在 `largeDummy` 上相当于把空链收口，`small.Next = nil` 正确结束链表；若所有节点都 `>= x`，小链表为空，`small` 仍等于 `smallDummy`，`small.Next = largeDummy.Next` 让哨兵直接指向大链，返回 `smallDummy.Next` 同样正确。

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历处理每个节点；拼接是常数次指针操作。
- **空间复杂度**：O(1) 额外空间（不计结果链）。只用了两个 `dummy` 和两个尾指针；没有新建节点，连接的是原节点。

### 易错点 / 边界情况

- **`large.Next = nil` 必须写，而且要写在拼接之前**：这一行是本题最容易漏掉的地方，漏了就会产生环。注意操作对象是**大链表的尾指针 `large`**，而不是 `largeDummy`——`largeDummy` 是哨兵，它的 `Next` 正是大链表的头，置空会直接把整条大链丢掉。
- **拼接的是 `largeDummy.Next` 而不是 `largeDummy`**：`largeDummy` 是哨兵节点，不属于结果；要接的是它后面的第一条真实节点。
- **必须用尾插保持相对顺序**：如果图省事用头插（`small.Next = head` 但让 `head` 当小链表的头），小链表内部会逆序，违反「保留初始相对位置」的要求。
- **不要把 `head = head.Next` 写在接入之前**：需要先保存当前节点再前移，否则会丢掉节点。
- **`x` 与节点值的边界**：判断是 `head.Val < x`，等于 `x` 的节点归入大链表。`x` 可以小于所有值或大于所有值（约束给出 `-200 <= x <= 200`），两个极端都由上面的分析覆盖。
- **空链表**：循环不执行，`smallDummy.Next` 为 `nil`，返回 `nil`，正确。
- **不要新建节点**：题目要求「保留每个节点的初始相对位置」，隐含要操作原来的节点；新节点虽然值对，但会丢失节点身份，且多耗空间。
- **结果链表要检查没有环**：做完 `large.Next = nil` 之后，结果链的最后一个节点就是原来的大链表尾，它的 `Next` 已经是 `nil`，所以链是有结尾的。


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
