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

**方法一：BFS 层序遍历（O(n) 空间）**

使用队列进行层序遍历，每层的节点按顺序连接 `next` 指针。

**方法二：利用 next 指针逐层遍历（O(1) 空间）**

由于已经建立了上一层的 `next` 指针，可以利用它来遍历当前层的所有节点，为下一层建立连接，无需额外队列。

核心步骤：
1. 使用 `cur` 指针逐层处理，从根节点开始。
2. 对于每一层，使用 `dummy` 节点作为下一层链表的虚拟头节点。
3. 遍历当前层的每个节点（通过 next 指针），将其左右子节点连接到下一层链表中。
4. 处理完当前层后，cur 移动到下一层的第一个节点（dummy.Next）。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：O(1)，仅使用常量额外空间。

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
