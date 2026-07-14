# 第十一章 二叉搜索树（BST）

## 数据结构背景

**二叉搜索树（Binary Search Tree, BST）** 是一种特殊的二叉树，它满足以下性质：

### BST 的核心性质

对于 BST 中的任意节点：

1. **左子树所有节点的值 < 根节点的值**。
2. **右子树所有节点的值 > 根节点的值**。
3. **左右子树也分别是二叉搜索树**。

```
     8
   /   \
  3     10
 / \      \
1   6      14
   / \    /
  4   7  13
```

### BST 的重要推论

由上述性质可以推导出以下重要结论：

1. **中序遍历升序**：对 BST 进行中序遍历（左-根-右），得到的序列是**严格升序**的。这是 BST 最核心的性质，也是验证和利用 BST 的基础。
2. **查找效率**：在平衡的 BST 中，查找、插入、删除操作的时间复杂度为 O(log n)；但在最坏情况下（退化为链表），会降为 O(n)。
3. **最值查找**：最小值在最左侧节点，最大值在最右侧节点。
4. **前驱与后继**：中序前驱是左子树的最右节点，中序后继是右子树的最左节点。

### Go 中 BST 的基础操作

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 在 BST 中查找值
func searchBST(root *TreeNode, val int) *TreeNode {
    if root == nil || root.Val == val {
        return root
    }
    if val < root.Val {
        return searchBST(root.Left, val)
    }
    return searchBST(root.Right, val)
}

// 验证 BST：使用中序遍历检查升序
func isValidBST(root *TreeNode) bool {
    var prev *TreeNode
    var dfs func(*TreeNode) bool
    dfs = func(node *TreeNode) bool {
        if node == nil {
            return true
        }
        if !dfs(node.Left) {
            return false
        }
        if prev != nil && node.Val <= prev.Val {
            return false
        }
        prev = node
        return dfs(node.Right)
    }
    return dfs(root)
}

// 寻找 BST 中的最小值
func findMin(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    for root.Left != nil {
        root = root.Left
    }
    return root
}

// 寻找 BST 中的最大值
func findMax(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    for root.Right != nil {
        root = root.Right
    }
    return root
}
```

### BST 与其他数据结构的对比

| 操作 | 平衡 BST | 普通 BST（最坏） | 有序数组 | 无序哈希表 |
|------|---------|---------------|---------|----------|
| 查找 | O(log n) | O(n) | O(log n)（二分） | O(1) |
| 插入 | O(log n) | O(n) | O(n) | O(1) |
| 删除 | O(log n) | O(n) | O(n) | O(1) |
| 有序遍历 | O(n) | O(n) | O(n) | 不支持 |
| 范围查询 | O(log n + k) | O(n + k) | O(log n + k) | O(n) |
| 最值查询 | O(log n) | O(h) | O(1) | O(n) |

## 常见题型分类

### 1. BST 的验证

判断一棵二叉树是否满足 BST 的性质。核心方法有：
- **中序遍历法**：利用中序遍历升序的性质验证。
- **上下界递归法**：为每个子树设定允许的值范围 [lower, upper]。

**代表题目**：验证二叉搜索树

### 2. BST 的利用（利用中序遍历性质）

利用中序遍历的有序性来解决问题，如：
- 查找第 K 小的元素。
- 查找相邻元素的绝对差最小值。
- 转换为有序序列后统计。

**代表题目**：二叉搜索树中第 K 小的元素、二叉搜索树的最小绝对差

### 3. BST 的操作

对 BST 进行插入、删除、查找等操作，以及迭代器设计。

**代表题目**：二叉搜索树迭代器

## 解题关键技巧

1. **中序遍历是核心**：利用 BST 中序遍历升序的性质是解决大多数 BST 问题的基础。
2. **灵活选择验证方法**：对于验证 BST，中序遍历法更直观；上下界法在很多树构造/验证场景中也很有用。
3. **注意重复值**：BST 通常不允许重复值，处理时要注意（`<=` vs `<`）。
4. **利用 BST 性质剪枝**：如果在查找目标值，可以利用 BST 的大小关系进行二分搜索式的剪枝，避免遍历整棵树。

## 本章题目列表

| 题号 | 题目 | 难度 | 核心考点 |
|------|------|------|----------|
| 86 | 二叉搜索树的最小绝对差 | 简单 | 中序遍历 + 相邻元素差值 |
| 87 | 二叉搜索树中第 K 小的元素 | 中等 | 中序遍历定位第 K 个 |
| 88 | 验证二叉搜索树 | 中等 | 中序遍历 / 递归上下界 |
