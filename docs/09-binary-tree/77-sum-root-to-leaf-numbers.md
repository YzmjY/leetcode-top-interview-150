# 77. 求根节点到叶节点数字之和

## 题目描述

给你一个二叉树的根节点 `root`，树中每个节点都存放有一个 `0` 到 `9` 之间的数字。

每条从根节点到叶节点的路径都代表一个数字：

- 例如，从根节点到叶节点的路径 `1 -> 2 -> 3` 表示数字 `123`。

计算从根节点到叶节点生成的 **所有数字之和**。

**叶节点** 是指没有子节点的节点。

**示例 1：**

```
输入：root = [1,2,3]
输出：25
解释：
从根到叶子节点路径 1->2 代表数字 12
从根到叶子节点路径 1->3 代表数字 13
因此，数字总和 = 12 + 13 = 25
```

**示例 2：**

```
输入：root = [4,9,0,5,1]
输出：1026
解释：
从根到叶子节点路径 4->9->5 代表数字 495
从根到叶子节点路径 4->9->1 代表数字 491
从根到叶子节点路径 4->0 代表数字 40
因此，数字总和 = 495 + 491 + 40 = 1026
```

**提示：**

- 树中节点的数目在范围 `[1, 1000]` 内。
- `0 <= Node.val <= 9`
- 树的深度不超过 10。

## 题目分析

### 算法思路

采用 DFS（前序遍历），在递归过程中维护从根到当前节点的数字值。

**核心思想**：每下降一层，将当前数字乘以 10 再加上当前节点值。

递归过程：
1. 更新当前路径数字：`cur = cur*10 + node.Val`。
2. 如果到达叶子节点，将当前数字累加到结果中。
3. 否则递归处理左右子节点。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(h)，递归栈深度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/77-sum-root-to-leaf-numbers-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="求根节点到叶节点数字之和 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func sumNumbers(root *TreeNode) int {
    var dfs func(*TreeNode, int) int
    dfs = func(node *TreeNode, cur int) int {
        if node == nil {
            return 0
        }
        // 更新当前路径数字
        cur = cur*10 + node.Val
        // 到达叶子节点，返回当前数字
        if node.Left == nil && node.Right == nil {
            return cur
        }
        // 递归求和左右子树的路径数字
        return dfs(node.Left, cur) + dfs(node.Right, cur)
    }
    return dfs(root, 0)
}
```
