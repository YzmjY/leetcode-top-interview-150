# 73. 从中序与后序遍历序列构造二叉树

## 题目描述

给定两个整数数组 `inorder` 和 `postorder`，其中 `inorder` 是二叉树的**中序遍历**，`postorder` 是同一棵树的**后序遍历**，请你构造并返回这颗二叉树。

**示例 1：**

```
输入：inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]
输出：[3,9,20,null,null,15,7]
```

**示例 2：**

```
输入：inorder = [-1], postorder = [-1]
输出：[-1]
```

**提示：**

- `1 <= inorder.length <= 3000`
- `postorder.length == inorder.length`
- `-3000 <= inorder[i], postorder[i] <= 3000`
- `inorder` 和 `postorder` 都由 **不同** 的值组成。
- `postorder` 中每一个值都在 `inorder` 中。
- `inorder` **保证**是树的中序遍历。
- `postorder` **保证**是树的后序遍历。

## 题目分析

### 算法思路

与前序+中序构造二叉树类似，核心是利用后序和中序的性质：

- 后序遍历：`[左子树后序, 右子树后序, 根]`
- 中序遍历：`[左子树中序, 根, 右子树中序]`

注意与前序+中序的区别：
- 前序的第一个元素是根，后序的**最后一个**元素是根。
- 因此需要从后往前处理 postorder。

构造步骤：
1. 后序的最后一个元素是根节点。
2. 在中序中定位根节点的位置，划分左右子树。
3. **先递归构造右子树，再构造左子树**（因为从后往前取 postorder，顺序是 根 -> 右子树的根 -> 左子树的根）。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：O(n)，哈希表存储 n 个映射。

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func buildTree(inorder []int, postorder []int) *TreeNode {
    // 构建中序遍历值到索引的映射
    idxMap := make(map[int]int, len(inorder))
    for i, v := range inorder {
        idxMap[v] = i
    }

    // postIdx 从后往前遍历 postorder
    postIdx := len(postorder) - 1

    var build func(inLeft, inRight int) *TreeNode
    build = func(inLeft, inRight int) *TreeNode {
        if inLeft > inRight {
            return nil
        }

        // 后序遍历的最后一个元素是根节点
        rootVal := postorder[postIdx]
        postIdx--
        root := &TreeNode{Val: rootVal}

        // 在中序中找到根的位置
        rootIdx := idxMap[rootVal]

        // 先构造右子树，再构造左子树（因为 postorder 从后往前：根-右-左）
        root.Right = build(rootIdx+1, inRight)
        root.Left = build(inLeft, rootIdx-1)

        return root
    }

    return build(0, len(inorder)-1)
}
```
