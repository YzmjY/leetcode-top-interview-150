# 87. 二叉搜索树中第 K 小的元素

## 题目描述

给定一个二叉搜索树的根节点 `root`，和一个整数 `k`，请你设计一个算法查找其中第 `k` 小的元素（从 1 开始计数）。

**示例 1：**

```
输入：root = [3,1,4,null,2], k = 1
输出：1
```

**示例 2：**

```
输入：root = [5,3,6,2,4,null,null,1], k = 3
输出：3
```

**提示：**

- 树中的节点数为 `n`。
- `1 <= k <= n <= 10^4`
- `0 <= Node.val <= 10^4`

**进阶**：如果二叉搜索树经常被修改（插入/删除操作）并且你需要频繁地查找第 k 小的值，你将如何优化算法？

## 题目分析

### 算法思路

利用 BST 中序遍历升序的性质。对 BST 进行中序遍历，得到的序列是升序排列的，因此第 k 个访问的节点就是第 k 小的元素。

**方法一：递归中序遍历**

在递归中序遍历过程中维护一个计数器 `count`，当计数到达 k 时记录结果并停止遍历。

**方法二：迭代中序遍历**

使用栈进行迭代式中序遍历，与递归方法相同：弹出第 k 个节点时返回其值。迭代法可以更方便地在找到结果后提前终止。

**进阶优化（频繁修改 + 频繁查询）**：
为每个节点维护其子树的节点数 `size`（平衡 BST 如 AVL 树），查询时可以在 O(log n) 时间内完成：比较 `leftSize + 1` 与 `k` 的关系决定向左或向右。

### 复杂度分析

- **时间复杂度**：O(h + k)，其中 h 是树的高度。需要遍历到第 k 个节点。
- **空间复杂度**：O(h)，递归栈或迭代栈的最大深度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/87-kth-smallest-element-in-a-bst-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="二叉搜索树中第 K 小的元素 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：递归中序遍历
func kthSmallest(root *TreeNode, k int) int {
    var result int
    count := 0
    var inorder func(*TreeNode)
    inorder = func(node *TreeNode) {
        if node == nil || count >= k {
            return
        }
        inorder(node.Left)
        count++
        if count == k {
            result = node.Val
            return
        }
        inorder(node.Right)
    }
    inorder(root)
    return result
}

// 方法二：迭代中序遍历
func kthSmallestIter(root *TreeNode, k int) int {
    var stack []*TreeNode
    cur := root
    for cur != nil || len(stack) > 0 {
        // 一直向左走到底
        for cur != nil {
            stack = append(stack, cur)
            cur = cur.Left
        }
        // 弹出栈顶
        cur = stack[len(stack)-1]
        stack = stack[:len(stack)-1]

        k--
        if k == 0 {
            return cur.Val
        }

        cur = cur.Right
    }
    return -1 // 不会到达这里
}
```
