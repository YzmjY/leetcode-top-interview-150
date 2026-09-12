# 74. 填充每个节点的下一个右侧节点指针 II

## 题目描述

给定一个二叉树：

```
struct Node {
  int val;
  Node *left;
  Node *right;
  Node *next;
}
```

填充它的每个 `next` 指针，让这个指针指向其下一个右侧节点。如果找不到下一个右侧节点，则将 `next` 指针设置为 `NULL`。

初始状态下，所有 `next` 指针都被设置为 `NULL`。

**进阶**：
- 你只能使用常量级额外空间。
- 使用递归解题也符合要求，本题中递归程序的隐式栈空间不计入额外空间复杂度。

**示例 1：**

```
输入：root = [1,2,3,4,5,null,7]
输出：[1,#,2,3,#,4,5,7,#]
解释：序列化输出按层序遍历顺序（由 next 指针连接），'#' 表示每层的末尾。
```

**提示：**

- 树中的节点数在 `[0, 6000]` 范围内。
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

**核心思路**：最直观的做法是 BFS 层序遍历，逐层把节点连起来，但队列需要 O(n) 空间。题目进阶要求常量空间，突破口是：**上一层已经连好了 `next` 指针，它本身就是一条从左到右的链表**。于是遍历上一层的链表时，就可以顺手把下一层的孩子按顺序串起来，不再需要队列。这就是方法二的本质——用已经建立好的信息去建立下一层的连接。

**方法一：BFS 层序遍历（O(n) 空间，仅作对照）**

使用队列进行层序遍历，每层的节点按顺序连接 `next` 指针。

**方法二：利用 next 指针逐层遍历（O(1) 空间，本题代码采用）**

以 `cur` 表示当前层最左边的节点，它同时也是遍历当前层的入口。

核心步骤：
1. 从 `cur = root` 开始，表示正在处理第 0 层。
2. 为下一层准备一个虚拟头节点 `dummy` 和尾指针 `tail = dummy`。
3. 沿 `next` 遍历当前层的每个节点 `node`：若 `node.Left` 非空，把它接到 `tail` 后面；再处理 `node.Right`。由于遍历顺序是从左到右，孩子被挂到 `tail` 上的顺序天然就是下一层从左到右的顺序。
4. 本层处理完后，`cur = dummy.Next`（下一层的最左节点），开始处理下一层；`cur` 为 nil 说明已经没有下一层，结束。
5. 返回 `root`。

### 为什么正确

用归纳法证明「进入外层循环时，`cur` 指向第 d 层最左边的节点，且第 d 层的 `next` 已经全部正确连接」。d = 0 时 `cur = root`，且第 0 层只有一个节点，其 `next` 初始为 nil，成立。归纳步：第 d 层的 `next` 已是一条从左到右的完整链表，所以 `for node := cur; node != nil; node = node.Next` 恰好按从左到右的顺序访问第 d 层全部节点；每个节点的左孩子、右孩子依次挂到 `tail` 上，得到的序列正是第 d+1 层从左到右的节点序列，并且被串成一条以 `dummy.Next` 开头的链表。于是第 d+1 层的 `next` 全部正确，且 `dummy.Next` 就是第 d+1 层最左节点，归纳成立。当最后一层没有孩子时 `dummy.Next` 为 nil，循环结束，所有非空层的 `next` 都已正确设置，末尾节点的 `next` 保持 nil。

### 复杂度分析

- **时间复杂度**：O(n)。每个节点恰好被访问两次：一次作为当前层节点参与内层遍历，一次作为孩子被挂进下一层链表。
- **空间复杂度**：O(1)。除每层新建的一个 `dummy` 节点和 `cur`、`tail` 两个指针外不使用额外空间，与节点数无关（方法一 BFS 则需要 O(n) 队列空间）。

### 易错点 / 边界情况

- 内层必须沿 `Next` 指针遍历整层，不能只递归左右孩子——`4 → 5 → 7` 中 `5` 与 `7` 分属不同父节点，只有 `next` 能把它们连起来。
- `dummy` 必须每层重新创建、`tail` 重新指向它；若复用同一个 `dummy`，`dummy.Next` 会一直指向第一层的第一个节点，无法推进到下一层。
- 挂孩子的顺序是先 `Left` 后 `Right`，顺序反了会打乱下一层的左右次序。
- `cur` 的推进只依赖 `dummy.Next`，不要写成 `cur = cur.Left`（左孩子可能缺失）。
- 空树直接返回 nil；函数需返回 `root` 供调用方使用。
- 题目描述里的结构体字段是小写 `val/left/right/next`（C 风格伪代码），Go 实现中要用导出的 `Val/Left/Right/Next`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/74-populating-next-right-pointers-in-each-node-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="填充每个节点的下一个右侧节点指针 II - 交互演示">
</iframe>

## Go 代码实现

```go
type Node struct {
    Val   int
    Left  *Node
    Right *Node
    Next  *Node
}

// O(1) 空间解法：利用已有的 next 指针逐层处理
func connect(root *Node) *Node {
    if root == nil {
        return nil
    }

    cur := root // 当前层的起始节点

    for cur != nil {
        // dummy 是下一层链表的虚拟头节点
        dummy := &Node{}
        tail := dummy

        // 遍历当前层的所有节点
        for node := cur; node != nil; node = node.Next {
            if node.Left != nil {
                tail.Next = node.Left
                tail = tail.Next
            }
            if node.Right != nil {
                tail.Next = node.Right
                tail = tail.Next
            }
        }

        // 移动到下一层
        cur = dummy.Next
    }

    return root
}
```
