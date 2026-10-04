# 108. 将有序数组转换为二叉搜索树

## 题目描述

给你一个整数数组 `nums`，其中元素已经按**升序**排列，请你将其转换为一棵**高度平衡**二叉搜索树。

**高度平衡**二叉树是一棵满足「每个节点的左右两个子树的高度差的绝对值不超过 1」的二叉树。

**示例 1：**

```
输入：nums = [-10,-3,0,5,9]
输出：[0,-3,9,-10,null,5]
解释：[0,-10,5,null,-3,null,9] 也将被视为正确答案。
```

**示例 2：**

```
输入：nums = [1,3]
输出：[3,1]
解释：[1,null,3] 和 [3,1] 都是高度平衡二叉搜索树。
```

**约束条件：**

- `1 <= nums.length <= 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 按严格递增顺序排列

## 题目分析

**核心思路：**

把问题拆成三个已知事实：

1. 对一棵 BST 做中序遍历，得到的序列恰好是升序序列；
2. 题目给出的数组本身就是升序的，所以只要构造的树「中序等于原数组」，它自动满足 BST 性质；
3. 为了让左右子树高度差不超过 1，根节点应当把数组尽量均分。

由此得到关键想法：**让区间中间的元素当根**。这样左半段与右半段的长度最多相差 1，再对两段递归做同样的事，每一层的子树元素数都不会相差超过 1，树自然平衡。

**为什么「中间元素当根」是安全的？** 数组严格递增，任选一个元素当根都能构造出合法的 BST；选中间元素只是额外获得了平衡性，不会破坏 BST 性质。

**算法步骤：**

设当前要处理的区间是闭区间下标 `[left, right]`：

1. 若 `left > right`，区间为空，返回 `nil`（递归出口）。
2. 取 `mid = left + (right-left)/2`（下中位数，避免 `left+right` 溢出）。
3. 以 `nums[mid]` 为值创建根节点。
4. 递归构建左子树 `build(left, mid-1)`、右子树 `build(mid+1, right)`，分别挂到根上。
5. 返回根。顶层调用 `build(0, len(nums)-1)`。

**不变量**：进入 `build(left, right)` 时，`nums[left..right]` 是原数组的一段连续升序区间，函数返回的子树恰好包含且只包含这段元素。

**分治三步：**

1. **分解**：选择中间元素作为根，将数组分为左右两部分
2. **解决**：递归构建左右子树
3. **合并**：将左右子树挂在根节点上

**为什么正确（正确性论证）：**

- **BST 性**（对区间长度归纳）：`nums[left..mid-1]` 中的元素都严格小于 `nums[mid]`，`nums[mid+1..right]` 中的元素都严格大于 `nums[mid]`，且递归调用保证左右子树分别是 BST，因此整棵树是 BST。
- **中序等于原数组**：由归纳假设，左子树中序为 `nums[left..mid-1]`、右子树中序为 `nums[mid+1..right]`，按「左—根—右」拼接即得 `nums[left..right]`。
- **高度平衡**：设长度为 k 的区间构造出的树高为 `T(k)`，左右子区间长度分别为 `⌊(k-1)/2⌋` 与 `⌈(k-1)/2⌉`，相差不超过 1，故 `T(k) = 1 + T(⌈(k-1)/2⌉)`，即 `T(k) = O(log k)`，任意节点的左右子树高度差不超过 1。

**时间复杂度：** O(n)，每个元素被访问一次、恰好创建一个节点。

**空间复杂度：** O(log n)，递归栈深度等于树高（平衡树高度为 O(log n)）。返回的树本身需要 O(n) 空间，但不计入额外空间。

**易错点 / 边界情况：**

- **递归出口必须写 `left > right`**，不能写 `left == right`，否则单元素区间无法终止。
- **空数组**：`build(0, -1)` 应立即返回 `nil`，不应 panic（约束下 n ≥ 1）。
- **中位数取法影响树形**：取上中位数或下中位数得到的都是正确答案，但形状不同。本代码取**下中位数**，对 `[-10,-3,0,5,9]` 得到 `[0,-10,5,null,-3,null,9]`（即题面「解释」中列出的另一组正确答案），而题面示例的 `[0,-3,9,-10,null,5]` 对应上中位数。
- **溢出**：`mid` 用 `left + (right-left)/2` 而不是 `(left+right)/2`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/108-convert-sorted-array-to-binary-search-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="将有序数组转换为二叉搜索树 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// TreeNode 二叉树节点定义
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// sortedArrayToBST 将有序数组转换为平衡 BST
func sortedArrayToBST(nums []int) *TreeNode {
    var build func(left, right int) *TreeNode
    build = func(left, right int) *TreeNode {
        if left > right {
            return nil
        }
        mid := left + (right-left)/2 // 取中间偏左，保证平衡
        root := &TreeNode{Val: nums[mid]}
        root.Left = build(left, mid-1)
        root.Right = build(mid+1, right)
        return root
    }
    return build(0, len(nums)-1)
}

// inorder 中序遍历验证结果
func inorder(root *TreeNode) {
    if root == nil {
        return
    }
    inorder(root.Left)
    fmt.Printf("%d ", root.Val)
    inorder(root.Right)
}

func main() {
    nums := []int{-10, -3, 0, 5, 9}
    root := sortedArrayToBST(nums)
    inorder(root) // 输出: -10 -3 0 5 9
    fmt.Println()
}
```
