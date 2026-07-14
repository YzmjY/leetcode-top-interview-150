# 72. 从前序与中序遍历序列构造二叉树

## 题目描述

给定两个整数数组 `preorder` 和 `inorder`，其中 `preorder` 是二叉树的**前序遍历**，`inorder` 是同一棵树的**中序遍历**，请构造二叉树并返回其根节点。

**示例 1：**

```
输入：preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
输出：[3,9,20,null,null,15,7]
```

**示例 2：**

```
输入：preorder = [-1], inorder = [-1]
输出：[-1]
```

**提示：**

- `1 <= preorder.length <= 3000`
- `inorder.length == preorder.length`
- `-3000 <= preorder[i], inorder[i] <= 3000`
- `preorder` 和 `inorder` 均 **无重复** 元素。
- `inorder` 均出现在 `preorder`。
- `preorder` **保证** 为二叉树的前序遍历序列。
- `inorder` **保证** 为二叉树的中序遍历序列。

## 题目分析

### 算法思路

核心利用前序和中序遍历的性质：

- 前序遍历：`[根, 左子树前序, 右子树前序]`
- 中序遍历：`[左子树中序, 根, 右子树中序]`

构造步骤：
1. 前序的第一个元素是根节点。
2. 在中序中定位根节点的位置，左边是左子树的中序，右边是右子树的中序。
3. 利用左子树的长度，在前序中划分出左右子树的前序序列。
4. 递归构造左右子树。

为了快速在中序中定位根节点位置，使用哈希表存储中序序列中 `值 -> 索引` 的映射。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点构造一次，哈希表查找 O(1)。
- **空间复杂度**：O(n)，哈希表存储 n 个映射，递归栈深度 O(h)。

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func buildTree(preorder []int, inorder []int) *TreeNode {
    // 构建中序遍历值到索引的映射
    idxMap := make(map[int]int, len(inorder))
    for i, v := range inorder {
        idxMap[v] = i
    }

    var build func(preLeft, preRight, inLeft, inRight int) *TreeNode
    build = func(preLeft, preRight, inLeft, inRight int) *TreeNode {
        if preLeft > preRight {
            return nil
        }

        // 前序第一个元素是根节点
        rootVal := preorder[preLeft]
        root := &TreeNode{Val: rootVal}

        // 在中序中找到根的位置
        rootIdx := idxMap[rootVal]
        // 左子树的节点数
        leftSize := rootIdx - inLeft

        // 递归构造左右子树
        root.Left = build(preLeft+1, preLeft+leftSize, inLeft, rootIdx-1)
        root.Right = build(preLeft+leftSize+1, preRight, rootIdx+1, inRight)

        return root
    }

    return build(0, len(preorder)-1, 0, len(inorder)-1)
}
```
