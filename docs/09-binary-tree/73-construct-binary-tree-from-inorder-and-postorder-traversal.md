# 73. 从中序与后序遍历序列构造二叉树

## 题目描述

给定两个整数数组 `inorder` 和 `postorder`，其中 `inorder` 是二叉树的**中序遍历**，`postorder` 是同一棵树的**后序遍历**，请你构造并返回这颗二叉树。

**示例 1：**

```
输入：inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]
输出：[3,9,20,null,null,15,7]
```

**示例 2：**

```
输入：inorder = [-1], postorder = [-1]
输出：[-1]
```

**提示：**

- `1 <= inorder.length <= 3000`
- `postorder.length == inorder.length`
- `-3000 <= inorder[i], postorder[i] <= 3000`
- `inorder` 和 `postorder` 都由 **不同** 的值组成。
- `postorder` 中每一个值都在 `inorder` 中。
- `inorder` **保证**是树的中序遍历。
- `postorder` **保证**是树的后序遍历。

## 题目分析

### 算法思路

**核心思路**：中序的分割方式与前序版本完全相同（根把中序切成左右两段），区别只在于根的位置：后序遍历中根在**最后**。因此可以用一个从后往前移动的下标 `postIdx` 依次取根；同时，从后往前遇到的下一个根先属于**右**子树（因为后序是 `[左, 右, 根]`，去掉根后末尾是右子树的根），所以必须先递归右子树、再递归左子树，才能让 `postIdx` 始终落在正确的位置上。

核心利用后序和中序的性质：

- 后序遍历：`[左子树后序, 右子树后序, 根]`
- 中序遍历：`[左子树中序, 根, 右子树中序]`

注意与前序+中序的区别：
- 前序的第一个元素是根，后序的**最后一个**元素是根。
- 因此需要从后往前处理 postorder。

**算法步骤：**

1. 建立 `inorder` 的值到下标映射。
2. 令 `postIdx = n-1`，它指向「当前子树根」在后序中的位置。
3. 定义 `build(inLeft, inRight)`：
   - 若 `inLeft > inRight`，返回 nil；
   - 取 `postorder[postIdx]` 为根值，`postIdx--`；
   - 由映射得到 `rootIdx`；
   - **先**递归构造右子树 `build(rootIdx+1, inRight)`，**再**构造左子树 `build(inLeft, rootIdx-1)`。
4. 返回 `build(0, n-1)`。

### 为什么正确

从后往前看：整棵树的后序最后一个元素是根，去掉它之后，剩余部分按 `[左子树后序][右子树后序]` 排列，其末尾就是右子树的根（若右子树非空）。右子树的节点个数由中序确定为 `inRight - rootIdx`，先递归右子树恰好消耗掉 `postIdx` 前面的这么多个位置，使 `postIdx` 随后正好指向左子树的根。每次递归处理的都是「一段合法子树的中序区间 + 后序中对应的一段」，左右端点与中序划分一致；对子树规模归纳，每个子树的构造都正确，且右子树的构造先于左子树、取根顺序与后序从后往前的顺序一致，故最终得到的树中序、后序均与原输入吻合。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次，哈希查找 O(1)。
- **空间复杂度**：O(n)，哈希表存储 n 个映射；递归栈深度 O(h)，最坏 O(n)。

### 易错点 / 边界情况

- 必须**先右后左**。若照搬前序版本的「先左后右」，`postIdx` 取到的根会错位，得到的树左右颠倒甚至结构错误。
- `postIdx` 是递归外层的共享变量，其正确性完全依赖递归顺序。
- 根取 `postorder[postIdx]`（从后往前），不要写成 `postorder[0]`。
- 空区间判断是 `inLeft > inRight`；单元素 `inorder` 时 `postIdx` 从 0 开始，构造后变成 -1，不再被访问，不会越界。
- 哈希表仍由中序建立。
- 元素不重复是「值 -> 下标」映射唯一的前提。

### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/73-construct-binary-tree-from-inorder-and-postorder-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="从中序与后序遍历序列构造二叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func buildTree(inorder []int, postorder []int) *TreeNode {
    // 构建中序遍历值到索引的映射
    idxMap := make(map[int]int, len(inorder))
    for i, v := range inorder {
        idxMap[v] = i
    }

    // postIdx 从后往前遍历 postorder
    postIdx := len(postorder) - 1

    var build func(inLeft, inRight int) *TreeNode
    build = func(inLeft, inRight int) *TreeNode {
        if inLeft > inRight {
            return nil
        }

        // 后序遍历的最后一个元素是根节点
        rootVal := postorder[postIdx]
        postIdx--
        root := &TreeNode{Val: rootVal}

        // 在中序中找到根的位置
        rootIdx := idxMap[rootVal]

        // 先构造右子树，再构造左子树（因为 postorder 从后往前：根-右-左）
        root.Right = build(rootIdx+1, inRight)
        root.Left = build(inLeft, rootIdx-1)

        return root
    }

    return build(0, len(inorder)-1)
}
```
