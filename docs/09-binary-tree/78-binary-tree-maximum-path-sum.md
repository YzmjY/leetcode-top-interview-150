# 78. 二叉树中的最大路径和

## 题目描述

二叉树中的 **路径** 被定义为一条节点序列，序列中每对相邻节点之间都存在一条边。同一个节点在一条路径序列中 **至多出现一次**。该路径 **至少包含一个** 节点，且不一定经过根节点。

**路径和** 是路径中各节点值的总和。

给你一个二叉树的根节点 `root`，返回其 **最大路径和**。

**示例 1：**

```
输入：root = [1,2,3]
输出：6
解释：最优路径是 2 -> 1 -> 3，路径和为 2 + 1 + 3 = 6
```

**示例 2：**

```
输入：root = [-10,9,20,null,null,15,7]
输出：42
解释：最优路径是 15 -> 20 -> 7，路径和为 15 + 20 + 7 = 42
```

**提示：**

- 树中节点数目范围是 `[1, 3 * 10^4]`。
- `-1000 <= Node.val <= 1000`

## 题目分析

### 算法思路

采用**后序遍历**（自底向上），为每个节点计算以该节点为根的最大贡献值。

对于每个节点，定义：
- **最大贡献值** `maxGain(node)`：以该节点为**端点**的（即从该节点向下延伸到某叶子节点）最大路径和。
  - 如果贡献值为负，则取 0（不选择该路径更好）。
  - `maxGain(node) = node.Val + max(0, maxGain(node.Left), maxGain(node.Right))`

- **经过该节点的最大路径和**：`node.Val + max(0, maxGain(node.Left)) + max(0, maxGain(node.Right))`

在递归过程中维护一个全局变量 `maxSum`，更新经过每个节点的最大路径和。最终返回 maxSum。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/78-binary-tree-maximum-path-sum-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树中的最大路径和 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func maxPathSum(root *TreeNode) int {
    maxSum := -1 << 31 // 初始化为最小整数

    var maxGain func(*TreeNode) int
    maxGain = func(node *TreeNode) int {
        if node == nil {
            return 0
        }

        // 递归计算左右子树的最大贡献值（负值取 0）
        leftGain := max(0, maxGain(node.Left))
        rightGain := max(0, maxGain(node.Right))

        // 经过当前节点的最大路径和
        curPathSum := node.Val + leftGain + rightGain
        if curPathSum > maxSum {
            maxSum = curPathSum
        }

        // 返回以当前节点为端点的最大贡献值
        return node.Val + max(leftGain, rightGain)
    }

    maxGain(root)
    return maxSum
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```
