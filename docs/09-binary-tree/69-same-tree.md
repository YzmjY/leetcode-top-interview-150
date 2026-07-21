# 69. 相同的树

## 题目描述

给你两棵二叉树的根节点 `p` 和 `q`，编写一个函数来检验这两棵树是否相同。

如果两个树在结构上相同，并且节点具有相同的值，则认为它们是相同的。

**示例 1：**

```
输入：p = [1,2,3], q = [1,2,3]
输出：true
```

**示例 2：**

```
输入：p = [1,2], q = [1,null,2]
输出：false
```

**示例 3：**

```
输入：p = [1,2,1], q = [1,1,2]
输出：false
```

**提示：**

- 两棵树上的节点数目都在范围 `[0, 100]` 内。
- `-10^4 <= Node.val <= 10^4`

## 题目分析

### 算法思路

采用递归（前序遍历）同时遍历两棵树，逐节点比较：

1. **终止条件**：
   - 两个节点都为空，返回 true（相同）。
   - 一个为空另一个不为空，返回 false（结构不同）。
2. **单层逻辑**：
   - 当前节点的值必须相等。
   - 递归比较左子树和右子树，两者都相同才返回 true。

### 复杂度分析

- **时间复杂度**：O(min(m, n))，其中 m、n 分别是两棵树的节点数。最坏情况下比较所有节点。
- **空间复杂度**：O(min(h1, h2))，递归栈的深度取决于较矮树的高度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/69-same-tree-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="相同的树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func isSameTree(p *TreeNode, q *TreeNode) bool {
    // 两个都为空
    if p == nil && q == nil {
        return true
    }
    // 一个为空一个不为空
    if p == nil || q == nil {
        return false
    }
    // 值不相等
    if p.Val != q.Val {
        return false
    }
    // 递归比较左右子树
    return isSameTree(p.Left, q.Left) && isSameTree(p.Right, q.Right)
}
```
