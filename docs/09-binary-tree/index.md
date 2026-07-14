# 第九章 二叉树

## 二叉树数据结构

二叉树（Binary Tree）是一种树形数据结构，其中每个节点最多有两个子节点，分别称为左子节点和右子节点。二叉树是面试中最高频的数据结构之一，几乎所有树相关的问题都围绕二叉树的遍历展开。

### Go 中二叉树的节点定义

在 Go 中，二叉树节点通常定义为包含值域和左右指针的结构体：

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}
```

**特殊二叉树类型：**

- **满二叉树（Full Binary Tree）**：除叶子节点外，每个节点都有两个子节点。
- **完全二叉树（Complete Binary Tree）**：除了最后一层外，其他层的节点数都达到最大，且最后一层的节点都靠左排列。
- **二叉搜索树（BST）**：对于任意节点，左子树所有节点的值 < 根节点的值 < 右子树所有节点的值。
- **平衡二叉树**：任意节点的左右子树高度差不超过 1。

### 二叉树的四种遍历方式

二叉树的遍历是解决所有树形结构问题的基石。以下四种遍历方式是必须熟练掌握的核心技能。

#### 1. 前序遍历（Preorder Traversal）

**遍历顺序**：根节点 -> 左子树 -> 右子树

```go
// 递归实现
func preorderTraversal(root *TreeNode) []int {
    var res []int
    var dfs func(*TreeNode)
    dfs = func(node *TreeNode) {
        if node == nil {
            return
        }
        res = append(res, node.Val) // 先访问根
        dfs(node.Left)               // 再遍历左子树
        dfs(node.Right)              // 最后遍历右子树
    }
    dfs(root)
    return res
}

// 迭代实现（栈）
func preorderTraversalIter(root *TreeNode) []int {
    if root == nil {
        return nil
    }
    var res []int
    stack := []*TreeNode{root}
    for len(stack) > 0 {
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        res = append(res, node.Val)
        if node.Right != nil { // 右子节点先入栈（后出栈）
            stack = append(stack, node.Right)
        }
        if node.Left != nil {
            stack = append(stack, node.Left)
        }
    }
    return res
}
```

#### 2. 中序遍历（Inorder Traversal）

**遍历顺序**：左子树 -> 根节点 -> 右子树

对于二叉搜索树（BST），中序遍历得到的是升序序列。

```go
// 递归实现
func inorderTraversal(root *TreeNode) []int {
    var res []int
    var dfs func(*TreeNode)
    dfs = func(node *TreeNode) {
        if node == nil {
            return
        }
        dfs(node.Left)                // 先遍历左子树
        res = append(res, node.Val)   // 再访问根
        dfs(node.Right)               // 最后遍历右子树
    }
    dfs(root)
    return res
}

// 迭代实现（栈）
func inorderTraversalIter(root *TreeNode) []int {
    var res []int
    var stack []*TreeNode
    cur := root
    for cur != nil || len(stack) > 0 {
        for cur != nil { // 一直向左走到底
            stack = append(stack, cur)
            cur = cur.Left
        }
        cur = stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        res = append(res, cur.Val) // 访问根
        cur = cur.Right            // 转向右子树
    }
    return res
}
```

#### 3. 后序遍历（Postorder Traversal）

**遍历顺序**：左子树 -> 右子树 -> 根节点

后序遍历常用于需要先处理子节点再处理父节点的场景，如计算树的高度、删除树等。

```go
// 递归实现
func postorderTraversal(root *TreeNode) []int {
    var res []int
    var dfs func(*TreeNode)
    dfs = func(node *TreeNode) {
        if node == nil {
            return
        }
        dfs(node.Left)               // 先遍历左子树
        dfs(node.Right)              // 再遍历右子树
        res = append(res, node.Val)  // 最后访问根
    }
    dfs(root)
    return res
}

