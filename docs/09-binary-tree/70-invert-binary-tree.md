# 70. 翻转二叉树

## 题目描述

给你一棵二叉树的根节点 `root`，翻转这棵二叉树，并返回其根节点。

翻转二叉树是指将二叉树中每个节点的左右子节点进行交换。

**示例 1：**

```
输入：root = [4,2,7,1,3,6,9]
输出：[4,7,2,9,6,3,1]
```

**示例 2：**

```
输入：root = [2,1,3]
输出：[2,3,1]
```

**示例 3：**

```
输入：root = []
输出：[]
```

**提示：**

- 树中节点的数目在 `[0, 100]` 范围内。
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

采用递归（前序/后序遍历均可）完成翻转：

1. **终止条件**：当前节点为 nil，直接返回 nil。
2. **递归过程**：
   - 递归翻转左子树，得到新的左子树。
   - 递归翻转右子树，得到新的右子树。
   - 交换当前节点的左右子节点。

遍历顺序可以是前序（先交换再递归）或后序（先递归再交换），效果相同。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)，平均 O(log n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/70-invert-binary-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="翻转二叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 前序遍历版本
func invertTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    // 交换左右子节点
    root.Left, root.Right = root.Right, root.Left
    // 递归翻转子树
    invertTree(root.Left)
    invertTree(root.Right)
    return root
}
```
