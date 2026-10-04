# 88. 验证二叉搜索树

## 题目描述

给你一个二叉树的根节点 `root`，判断其是否是一个有效的二叉搜索树。

**有效** 二叉搜索树定义如下：

- 节点的左子树只包含 **小于** 当前节点的数。
- 节点的右子树只包含 **大于** 当前节点的数。
- 所有左子树和右子树自身必须也是二叉搜索树。

**示例 1：**

```
输入：root = [2,1,3]
输出：true
```

**示例 2：**

```
输入：root = [5,1,4,null,null,3,6]
输出：false
解释：根节点的值是 5，但是右子节点的值是 4。
```

**提示：**

- 树中节点数目范围在 `[1, 10^4]` 内。
- `-2^31 <= Node.val <= 2^31 - 1`

## 题目分析

### 算法思路

**先看一个陷阱**：只检查「每个节点 > 左孩子 且 < 右孩子」是**不够的**。例如

```
      10
     /  \
    5    15
        /
       6
```

每个父子关系都成立，但节点 6 位于 10 的右子树中，却比 10 小，整棵树并不是 BST。原因在于 BST 的要求是**整棵子树的值域约束**，而不是局部的父子比较：左子树中的**每一个**节点都必须小于根，右子树中的**每一个**节点都必须大于根。因此递归时需要把「允许的值域区间」一路传下去并不断收窄。

**方法一：递归 + 上下界（开区间）**

`validate(node, lower, upper)` 表示「node 及其整棵子树的所有值必须落在开区间 `(lower, upper)` 内」：

- 根节点调用 `validate(root, nil, nil)`，即 `(-∞, +∞)`；
- 进入左子树时，上界收窄为当前节点值：`validate(node.Left, lower, &node.Val)`；
- 进入右子树时，下界收窄为当前节点值：`validate(node.Right, &node.Val, upper)`。

每个节点先检查 `lower < node.Val < upper`（对应代码中的 `node.Val <= *lower` 或 `node.Val >= *upper` 即返回 false），再递归检查两棵子树。上下界用 `*int` 表示，`nil` 代表无穷边界，这样当节点值取到 `int32` 的最小/最大值时也不会被误判（用 `math.MinInt32` 之类的哨兵整数会出错）。

**方法二：中序遍历**

BST 的中序遍历序列严格递增，反之亦然。因此只需做一次中序遍历，随时用 `prev` 记录前驱节点的值，检查当前值是否**严格大于**前驱；一旦不满足就返回 false。

### 为什么正确

**方法一**：需要证明的不变量是——`validate(node, lower, upper)` 返回 true 当且仅当「以 node 为根的子树中所有节点的值都严格落在 `(lower, upper)` 内，且该子树内部满足 BST 性质」。对子树高度归纳：

- 空子树直接为 true；
- 若 `node.Val` 不在 `(lower, upper)` 内则必不满足（当前节点本身就违反祖先施加的约束）；
- 否则，`node.Left` 中所有值必须同时满足「落在外层的 `(lower, upper)` 内」和「小于 `node.Val`」，合并即落在 `(lower, node.Val)` 内，正是对左子树的递归调用；右子树同理为 `(node.Val, upper)`。两棵子树都成立时整棵子树成立。

根节点的区间是全体整数，于是「整棵树成立」等价于题目定义的 BST。

**方法二**：BST 的中序序列严格递增，这是 BST 定义直接归纳出的结论；中序序列严格递增也反过来保证每个节点的左子树值都小于它、右子树值都大于它。算法逐一检查相邻中序元素是否严格递增，因此判断结果正确。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点恰好被访问一次（两个方法都是）。
- **空间复杂度**：O(h)，递归栈深度，h 为树高；链状树最坏 O(n)。方法二只额外用了 O(1) 的前驱指针。

### 易错点 / 边界情况

- **必须严格比较**：题目要求左子树「小于」、右子树「大于」，因此**重复值非法**。`[1,1]`、`[2,2,3]` 都应返回 false；写成 `<=` / `>=` 会误判。
- **哨兵值陷阱**：节点值域是完整的 `[-2^31, 2^31-1]`，用 `math.MinInt32` / `math.MaxInt32` 当初始边界会把「根的值恰好等于边界」的合法树判成非法。用 `nil` 指针（本解法）或 `int64` 上下界才安全。
- **只比父子会漏判**：如上面的 10/5/15/6 例子，必须传递区间或改用中序。
- 方法二里 `prev` 要在检查**之后**才更新，且比较也必须是严格大于。
- 空树（`nil`）视为合法 BST，递归自然返回 true；题目约束 `n >= 1`，但测试时常用到空树。
- 递归深度可达 10^4：Go 的栈会自动增长，但若用固定栈的语言需要改成显式栈的迭代中序。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/88-validate-binary-search-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="验证二叉搜索树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：递归上下界
func isValidBST(root *TreeNode) bool {
    return validate(root, nil, nil)
}

func validate(node *TreeNode, lower, upper *int) bool {
    if node == nil {
        return true
    }
    // 检查当前节点是否在合法范围内
    if lower != nil && node.Val <= *lower {
        return false
    }
    if upper != nil && node.Val >= *upper {
        return false
    }
    // 递归验证左右子树
    return validate(node.Left, lower, &node.Val) &&
        validate(node.Right, &node.Val, upper)
}

// 方法二：中序遍历
func isValidBSTInorder(root *TreeNode) bool {
    var prev *int
    var inorder func(*TreeNode) bool
    inorder = func(node *TreeNode) bool {
        if node == nil {
            return true
        }
        if !inorder(node.Left) {
            return false
        }
        if prev != nil && node.Val <= *prev {
            return false
        }
        prev = &node.Val
        return inorder(node.Right)
    }
    return inorder(root)
}
```