// 迭代实现（修改前序遍历：根-右-左，再反转得左-右-根）
func postorderTraversalIter(root *TreeNode) []int {
    if root == nil {
        return nil
    }
    var res []int
    stack := []*TreeNode{root}
    for len(stack) > 0 {
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        res = append(res, node.Val)
        if node.Left != nil {
            stack = append(stack, node.Left)
        }
        if node.Right != nil {
            stack = append(stack, node.Right)
        }
    }
    // 反转结果
    for i, j := 0, len(res)-1; i < j; i, j = i+1, j-1 {
        res[i], res[j] = res[j], res[i]
    }
    return res
}
```

#### 4. 层序遍历（Level Order Traversal）

**遍历顺序**：从上到下，从左到右逐层访问。

层序遍历使用队列（BFS）实现，是解决按层处理问题的标准方法。

```go
func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }
    var res [][]int
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
        res = append(res, level)
    }
    return res
}
```

### 四种遍历总结

| 遍历方式 | 顺序 | 递归顺序 | 典型应用场景 |
|----------|------|----------|-------------|
| 前序 | 根-左-右 | 先访问根 | 复制树、序列化、前缀表达式 |
| 中序 | 左-根-右 | 中间访问根 | BST 升序输出、验证 BST |
| 后序 | 左-右-根 | 最后访问根 | 删除树、计算高度、路径和 |
| 层序 | 逐层访问 | BFS 队列 | 按层处理、求宽度/深度、BFS 问题 |

## 常见题型分类

### 1. 基础遍历与变形

掌握四种遍历的递归与迭代写法是所有二叉树问题的基础。此类题目直接考察遍历本身或其简单变形。

**代表题目**：二叉树的最大深度、相同的树、翻转二叉树、路径总和

### 2. 构造二叉树

给定两种遍历序列（如前序+中序、中序+后序），唯一确定一棵二叉树的结构。核心思想是利用遍历顺序的特点划分左右子树，递归构建。

**代表题目**：从前序与中序遍历序列构造二叉树、从中序与后序遍历序列构造二叉树

### 3. 路径问题

从根到叶子节点或任意节点间的路径，通常采用 DFS（深度优先搜索）遍历整棵树，在回溯过程中记录和维护路径信息。

**代表题目**：路径总和、求根节点到叶节点数字之和、二叉树中的最大路径和

### 4. 树的结构变换

对二叉树的结构进行修改，如翻转、展开、连接等。通常采用递归或迭代遍历，在遍历过程中完成结构变换。

**代表题目**：翻转二叉树、对称二叉树、二叉树展开为链表、填充每个节点的下一个右侧节点指针 II

### 5. 公共祖先与树的性质

利用二叉树的递归性质，在子树中查找目标节点，或在遍历过程中维护树的性质信息。

**代表题目**：二叉树的最近公共祖先、完全二叉树的节点个数

### 6. 迭代器与设计

实现具有特定遍历顺序的迭代器，考察对迭代遍历过程和状态管理的理解。

**代表题目**：二叉搜索树迭代器

## 解题关键技巧

1. **递归是核心**：绝大多数二叉树问题都可以用递归优雅地解决。关键是定义好递归函数的含义（返回值、边界条件）。
2. **自顶向下 vs 自底向上**：自顶向下传递信息（如路径和、当前深度），自底向上汇总结果（如高度、子树节点数）。
3. **DFS 与回溯**：在深度优先遍历中，注意路径状态的恢复（回溯），避免状态污染。
4. **空节点处理**：始终考虑 root 为 nil 的边界情况，这是递归的终止条件。
5. **利用遍历性质**：不同遍历顺序有其独特的性质（如前序第一个是根、中序有序等），善于利用这些性质简化问题。

## 本章题目列表

| 题号 | 题目 | 难度 | 核心考点 |
|------|------|------|----------|
| 68 | 二叉树的最大深度 | 简单 | DFS/递归求深度 |
| 69 | 相同的树 | 简单 | 递归比较结构 |
| 70 | 翻转二叉树 | 简单 | 递归交换子树 |
| 71 | 对称二叉树 | 简单 | 递归/迭代判断对称性 |
| 72 | 从前序与中序遍历序列构造二叉树 | 中等 | 遍历序列构造树 |
| 73 | 从中序与后序遍历序列构造二叉树 | 中等 | 遍历序列构造树 |
| 74 | 填充每个节点的下一个右侧节点指针 II | 中等 | BFS/层序遍历 + 链表连接 |
| 75 | 二叉树展开为链表 | 中等 | 前序遍历 + 原地展开 |
| 76 | 路径总和 | 简单 | DFS/回溯判断路径和 |
| 77 | 求根节点到叶节点数字之和 | 中等 | DFS/前序遍历累加路径值 |
| 78 | 二叉树中的最大路径和 | 困难 | 后序遍历 + 全局最大值 |
| 79 | 二叉搜索树迭代器 | 中等 | 迭代中序遍历 / 栈 |
| 80 | 完全二叉树的节点个数 | 中等 | 二分查找 + 位运算 |
| 81 | 二叉树的最近公共祖先 | 中等 | 后序遍历递归查找 |
