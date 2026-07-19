# 82. 二叉树的右视图

## 题目描述

给定一个二叉树的 **根节点** `root`，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。

**示例 1：**

```
输入：root = [1,2,3,null,5,null,4]
输出：[1,3,4]
解释：
   1            <---
 /   \
2     3         <---
 \     \
  5     4       <---
```

**示例 2：**

```
输入：root = [1,null,3]
输出：[1,3]
```

**示例 3：**

```
输入：root = []
输出：[]
```

**提示：**

- 二叉树的节点个数的范围是 `[0, 100]`。
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

**方法一：BFS（层序遍历）**

进行层序遍历，每层最后一个访问的节点就是从右侧看到的节点。将其值添加到结果列表中。

这是最直观的解法：每层遍历完，取当前层的最后一个元素即可。

**方法二：DFS（根-右-左的前序遍历）**

按照 根 -> 右子树 -> 左子树 的顺序遍历。对于每个深度，第一个遇到的节点就是右视图看到的节点。维护一个结果列表，当 `depth == len(result)` 时（即第一次到达该深度），将当前节点值加入结果。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：BFS 版 O(w)，其中 w 是树的最大宽度；DFS 版 O(h)，h 是树的高度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/82-binary-tree-right-side-view-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的右视图 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：BFS 层序遍历
func rightSideView(root *TreeNode) []int {
    if root == nil {
        return nil
    }

    var result []int
    queue := []*TreeNode{root}

    for len(queue) > 0 {
        levelSize := len(queue)
        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            // 每层最后一个节点加入结果
            if i == levelSize-1 {
                result = append(result, node.Val)
            }

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
    }

    return result
}

// 方法二：DFS（根-右-左）
func rightSideViewDFS(root *TreeNode) []int {
    var result []int
    var dfs func(*TreeNode, int)
    dfs = func(node *TreeNode, depth int) {
        if node == nil {
            return
        }
        // 第一次到达该深度，加入结果
        if depth == len(result) {
            result = append(result, node.Val)
        }
        // 先右后左，保证右视图优先
        dfs(node.Right, depth+1)
        dfs(node.Left, depth+1)
    }
    dfs(root, 0)
    return result
}
```
