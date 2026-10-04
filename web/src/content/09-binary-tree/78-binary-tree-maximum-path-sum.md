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

**核心思路**：树中的任意一条路径一定有一个「最高点」——路径上离根最近的节点。在这条路径上，从最高点出发，一部分向左下走、一部分向右下走（也可能只走一侧，或路径就是最高点本身）。因此只要枚举每个节点作为最高点，求出「以它为最高点的最大路径和」，取最大值即可，而这些值都能由子树自底向上推出来。

定义两个量（务必区分）：

- **最大贡献值 `gain(node)`**：以该节点为**起点**、向**下**延伸到某个后代的最大路径和。它只能选左、右中的一侧继续（否则就不成其为一条不拐弯的向下路径）。为了让父节点复用它，负贡献应被舍弃：`gain(node) = node.Val + max(0, gain(node.Left), gain(node.Right))`。
- **以该节点为最高点的最大路径和**：`node.Val + max(0, gain(node.Left)) + max(0, gain(node.Right))`。这里两侧可以同时取，因为路径在最高点处拐弯。

采用**后序遍历**（自底向上）即可先得到子树的 `gain`，再用它们更新全局答案 `maxSum`，最后返回 `gain(node)` 供父节点使用。遍历结束后 `maxSum` 即答案。

### 为什么正确

- **`gain` 的递推正确**：从 `node` 出发向下不回头的最优路径，要么只包含 `node` 自己，要么先进入左子树或右子树继续。若某侧子树的贡献为负，宁可不要（取 0），因此最大值就是 `node.Val + max(0, 左 gain, 右 gain)`。由归纳假设子调用返回真实的子树贡献。
- **枚举完备且最优**：任意一条路径 `P` 必有一个最高点 `u`（`P` 上深度最小的节点）。`P` 在 `u` 处至多分成向左下、向右下两段互不相交的下降路径，每段的和分别不超过 `max(0, gain(u.Left))` 与 `max(0, gain(u.Right))`。所以按公式在 `u` 处计算的路径和是「以 `u` 为最高点的路径和」的上界，且这个上界可以由取到最大贡献的那两条下降路径拼出（左右可空、可取 0），是可达的。因此枚举所有节点作为最高点一定能取到全局最优，`maxSum` 正确。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)。

### 易错点 / 边界情况

- `maxSum` 的初值必须是「负无穷」（代码用 `-1 << 31`），**不能是 0**：当整棵树都是负数时，答案是最接近 0 的那个节点值，用 0 初始化会给出错误答案（如 `[-3]` 应返回 `-3`）。
- 「贡献值」与「经过该节点的路径和」是两个不同的量。返回值只能是单侧（`max(leftGain, rightGain)`），把 `leftGain + rightGain` 返回给父节点会构造出不存在的分叉路径。
- 贡献值要用 `max(0, ...)` 截断负数，否则父节点会被拖累。
- 路径不一定经过根节点，必须对每个节点都尝试其作为最高点。
- 单节点树（包括负数节点）的答案就是该节点值。
- 值的范围是 `[-1000, 1000]`，节点数最多 `3 * 10^4`，路径和绝对值不超过 `3 * 10^7`，`int` 不会溢出。


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
