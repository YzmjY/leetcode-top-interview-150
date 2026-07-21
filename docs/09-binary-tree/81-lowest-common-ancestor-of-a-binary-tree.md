# 81. 二叉树的最近公共祖先

## 题目描述

给定一个二叉树，找到该树中两个指定节点的最近公共祖先。

百度百科中最近公共祖先的定义为："对于有根树 T 的两个节点 p、q，最近公共祖先表示为一个节点 x，满足 x 是 p、q 的祖先且 x 的深度尽可能大（**一个节点也可以是它自己的祖先**）。"

**示例 1：**

```
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
输出：3
解释：节点 5 和节点 1 的最近公共祖先是节点 3。
```

**示例 2：**

```
输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
输出：5
解释：节点 5 和节点 4 的最近公共祖先是节点 5。因为根据定义，一个节点可以是它自己的祖先。
```

**示例 3：**

```
输入：root = [1,2], p = 1, q = 2
输出：1
```

**提示：**

- 树中节点数目在范围 `[2, 10^5]` 内。
- `-10^9 <= Node.val <= 10^9`
- 所有 `Node.val` **互不相同**。
- `p != q`
- `p` 和 `q` 均存在于给定的二叉树中。

## 题目分析

### 算法思路

采用**后序遍历**递归。定义递归函数返回当前子树中是否包含 p 或 q。

核心逻辑：
1. 如果当前节点为 nil，返回 nil。
2. 如果当前节点等于 p 或 q，直接返回当前节点。
3. 递归查找左右子树。
4. 根据左右子树的返回值判断：
   - 如果左右子树分别包含 p 和 q，则当前节点就是最近公共祖先。
   - 如果只有一侧包含，说明 p 和 q 都在这一侧，返回该侧的结果。
   - 如果两侧都不包含，返回 nil。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点最多访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)，平均 O(log n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/81-lowest-common-ancestor-of-a-binary-tree-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的最近公共祖先 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
    // 递归终止条件：空节点或找到 p 或 q
    if root == nil || root == p || root == q {
        return root
    }

    // 递归查找左右子树
    left := lowestCommonAncestor(root.Left, p, q)
    right := lowestCommonAncestor(root.Right, p, q)

    // 左右子树分别找到 p 和 q，当前节点就是最近公共祖先
    if left != nil && right != nil {
        return root
    }

    // 只有一侧找到，返回该侧结果
    if left != nil {
        return left
    }
    return right
}
```
