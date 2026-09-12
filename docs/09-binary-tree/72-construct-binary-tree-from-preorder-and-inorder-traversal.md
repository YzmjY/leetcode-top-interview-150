# 72. 从前序与中序遍历序列构造二叉树

## 题目描述

给定两个整数数组 `preorder` 和 `inorder`，其中 `preorder` 是二叉树的**前序遍历**，`inorder` 是同一棵树的**中序遍历**，请构造二叉树并返回其根节点。

**示例 1：**

```
输入：preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
输出：[3,9,20,null,null,15,7]
```

**示例 2：**

```
输入：preorder = [-1], inorder = [-1]
输出：[-1]
```

**提示：**

- `1 <= preorder.length <= 3000`
- `inorder.length` 与 `preorder.length` 相等
- `-3000 <= preorder[i], inorder[i] <= 3000`
- `preorder` 和 `inorder` 均 **无重复** 元素。
- `inorder` 中的每个值都出现在 `preorder` 中。
- `preorder` **保证** 为二叉树的前序遍历序列。
- `inorder` **保证** 为二叉树的中序遍历序列。

## 题目分析

### 算法思路

**核心思路**：前序遍历的第一个元素一定是整棵树的根；拿到根值后，在中序遍历里找到它的位置，位置左边的所有元素属于左子树，右边属于右子树。剩下的问题就是：在前序序列中，左子树的那一段到哪里结束？由「两序列描述同一棵树」可知，中序里根左侧的元素个数就是左子树的节点数 `leftSize`，于是前序中紧跟在根之后的 `leftSize` 个元素正是左子树的前序序列，其余是右子树的前序序列。问题被切成两个同构的子问题。

核心利用前序和中序遍历的性质：

- 前序遍历：`[根, 左子树前序, 右子树前序]`
- 中序遍历：`[左子树中序, 根, 右子树中序]`

**算法步骤：**

1. 先遍历 `inorder`，建立哈希表 `值 -> 下标`，这样在中序中定位根是 O(1)。
2. 定义递归函数 `build(preLeft, preRight, inLeft, inRight)`，用闭区间下标描述一段子树：
   - 若 `preLeft > preRight`（区间为空），返回 nil；
   - 取 `preorder[preLeft]` 作为根值，创建根节点；
   - 由哈希表得到根在中序中的位置 `rootIdx`，得左子树节点数 `leftSize = rootIdx - inLeft`；
   - 左子树：前序区间 `[preLeft+1, preLeft+leftSize]`，中序区间 `[inLeft, rootIdx-1]`；
   - 右子树：前序区间 `[preLeft+leftSize+1, preRight]`，中序区间 `[rootIdx+1, inRight]`。
3. 从 `build(0, n-1, 0, n-1)` 开始，返回构造出的根节点。

### 为什么正确

关键在于两个区间的划分是精确的。设中序左半段长度为 `leftSize = rootIdx - inLeft`。中序的排列是 `[左子树中序, 根, 右子树中序]`，所以根左侧这 `leftSize` 个元素恰好是左子树的全部节点。前序的排列是 `[根, 左子树前序, 右子树前序]`，跳过根后连续 `leftSize` 个元素必然对应同一批节点，因此 `[preLeft+1, preLeft+leftSize]` 正好是左子树的前序、其后是右子树的前序。于是两个子调用的输入都是各自子树合法的前序/中序序列（长度匹配、无重复、可由同一棵树产生）。对子树规模归纳可知递归构造正确；两棵子树正确拼接在正确的根下，整棵树就与原树一致。

### 复杂度分析

- **时间复杂度**：O(n)。建表 O(n)；每个节点只被构造一次，定位根是一次 O(1) 的哈希查找。
- **空间复杂度**：O(n)。哈希表存 n 个映射；递归栈深度 O(h)，最坏 O(n)。

### 易错点 / 边界情况

- 左子树的前序区间右端点是 `preLeft + leftSize`，不是 `preLeft + leftSize - 1`：长度恰好为 `leftSize` 时，起点 `preLeft+1` 加 `leftSize-1` 才是终点。
- 空区间用 `preLeft > preRight`（闭区间口径）判断；写成 `>=` 会漏掉单节点。
- 哈希表必须由**中序**建立；用前序建表算出的 `leftSize` 没有意义。
- 题目保证两序列长度相等且元素不重复；若不保证，需要处理 `rootVal` 不在中序中的非法输入。
- 斜树时递归深度为 n（≤3000），正常可接受。

### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/72-construct-binary-tree-from-preorder-and-inorder-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="从前序与中序遍历序列构造二叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func buildTree(preorder []int, inorder []int) *TreeNode {
    // 构建中序遍历值到索引的映射
    idxMap := make(map[int]int, len(inorder))
    for i, v := range inorder {
        idxMap[v] = i
    }

    var build func(preLeft, preRight, inLeft, inRight int) *TreeNode
    build = func(preLeft, preRight, inLeft, inRight int) *TreeNode {
        if preLeft > preRight {
            return nil
        }

        // 前序第一个元素是根节点
        rootVal := preorder[preLeft]
        root := &TreeNode{Val: rootVal}

        // 在中序中找到根的位置
        rootIdx := idxMap[rootVal]
        // 左子树的节点数
        leftSize := rootIdx - inLeft

        // 递归构造左右子树
        root.Left = build(preLeft+1, preLeft+leftSize, inLeft, rootIdx-1)
        root.Right = build(preLeft+leftSize+1, preRight, rootIdx+1, inRight)

        return root
    }

    return build(0, len(preorder)-1, 0, len(inorder)-1)
}
```
