# 76. 路径总和

## 题目描述

给你二叉树的根节点 `root` 和一个表示目标和的整数 `targetSum`。判断该树中是否存在 **根节点到叶子节点** 的路径，这条路径上所有节点值相加等于目标和 `targetSum`。如果存在，返回 `true`；否则，返回 `false`。

**叶子节点** 是指没有子节点的节点。

**示例 1：**

```
输入：root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22
输出：true
解释：等于目标和的根节点到叶节点路径如图所示。
```

**示例 2：**

```
输入：root = [1,2,3], targetSum = 5
输出：false
解释：树中存在两条根节点到叶子节点的路径：
(1 --> 2): 和为 3
(1 --> 3): 和为 4
不存在 sum = 5 的根节点到叶子节点的路径。
```

**示例 3：**

```
输入：root = [], targetSum = 0
输出：false
解释：由于树是空的，所以不存在根节点到叶子节点的路径。
```

**提示：**

- 树中节点的数目在范围 `[0, 5000]` 内。
- `-1000 <= Node.val <= 1000`
- `-1000 <= targetSum <= 1000`

## 题目分析

### 算法思路

采用 DFS 递归（自顶向下）：

1. **终止条件**：当前节点为 nil，返回 false。
2. **叶子节点判断**：如果当前节点是叶子（左右子节点均为 nil），判断节点值是否等于剩余的 targetSum。
3. **递归**：将 targetSum 减去当前节点值，递归检查左子树或右子树是否存在符合条件的路径。

### 复杂度分析

- **时间复杂度**：O(n)，最坏情况下访问所有节点。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)，平均 O(log n)。

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func hasPathSum(root *TreeNode, targetSum int) bool {
    if root == nil {
        return false
    }
    // 到达叶子节点，检查是否匹配
    if root.Left == nil && root.Right == nil {
        return root.Val == targetSum
    }
    // 继续递归搜索左右子树
    remain := targetSum - root.Val
    return hasPathSum(root.Left, remain) || hasPathSum(root.Right, remain)
}
```
