# 75. 二叉树展开为链表

## 题目描述

给你二叉树的根结点 `root`，请你将它展开为一个单链表：

- 展开后的单链表应该同样使用 `TreeNode`，其中 `right` 子指针指向链表中下一个结点，而左子指针始终为 `null`。
- 展开后的单链表应该与二叉树 **先序遍历** 顺序相同。

**示例 1：**

```
输入：root = [1,2,5,3,4,null,6]
输出：[1,null,2,null,3,null,4,null,5,null,6]
```

**示例 2：**

```
输入：root = []
输出：[]
```

**示例 3：**

```
输入：root = [0]
输出：[0]
```

**提示：**

- 树中结点数在范围 `[0, 2000]` 内。
- `-100 <= Node.val <= 100`

**进阶**：你可以使用原地算法（O(1) 额外空间）展开这棵树吗？

## 题目分析

### 算法思路

**方法一：前序遍历 + 重建**

先进行前序遍历收集所有节点，再逐个连接。需要 O(n) 额外空间。

**方法二：原地展开（O(1) 空间，莫里斯遍历思想）**

对于每个节点：
1. 如果左子树不为空，找到左子树中最右边的节点（前驱节点）。
2. 将当前节点的右子树移到前驱节点的右子节点位置。
3. 将当前节点的左子树移到右子节点位置，左子节点置空。
4. 移动到右子节点继续处理。

每个节点最多被访问两次，时间 O(n)，空间 O(1)。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问 O(1) 次。
- **空间复杂度**：O(1)，原地操作。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/75-flatten-binary-tree-to-linked-list-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="二叉树展开为链表 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：前序遍历收集 + 重建
func flatten(root *TreeNode) {
    if root == nil {
        return
    }
    var nodes []*TreeNode
    var preorder func(*TreeNode)
    preorder = func(node *TreeNode) {
        if node == nil {
            return
        }
        nodes = append(nodes, node)
        preorder(node.Left)
        preorder(node.Right)
    }
    preorder(root)

    for i := 0; i < len(nodes)-1; i++ {
        nodes[i].Left = nil
        nodes[i].Right = nodes[i+1]
    }
    nodes[len(nodes)-1].Left = nil
    nodes[len(nodes)-1].Right = nil
}

// 方法二：原地展开 O(1) 空间
func flattenInPlace(root *TreeNode) {
    cur := root
    for cur != nil {
        if cur.Left != nil {
            // 找到左子树的最右节点（前驱）
            predecessor := cur.Left
            for predecessor.Right != nil {
                predecessor = predecessor.Right
            }
            // 将右子树接到前驱的右边
            predecessor.Right = cur.Right
            // 将左子树移到右边
            cur.Right = cur.Left
            cur.Left = nil
        }
        // 继续处理下一个节点
        cur = cur.Right
    }
}
```
