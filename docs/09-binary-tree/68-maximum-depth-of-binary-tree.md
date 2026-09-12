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

**核心思路**：深度描述的是「根到最远叶子经过的节点数」。树本身就是递归结构——整棵树的深度只取决于左右两棵子树的深度，因此不必显式地记录路径，把问题拆给两个子节点即可。

**方法一：自底向上递归（后序遍历）**

先递归求出左右子树的最大深度，根节点的最大深度为 `max(左子树深度, 右子树深度) + 1`（`+1` 是根节点自己这一层）。

- 终止条件：当前节点为 nil，说明这里没有节点，深度为 0。
- 递归过程：分别计算左子树和右子树的深度，取较大值加 1 返回。

**方法二：自顶向下递归（前序遍历）**

换个方向：把「根到当前节点的深度」当作参数向下传递，每进入一个节点就用它更新全局最大值。由于最深的节点一定是叶子，沿途更新与「只在叶子更新」得到的答案相同，但代码更简单。

**算法步骤（方法一）**：

1. 若 `root == nil`，返回 0；
2. 递归求 `left = maxDepth(root.Left)`、`right = maxDepth(root.Right)`；
3. 返回 `max(left, right) + 1`。

方法二从 `dfs(root, 1)` 开始：节点为空直接返回；否则用当前 `depth` 更新 `ans`，再以 `depth+1` 递归左右子节点。

### 为什么正确

对树高（或节点数）做归纳。若 `root` 为空，返回 0 与实际深度一致。若 `root` 不为空，根到最远叶子的路径必然先经过根，再完全落在左子树或右子树中，因此整棵树的深度就是「左子树深度 + 1」与「右子树深度 + 1」中的较大者；由归纳假设两个子调用返回的正是左右子树的真实深度，取较大值加 1 即正确答案。方法二则对「当前深度」做归纳：进入节点时记录的深度就是从根到该节点的层数，遍历完所有节点后取到的最大值必为最深节点的层数。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 为节点数。每个节点被访问一次。
- **空间复杂度**：O(h)，其中 h 为树的高度。递归栈的空间开销。最坏情况下（链状树）为 O(n)，平均为 O(log n)。

### 易错点 / 边界情况

- 空树深度是 0（不是 1）；深度按**节点数**计，不是边数。
- 方法二的 `ans` 初值为 0、`dfs` 从深度 1 开始调用；若从 0 开始传递，所有结果都会少 1。
- 方法二是在每个节点（而非只在叶子）更新 `ans`，两者结果相同，不要误以为漏判了叶子。
- 递归深度等于树高，`10^4` 个节点的链状树在 Go 中依赖运行时动态扩栈，通常不会溢出；换到栈受限的语言时需要改成迭代。
- 代码里自定义的 `func max` 会遮蔽 Go 1.21 起的内建 `max`。本题内不会出问题，但不要把自定义版本与可比较任意类型的内建 `max` 混用。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/68-maximum-depth-of-binary-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的最大深度 - 交互演示">
</iframe>

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
