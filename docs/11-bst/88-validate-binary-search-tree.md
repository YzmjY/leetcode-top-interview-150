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

**方法一：递归 + 上下界**

对于每个节点，其值必须在一个合法的范围内：
- 根节点无限制 `(-inf, +inf)`。
- 递归左子树时，上界更新为当前节点值（左子树所有节点值必须小于当前节点值）。
- 递归右子树时，下界更新为当前节点值（右子树所有节点值必须大于当前节点值）。

注意：上下界需要使用 `math.MinInt64` / `math.MaxInt64` 或使用指针类型。

**方法二：中序遍历**

对 BST 进行中序遍历应该得到一个严格递增的序列。在中序遍历过程中记录前驱节点的值，检查当前节点值是否大于前驱节点值。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(h)，递归栈深度，最坏 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/88-validate-binary-search-tree-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
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
