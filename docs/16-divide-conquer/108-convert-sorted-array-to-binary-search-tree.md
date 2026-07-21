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

利用分治思想和二叉搜索树的性质：中序遍历有序数组即得到升序序列。因此，选择数组的**中间元素**作为根节点，左半部分递归构建左子树，右半部分递归构建右子树，即可保证高度平衡。

**分治三步：**

1. **分解**：选择中间元素作为根，将数组分为左右两部分
2. **解决**：递归构建左右子树
3. **合并**：将左右子树挂在根节点上

**时间复杂度：** O(n)，每个元素访问一次。

**空间复杂度：** O(log n)，递归栈深度（平衡树高度）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/108-convert-sorted-array-to-binary-search-tree-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
