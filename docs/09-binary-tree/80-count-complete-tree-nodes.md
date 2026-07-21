# 80. 完全二叉树的节点个数

## 题目描述

给你一棵 **完全二叉树** 的根节点 `root`，求出该树的节点个数。

完全二叉树的定义如下：在完全二叉树中，除了最底层节点可能没填满外，其余每层节点数都达到最大值，并且最下面一层的节点都集中在该层最左边的若干位置。若最底层为第 h 层（从第 0 层开始），则该层最多包含 `2^h` 个节点。

**示例 1：**

```
输入：root = [1,2,3,4,5,6]
输出：6
```

**示例 2：**

```
输入：root = []
输出：0
```

**示例 3：**

```
输入：root = [1]
输出：1
```

**提示：**

- 树中节点的数目范围是 `[0, 5 * 10^4]`。
- `0 <= Node.val <= 5 * 10^4`
- 题目数据保证输入的树是 **完全二叉树**。

**进阶**：遍历树来统计节点是一种时间复杂度为 O(n) 的简单解决方案。你可以设计一个更快的算法吗？

## 题目分析

### 算法思路

**方法一：暴力递归 O(n)**

直接递归统计：`countNodes(root) = 1 + countNodes(root.Left) + countNodes(root.Right)`

**方法二：利用完全二叉树性质 O((log n)^2)**

完全二叉树的特点：除最后一层外都是满的，可以利用满二叉树节点数公式。

判断当前子树是否是满二叉树：
- 计算当前节点**最左路径**的高度 `leftH`。
- 计算当前节点**最右路径**的高度 `rightH`。
- 若 `leftH == rightH`，说明是满二叉树，节点数为 `2^h - 1`。
- 否则，递归计算左右子树节点数。

### 复杂度分析

- **时间复杂度**：O((log n)^2)，每层判断高度 O(log n)，共 O(log n) 层。
- **空间复杂度**：O(log n)，递归栈深度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/80-count-complete-tree-nodes-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="完全二叉树的节点个数 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：暴力递归 O(n)
func countNodes(root *TreeNode) int {
    if root == nil {
        return 0
    }
    return 1 + countNodes(root.Left) + countNodes(root.Right)
}

// 方法二：利用完全二叉树性质 O((log n)^2)
func countNodesFast(root *TreeNode) int {
    if root == nil {
        return 0
    }

    // 计算左右子树最左路径的高度
    leftH := 0
    for cur := root.Left; cur != nil; cur = cur.Left {
        leftH++
    }
    rightH := 0
    for cur := root.Right; cur != nil; cur = cur.Left {
        rightH++
    }

    // 如果左子树高度等于右子树（用左路径衡量），说明左子树是满二叉树
    if leftH == rightH {
        // 2^(leftH+1) - 1 + 右子树递归
        return (1 << (leftH + 1)) + countNodesFast(root.Right)
    }
    // 否则右子树是满二叉树（高度为 rightH）
    return (1 << (rightH + 1)) + countNodesFast(root.Left)
}
```
