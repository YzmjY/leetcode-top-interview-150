# 84. 二叉树的层序遍历

## 题目描述

给你二叉树的根节点 `root`，返回其节点值的 **层序遍历**。（即逐层地，从左到右访问所有节点）。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[9,20],[15,7]]
```

**示例 2：**

```
输入：root = [1]
输出：[[1]]
```

**示例 3：**

```
输入：root = []
输出：[]
```

**提示：**

- 树中节点数目在范围 `[0, 2000]` 内。
- `-1000 <= Node.val <= 1000`

## 题目分析

### 算法思路

本题是 BFS/层序遍历的最基础模板题。使用队列逐层处理：

1. 将根节点入队。
2. 当队列不为空时，记录当前队列大小 `levelSize`（即当前层节点数）。
3. 循环处理 `levelSize` 个节点：出队、记录值、将其左右子节点入队。
4. 将该层的结果收集到总的二维数组中。

这是最标准、最基础的层序遍历模板，后续所有变体（右视图、锯齿形等）都是在它的基础上修改。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点入队出队各一次。
- **空间复杂度**：O(n)，队列中最多存储约 n/2 个节点（最底层）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/84-binary-tree-level-order-traversal-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的层序遍历 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    var result [][]int
    queue := []*TreeNode{root}

    for len(queue) > 0 {
        levelSize := len(queue)
        var level []int

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            level = append(level, node.Val)

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }

        result = append(result, level)
    }

    return result
}
```
