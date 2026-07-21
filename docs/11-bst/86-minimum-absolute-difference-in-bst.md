# 86. 二叉搜索树的最小绝对差

## 题目描述

给你一个二叉搜索树的根节点 `root`，返回 **树中任意两不同节点值之间的最小差值**。

差值是一个正数，其数值等于两值之差的绝对值。

**示例 1：**

```
输入：root = [4,2,6,1,3]
输出：1
```

**示例 2：**

```
输入：root = [1,0,48,null,null,12,49]
输出：1
```

**提示：**

- 树中节点的数目范围是 `[2, 10^4]`。
- `0 <= Node.val <= 10^5`

**注意**：本题与 LeetCode 530 相同。

## 题目分析

### 算法思路

利用 BST **中序遍历升序**的性质。对 BST 进行中序遍历，得到的是一个升序序列。

在升序序列中，任意两节点值的最小差值一定出现在**相邻的两个元素**之间。因此：

1. 对 BST 进行中序遍历。
2. 在遍历过程中，记录前一个节点的值 `prev`。
3. 计算当前节点值与 `prev` 的差值，更新全局最小值 `minDiff`。

注意：由于需要至少两个节点，树的节点数 >= 2，所以一定有结果。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/86-minimum-absolute-difference-in-bst-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="二叉搜索树的最小绝对差 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func getMinimumDifference(root *TreeNode) int {
    minDiff := 1<<31 - 1 // 初始化为最大值
    var prev *int

    var inorder func(*TreeNode)
    inorder = func(node *TreeNode) {
        if node == nil {
            return
        }

        // 遍历左子树
        inorder(node.Left)

        // 处理当前节点
        if prev != nil {
            diff := node.Val - *prev
            if diff < 0 {
                diff = -diff
            }
            if diff < minDiff {
                minDiff = diff
            }
        }
        prev = &node.Val

        // 遍历右子树
        inorder(node.Right)
    }

    inorder(root)
    return minDiff
}
```
