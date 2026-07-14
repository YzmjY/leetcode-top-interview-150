# 68. 二叉树的最大深度

## 题目描述

给定一个二叉树 `root`，返回其最大深度。

二叉树的 **最大深度** 是指从根节点到最远叶子节点的最长路径上的节点数。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：3
```

**示例 2：**

```
输入：root = [1,null,2]
输出：2
```

**提示：**

- 树中节点的数量在 `[0, 10^4]` 区间内。
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

本题是二叉树最基础的递归问题，采用 DFS（深度优先搜索）求解。

**方法一：自底向上递归（后序遍历）**

递归地求左右子树的最大深度，根节点的最大深度为 `max(左子树深度, 右子树深度) + 1`。

- 终止条件：当前节点为 nil，深度为 0。
- 递归过程：分别计算左子树和右子树的深度，取较大值加 1 返回。

**方法二：自顶向下递归（前序遍历）**

维护一个全局变量 `ans`，从根节点向下传递当前深度值，每遇到叶子节点时更新最大值。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 为节点数。每个节点被访问一次。
- **空间复杂度**：O(h)，其中 h 为树的高度。递归栈的空间开销。最坏情况下（链状树）为 O(n)，平均为 O(log n)。

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：自底向上（后序遍历）
func maxDepth(root *TreeNode) int {
    if root == nil {
        return 0
    }
    leftDepth := maxDepth(root.Left)
    rightDepth := maxDepth(root.Right)
    return max(leftDepth, rightDepth) + 1
}

// 方法二：自顶向下（前序遍历）
func maxDepthTopDown(root *TreeNode) int {
    ans := 0
    var dfs func(*TreeNode, int)
    dfs = func(node *TreeNode, depth int) {
        if node == nil {
            return
        }
        if depth > ans {
            ans = depth
        }
        dfs(node.Left, depth+1)
        dfs(node.Right, depth+1)
    }
    dfs(root, 1)
    return ans
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```
