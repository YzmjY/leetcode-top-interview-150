# 79. 二叉搜索树迭代器

## 题目描述

实现一个二叉搜索树迭代器类 `BSTIterator`，表示一个按中序遍历二叉搜索树（BST）的迭代器：

- `BSTIterator(TreeNode root)`：初始化 BSTIterator 类的一个对象。BST 的根节点 `root` 会作为构造函数的一部分给出。指针应初始化为一个不存在于 BST 中的数字，且该数字小于 BST 中的任何元素。
- `int next()`：将指针向右移动，然后返回指针处的数字。
- `boolean hasNext()`：如果向指针右侧遍历存在数字，则返回 `true`；否则返回 `false`。

注意，指针初始化为一个不存在于 BST 中的数字，所以对 `next()` 的首次调用将返回 BST 中的最小元素。

你可以假设 `next()` 调用总是有效的，也就是说，当调用 `next()` 时，BST 的中序遍历中至少存在一个下一个数字。

**示例：**

```
输入：
["BSTIterator", "next", "next", "hasNext", "next", "hasNext", "next", "hasNext", "next", "hasNext"]
[[[7, 3, 15, null, null, 9, 20]], [], [], [], [], [], [], [], [], []]
输出：
[null, 3, 7, true, 9, true, 15, true, 20, false]

解释：
BSTIterator bSTIterator = new BSTIterator([7, 3, 15, null, null, 9, 20]);
bSTIterator.next();    // 返回 3
bSTIterator.next();    // 返回 7
bSTIterator.hasNext(); // 返回 True
bSTIterator.next();    // 返回 9
bSTIterator.hasNext(); // 返回 True
bSTIterator.next();    // 返回 15
bSTIterator.hasNext(); // 返回 True
bSTIterator.next();    // 返回 20
bSTIterator.hasNext(); // 返回 False
```

**提示：**

- 树中节点的数目在范围 `[1, 10^5]` 内。
- `0 <= Node.val <= 10^6`
- 最多调用 `10^5` 次 `hasNext` 和 `next` 操作。

**进阶**：你可以设计一个满足下述条件的解决方案吗？`next()` 和 `hasNext()` 操作均摊时间复杂度为 O(1)，并使用 O(h) 内存。其中 `h` 是树的高度。

## 题目分析

### 算法思路

本题本质是模拟迭代式中序遍历。使用一个栈来保存从根节点到当前节点的路径。

**初始化**：从根节点出发，沿着左子树一路压栈到底，栈顶即为最小元素。

**next() 操作**：
1. 弹出栈顶元素，这是当前要返回的节点。
2. 如果该节点有右子树，则将右子节点及其所有左子孙压入栈中（因为中序遍历中，右子树的遍历在返回根之后进行）。

**hasNext() 操作**：判断栈是否为空。

这种方法的均摊时间复杂度为 O(1)：虽然单次 next() 可能压入多个节点（O(h)），但每个节点恰好被压栈和出栈各一次，n 次操作总时间为 O(n)。

### 复杂度分析

- **时间复杂度**：均摊 O(1)（next 和 hasNext）。
- **空间复杂度**：O(h)，栈的最大深度为树的高度，最坏 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/79-binary-search-tree-iterator-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="二叉搜索树迭代器 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

type BSTIterator struct {
    stack []*TreeNode
}

func Constructor(root *TreeNode) BSTIterator {
    iter := BSTIterator{stack: []*TreeNode{}}
    iter.pushLeft(root)
    return iter
}

// 将节点及其所有左子节点压入栈中
func (iter *BSTIterator) pushLeft(node *TreeNode) {
    for node != nil {
        iter.stack = append(iter.stack, node)
        node = node.Left
    }
}

func (iter *BSTIterator) Next() int {
    // 弹出栈顶
    node := iter.stack[len(iter.stack)-1]
    iter.stack = iter.stack[:len(iter.stack)-1]

    // 如果有右子树，将右子树的所有左子节点压栈
    if node.Right != nil {
        iter.pushLeft(node.Right)
    }

    return node.Val
}

func (iter *BSTIterator) HasNext() bool {
    return len(iter.stack) > 0
}
```
