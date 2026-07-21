# 71. 对称二叉树

## 题目描述

给你一个二叉树的根节点 `root`，检查它是否轴对称。

**示例 1：**

```
输入：root = [1,2,2,3,4,4,3]
输出：true
```

**示例 2：**

```
输入：root = [1,2,2,null,3,null,3]
输出：false
```

**提示：**

- 树中节点数目在范围 `[1, 1000]` 内。
- `-100 <= Node.val <= 100`

**进阶**：你可以运用递归和迭代两种方法解决这个问题吗？

## 题目分析

### 算法思路

**方法一：递归**

将问题转化为：判断两个子树是否互为镜像。

两棵树互为镜像的条件：
1. 它们的根节点值相等。
2. 每棵树的左子树与另一棵树的右子树互为镜像。

可以定义一个辅助函数 `isMirror(left, right)`，递归比较：
- 两个节点都为空：true。
- 一个为空：false。
- 值不相等：false。
- 递归比较 `left.Left` 与 `right.Right`，以及 `left.Right` 与 `right.Left`。

**方法二：迭代（队列）**

使用队列模拟递归过程，每次将需要比较的两个节点入队，然后取出比较。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：递归版 O(h)，迭代版 O(n)（队列可能存储一层全部节点）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/71-symmetric-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="对称二叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：递归
func isSymmetric(root *TreeNode) bool {
    if root == nil {
        return true
    }
    return isMirror(root.Left, root.Right)
}

func isMirror(left, right *TreeNode) bool {
    if left == nil && right == nil {
        return true
    }
    if left == nil || right == nil {
        return false
    }
    if left.Val != right.Val {
        return false
    }
    // 左的左 vs 右的右；左的右 vs 右的左
    return isMirror(left.Left, right.Right) && isMirror(left.Right, right.Left)
}

// 方法二：迭代（队列）
func isSymmetricIter(root *TreeNode) bool {
    if root == nil {
        return true
    }
    queue := []*TreeNode{root.Left, root.Right}
    for len(queue) >= 2 {
        left := queue[0]
        right := queue[1]
        queue = queue[2:]
        if left == nil && right == nil {
            continue
        }
        if left == nil || right == nil {
            return false
        }
        if left.Val != right.Val {
            return false
        }
        queue = append(queue, left.Left, right.Right)
        queue = append(queue, left.Right, right.Left)
    }
    return true
}
```
