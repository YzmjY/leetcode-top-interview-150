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

**核心思路**：路径必须从根走到叶子，所以可以「边走边扣」：把目标和减去沿途经过的节点值，走到叶子时只要剩余目标恰好等于 0，就说明这条路径的和等于目标和。把「剩余目标」当作参数自顶向下传递，就不需要额外记录路径。

采用 DFS 递归（自顶向下）：

1. **终止条件**：当前节点为 nil，返回 false（这里没有路径）。
2. **叶子节点判断**：如果当前节点是叶子（左右子节点均为 nil），判断节点值是否等于剩余的 `targetSum`。
3. **递归**：将 `targetSum` 减去当前节点值，递归检查左子树或右子树是否存在符合条件的路径，两者只要有一个成立即可。

### 为什么正确

对树高做归纳。空树没有任何根到叶路径，返回 false 正确（尤其注意即使 `targetSum = 0` 也不能返回 true）。叶子节点上的唯一一条根到叶路径就是该节点自身，因此只要比较节点值与剩余目标即可。对于非叶子节点，任何一条根到叶路径都必然先经过当前节点，再完整地落在左子树或右子树中；其路径和 = 当前节点值 + 子树内那条路径的和。因此「存在路径和为 `targetSum`」等价于「存在某棵子树中存在路径和为 `targetSum - root.Val`」。由归纳假设，两个子调用正确回答后者，`||` 的结果即答案。

### 复杂度分析

- **时间复杂度**：O(n)，最坏情况下访问所有节点。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)，平均 O(log n)。

### 易错点 / 边界情况

- 空树必须返回 false，即使 `targetSum == 0`（示例 3 专门考察这一点）。
- 判定终点必须在**叶子**上。不能写成「剩余目标为 0 就返回 true」，否则路径中途匹配也会误判（如 `[1,2,3]` 中 `targetSum=1`）。
- 节点值和目标都可能为负，不能用「剩余目标小于 0 就剪枝」之类的判断。
- 递归子问题时传的是 `targetSum - root.Val`，不要漏减或重复减。
- 单节点树只有一条路径，其和为节点值本身。
- 叶子判据是 `root.Left == nil && root.Right == nil`，不能只判断其中一个。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/76-path-sum-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="路径总和 - 交互演示">
</iframe>

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
