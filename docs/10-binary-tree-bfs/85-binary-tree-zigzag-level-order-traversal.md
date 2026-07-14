# 85. 二叉树的锯齿形层序遍历

## 题目描述

给你二叉树的根节点 `root`，返回其节点值的 **锯齿形层序遍历**。（即先从左往右，再从右往左进行下一层遍历，以此类推，层与层之间交替进行）。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[20,9],[15,7]]
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
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

在标准层序遍历的基础上，增加一个方向标志 `leftToRight`，控制每层结果的填充方向：

1. 使用队列进行标准 BFS 层序遍历。
2. 偶数层（层号从 0 开始）从左到右，奇数层从右到左。
3. 当需要反向时，有三种实现方式：
   - **方法一**（推荐）：收集完当前层后，如果是反向层，反转当前层的切片。
   - **方法二**：对于反向层，将节点值插入到一个固定大小切片中的对应反向位置。

反转切片是最简洁的方式，且总时间复杂度依然是 O(n)（每个节点只被反转一次）。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次，反转每个元素处理一次。
- **空间复杂度**：O(w)，队列最大存储宽度。

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func zigzagLevelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    var result [][]int
    queue := []*TreeNode{root}
    leftToRight := true // 当前层方向

    for len(queue) > 0 {
        levelSize := len(queue)
        level := make([]int, levelSize)

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            // 根据方向决定填入位置
            if leftToRight {
                level[i] = node.Val
            } else {
                level[levelSize-1-i] = node.Val
            }

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }

        result = append(result, level)
        leftToRight = !leftToRight // 切换方向
    }

    return result
}
```
