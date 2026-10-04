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

**核心思路**：中序遍历要「左、根、右」，逐个产出的顺序不能靠一次遍历预先算出来（否则预处理就是 O(n)，空间也 O(n)）。但递归中序遍历有一个天然的中间状态：**当前节点 + 尚未访问的左祖先链**——它恰好就是递归调用栈里的内容。把这个调用栈用数组显式保存下来，就能随时暂停、恢复，这就是迭代器。初始时沿左子树一路压栈到底，栈顶就是 BST 的最小元素。

**初始化 `Constructor` / `pushLeft`**：从给定节点出发，沿着 `Left` 一路压栈到底。辅助函数 `pushLeft` 对任意节点都适用。

**next() 操作**：
1. 弹出栈顶元素，这是当前要返回的节点（它的左子树已经全部访问完）。
2. 如果该节点有右子树，对右子节点调用 `pushLeft`，把右子树的最左路径压入栈——按中序，右子树全部节点都要在返回该节点之后才访问。
3. 返回该节点的值。

**hasNext() 操作**：栈非空即有下一个元素。

### 为什么正确

不变量：把栈中的节点**从栈顶到栈底**读出来，恰好是「所有尚未访问节点按中序排列」的前缀；因此**栈顶永远是中序序列中下一个要访问的节点**。初始化时从根一路向左压栈到底，栈顶为最小元素，满足条件。`next()` 弹出栈顶 `u`：`u` 的左子树此前已被完整访问（左子树中的节点都曾被压在 `u` 之上并已弹出），所以 `u` 正是中序的下一个元素；随后若 `u` 有右子树，把右子树的最左链压栈。中序中 `u` 的后继就是右子树的最左节点，这些新压入的节点在顺序上都排在旧栈元素之前，压栈后新栈顶即后继，不变量保持。由归纳可知每次 `Next()` 返回的元素就是中序序列的下一项，`HasNext()` 判断栈是否为空也正好对应「还有没有未访问节点」。

均摊复杂度：虽然单次 `next()` 可能压入 O(h) 个节点，但同一个节点一生只入栈一次、出栈一次，n 次 `next()` 的总压栈次数不超过 n，因此均摊到每次操作是 O(1)。单次最坏仍是 O(h)，这是「均摊」而非「每次严格 O(1)」的含义。

### 复杂度分析

- **时间复杂度**：均摊 O(1)（`next` 和 `hasNext`）；单次最坏 O(h)。
- **空间复杂度**：O(h)，栈的最大深度为树的高度，最坏 O(n)。

### 易错点 / 边界情况

- 初始化必须从 `root` 一路压左到底，只压 `root` 会漏掉更小的元素。
- `next()` 中压栈的是**右子树的最左路径**（对 `node.Right` 调用 `pushLeft`），不是只压右子节点本身。
- `hasNext()` 只判断栈是否为空，与 `next()` 的调用次数无关。
- BST 值范围 `[0, 10^6]`，可能包含 0，不能用 `0` 表示「没有下一个」。
- 题目保证 `next()` 调用时一定存在下一个元素，因此不必在 `next()` 里判空；但真实使用中最好加保护。
- 题目说的「指针初始化为一个不存在于 BST 中的数字，且小于任何元素」在迭代器实现里体现为「初始栈顶即最小元素」，不必真的存一个哨兵值。
- 本题的方法可同样用于「验证二叉搜索树」「第 k 小的元素」等需要中序序列的题目。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/79-binary-search-tree-iterator-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
