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

**核心观察**：BST 的中序遍历序列是**严格升序**的，所以「第 k 小的元素」就是**中序遍历时第 k 个被访问的节点**。于是题目退化成「按中序顺序数到第 k 个就停」，不需要真的建出数组。

**方法一：递归中序遍历**

在递归过程中维护计数器 `count`。每次「处理当前节点」（即中序访问到它的时刻）执行 `count++`，当 `count == k` 时记录答案 `result = node.Val` 并立刻返回。为了让已经找到答案后不再做无谓遍历，递归入口加一条 `count >= k` 的判断：一旦找到答案，栈上所有尚未返回的调用都会在入口处直接返回，从而提前结束整个遍历。

**方法二：迭代中序遍历**

用显式栈模拟中序：先沿左链一路压栈，然后弹栈访问节点（`k--`），再转向右子树，重复。当 `k == 0` 时弹出的节点就是答案，直接 `return`。迭代写法把「走到底」和「访问节点」分成两层循环，提前退出更直接，也不受递归深度限制。

**进阶优化（BST 频繁插入/删除 + 频繁查询第 k 小）**

给每个节点额外维护 `size`（以它为根的子树节点数）。查询时设 `leftSize = size(node.Left)`：

- 若 `k == leftSize + 1`，当前节点就是第 k 小；
- 若 `k <= leftSize`，答案在左子树，往左走；
- 否则答案在右子树，令 `k -= leftSize + 1` 后往右走。

配合平衡树（AVL、红黑树），`size` 可在旋转时 O(1) 维护，单次查询 O(log n)。若不加平衡，树退化成链时仍是 O(n)。

### 为什么正确

BST 的定义是：对任一节点，其**左子树所有值 < 节点值 < 右子树所有值**。中序遍历的访问顺序是「左子树 -> 当前节点 -> 右子树」，按此定义归纳可得：中序访问序列严格递增。既然序列严格递增，第 k 个被访问的节点值就是序列中第 k 小的值，即整棵树中第 k 小的元素。

提前终止的正确性：算法只把「访问节点」这一事件计入 `count`，而中序顺序不受提前返回影响——无论何时停止，已经数过的节点一定是升序序列的前缀，所以第 k 次计数对应的节点就是答案。找到后因 `count >= k` 而在入口处返回，只会跳过更靠后的节点，不会改变答案。

**方法二的等价性**：迭代法用栈模拟同一套「左 -> 根 -> 右」的访问顺序（一直向左压栈直到空，弹出即访问，再转向右子树），因此两次 `k--` 之间弹出的节点顺序与递归法完全一致。

### 复杂度分析

- **时间复杂度**：O(h + k)。h 是树高，先沿左链走到最小元素需要 O(h)，之后每「计数」一个节点均摊 O(1)，数到第 k 个即停止；递归法中沿途经过但未计数的节点同样构成 O(h) 量级。最坏（k = n）时是 O(n)。
- **空间复杂度**：O(h)，递归栈或迭代栈的最大深度；链状树退化为 O(n)。

### 易错点 / 边界情况

- `k` 从 **1** 开始计数，而访问计数 `count` 也必须在「处理节点时」自增一次，不能写成从 0 开始的下标。
- 递归法必须在找到答案后**停止继续递归右子树**：`count >= k` 的入口判断不能省，否则虽然答案正确，但会白白遍历完整棵树（复杂度退化为 O(n)）。
- 迭代法里 `cur = cur.Right` 要放在弹出并处理完节点之后；顺序颠倒会丢掉右子树。
- `k == n` 时答案是整棵树的最大值（中序最后一个节点），不要漏掉对最右链的处理。
- 方法二末尾的 `return -1` 在题目约束（`1 <= k <= n`）下不可达，只是编译器要求的兜底返回，不要把它当成合法输出。
- 空树与 `k` 越界在本题约束下不会出现，但递归实现仍要保留 `node == nil` 的出口。
- 迭代法在链状树上不需要递归深度，是递归实现可能栈溢出时的替代方案。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/87-kth-smallest-element-in-a-bst-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
