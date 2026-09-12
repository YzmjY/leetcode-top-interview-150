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

**核心思路：** 本题与「删除排序链表中的重复元素 I」（保留一个）的最大区别是：**重复出现的值要全部删除，一个不留**。

先想朴素做法：用一个哈希表统计每个值出现的次数，第二遍只保留出现次数为 1 的节点。这需要 O(n) 空间，而且完全没用上「链表已经排序」这个条件。

利用有序性可以消掉哈希表：**重复的值在链表中一定相邻**。所以不需要先统计全局次数——只要看到相邻两个节点值相同，就说明这个值至少出现了两次，应该整段删掉；反之，如果「下一个节点」和「下下个节点」的值不同，那么下一个节点的值在剩余部分只会出现一次，可以安全保留。

这就是代码里采用「向前看两格」的原因：**用 `cur.Next` 和 `cur.Next.Next` 来判断 `cur.Next` 该不该留**。这样做的好处是 `cur` 本身永远不需要被删除，它的值在之前就已经确认是唯一的。

另外，头节点也可能重复（示例 2 的 `[1,1,1,2,3]`），所以需要 `dummy` 哨兵，让「删除头节点」和「删除中间节点」用同一套逻辑。

**算法步骤：**

1. `dummy := &ListNode{Next: head}`，`cur := dummy`。
2. 循环条件：`cur.Next != nil && cur.Next.Next != nil`（只要后面还有至少两个节点，才可能出现重复）。
3. 每轮：
   - 若 `cur.Next.Val == cur.Next.Next.Val`：说明 `cur.Next` 的值重复了。记下 `val := cur.Next.Val`，然后用内层循环跳过所有值为 `val` 的节点：`for cur.Next != nil && cur.Next.Val == val { cur.Next = cur.Next.Next }`。**`cur` 本身不前进**，继续用同样的方式检查新的 `cur.Next`。
   - 否则 `cur.Next` 的值唯一，可以保留，`cur = cur.Next` 前进一格。
4. 返回 `dummy.Next`。

**为什么正确（循环不变量）：** **每轮循环开始时：从 `dummy.Next` 到 `cur` 这段链表，恰好是「原链表已处理前缀」中应当保留下来的结果，且 `cur` 之后剩余节点的值都严格大于 `cur.Val`。**

- **不变量初值**：`cur = dummy`，前缀为空，不变量平凡成立。
- **情形一（`cur.Next.Val == cur.Next.Next.Val`）**：由链表有序，值相等的节点一定相邻。既然 `cur.Next` 和 `cur.Next.Next` 相等，说明值 `val` 在原链表中至少出现两次，按题意 `val` 必须**全部**删除。内层循环从 `cur.Next` 起跳过所有 `val`，跳完后 `cur.Next` 要么是 `nil`，要么是第一个值不等于 `val` 的节点——由有序性，它的值必然大于 `val`，因此仍然大于 `cur.Val`，不变量保持。`cur` 不必前移：它已经是「确定为结果」的最后一个节点。
- **情形二（`cur.Next.Val != cur.Next.Next.Val`）**：由有序性，值等于 `cur.Next.Val` 的节点在剩余链表中只会是一段连续区间；而这段区间的长度最多为 1（否则 `cur.Next.Next` 就会与 `cur.Next` 相等），因此 `cur.Next.Val` 在整条链中只出现一次，保留它不会违反「只留下不同的数字」。`cur` 前移一格，不变量保持。
- **循环终止**：退出条件是 `cur.Next == nil` 或 `cur.Next.Next == nil`。
  - 若 `cur.Next == nil`，没有剩余节点，结果完整。
  - 若 `cur.Next != nil` 而 `cur.Next.Next == nil`，只剩下一个节点，它的值只出现一次（否则它会和前面的节点构成重复，而它在有序序列中被单独留在末尾是不可能的重复情形——若它与前一个保留节点同值，那它前面早就被整段跳过了），所以保留它正确。代码无需额外处理，直接返回即可。

### 复杂度分析

- **时间复杂度**：O(n)。`cur` 只会前进，而 `cur.Next` 的跳除操作总共让每个节点最多被摘掉一次；内层 `while` 的所有迭代合起来不超过 n 次。每个节点被常数次访问。
- **空间复杂度**：O(1)，只用了 `dummy`、`cur`、`val` 常数个变量，没有哈希表。

### 易错点 / 边界情况

- **必须用 `dummy`**：头节点可能被整段删除（`[1,1,1,2,3]`），没有哨兵就得写「删除头节点」的特殊分支。返回 `dummy.Next` 而不是 `head`。
- **判断要「向前看两格」而不是比较 `cur` 和 `cur.Next`**：如果比较 `cur` 和 `cur.Next`，当发现相等时你需要删除的可能是 `cur` 自己，而单链表拿不到 `cur` 的前驱（除非再加一个指针）。代码的写法让 `cur` 永远是安全的已确认节点，只决定 `cur.Next` 的去留。
- **内层跳过循环必须判空**：条件要写全 `for cur.Next != nil && cur.Next.Val == val`，否则当重复值一直延伸到链表末尾时会访问 `nil.Val` 而 panic。
- **跳过重复后 `cur` 不能前进**：跳过的是 `val` 这一整段，但 `cur.Next` 换成了新的节点，仍需要用同样的逻辑检查它是否也重复。如果顺手写了 `cur = cur.Next`，就会漏删。
- **外层循环条件是两个**：`cur.Next != nil && cur.Next.Next != nil`。少写第二个会访问 `nil.Val`。
- **与第 83 题（重复元素保留一个）的区别**：本题一旦发现 `cur.Next.Val == cur.Next.Next.Val` 就整段删除；83 题则是保留第一个、跳过其余。83 题头节点不会被删（至少保留一个），所以不需要 `dummy`，这是最简单的区分记忆点。
- **空链表**：`head == nil` 时循环条件立即为假，返回 `dummy.Next == nil`，正确。
- **不要把值域当桶**：值域是 `[-100, 100]`，理论上可以用计数数组，但那是 O(值域) 空间且没有利用有序性，不如双指针原地删除。


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
