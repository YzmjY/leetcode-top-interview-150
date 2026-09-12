# 80. 完全二叉树的节点个数

## 题目描述

给你一棵 **完全二叉树** 的根节点 `root`，求出该树的节点个数。

完全二叉树的定义如下：在完全二叉树中，除了最底层节点可能没填满外，其余每层节点数都达到最大值，并且最下面一层的节点都集中在该层最左边的若干位置。若最底层为第 h 层（从第 0 层开始），则该层最多包含 `2^h` 个节点。

**示例 1：**

```
输入：root = [1,2,3,4,5,6]
输出：6
```

**示例 2：**

```
输入：root = []
输出：0
```

**示例 3：**

```
输入：root = [1]
输出：1
```

**提示：**

- 树中节点的数目范围是 `[0, 5 * 10^4]`。
- `0 <= Node.val <= 5 * 10^4`
- 题目数据保证输入的树是 **完全二叉树**。

**进阶**：遍历树来统计节点是一种时间复杂度为 O(n) 的简单解决方案。你可以设计一个更快的算法吗？

## 题目分析

### 算法思路

**核心思路**：如果树是**满二叉树**，节点数可以直接用公式 `2^h - 1` 算出来，不需要遍历。完全二叉树的好处在于：它的左右子树中至少有一棵是满二叉树，于是可以「满的那棵用公式，不满的那棵继续递归」。关键问题是判断哪一棵是满的——只要比较两棵子树的**最左路径长度**就知道了。

**方法一：暴力递归 O(n)**

直接递归统计：`countNodes(root) = 1 + countNodes(root.Left) + countNodes(root.Right)`

**方法二：利用完全二叉树性质 O((log n)^2)**

完全二叉树的特点：除最后一层外都是满的，可以利用满二叉树节点数公式。

判断哪棵子树是满二叉树（注意 `leftH`、`rightH` 衡量的是**子树**的高度，即该子树最左路径上的**节点数**）：
- `leftH` = 从 `root.Left` 出发一路向左走到底的节点数，也就是左子树的高度。
- `rightH` = 从 `root.Right` 出发一路向左走到底的节点数，也就是右子树的高度。
- 若 `leftH == rightH`，说明**左子树**是高度为 `leftH` 的满二叉树（`2^leftH - 1` 个节点），
  于是总节点数 = 左子树 + 根节点 + 递归右子树 = `2^leftH + countNodes(root.Right)`。
- 否则**右子树**是高度为 `rightH` 的满二叉树，总节点数 = `2^rightH + countNodes(root.Left)`。

无论走哪个分支，都只对一侧子树继续递归，另一侧用公式直接算出，因此每层只需
O(log n) 求高度，递归深度 O(log n)，合计 O((log n)^2)。

### 为什么正确

先说明两棵子树的高度关系。设左子树高度为 `leftH`（最左路径必然走到左子树最底层，所以它等于左子树高度），右子树高度为 `rightH`（同理）。完全二叉树除最后一层外每层都是满的，且第 `leftH - 1` 层（相对整棵树）不是最后一层，它必须填满——因此右子树的高度不可能小于 `leftH - 1`；又因为节点是从左往右填的，右子树也不会比左子树更高。所以只有两种可能：`rightH == leftH` 或 `rightH == leftH - 1`。

- `rightH == leftH`：右子树的高度与左子树相同，说明整棵树的最底层在右子树里也有节点。而最底层是从左往右填的，右子树能填到这一层，意味着左子树的最底层已经全部填满，配合「除最后一层外每层都满」，左子树是高度 `leftH` 的满二叉树，节点数 `2^leftH - 1`；加上根节点即 `2^leftH + countNodes(root.Right)`。
- `rightH == leftH - 1`：整棵树的最底层在右子树中不存在，说明右子树占用的每一层都是满的，即右子树是高度 `rightH` 的满二叉树，节点数 `2^rightH - 1`；加上根节点即 `2^rightH + countNodes(root.Left)`。

对子树规模归纳：满的那棵用公式一次算出（公式正确），另一棵由归纳假设正确统计，相加即整棵树的节点数。

复杂度来源：每次递归先做两次「沿左链走到底」的求高度操作，各 O(log n)（完全二叉树高度 O(log n)）；每次递归只进入一侧，规模至少减半，递归层数 O(log n)。故时间 O((log n)^2)。

### 复杂度分析

- **方法一**：时间 O(n)，空间 O(h)（递归栈，完全二叉树 h = O(log n)）。
- **方法二**：时间 O((log n)^2)，每层判断高度 O(log n)，共 O(log n) 层；空间 O(log n)，递归栈深度。

### 易错点 / 边界情况

- `leftH`、`rightH` 是**子树**的高度（节点数），不是整棵树的高度。因为根自身占一层，用 `1 << leftH` 时已经隐含包含了根节点，写成 `1 << (leftH + 1)` 会多算一整层——这是本题最常见的错误（用满二叉树 `[1,2,3,4,5,6,7]` 一测即知）。
- `leftH == rightH` 时判定为满的是**左子树**，要递归的是**右子树**；两个分支不要写反。
- 两个高度都沿 `Left` 方向求（「最左路径」），保持口径一致。
- 空节点返回 0；单节点树 `leftH == rightH == 0`，返回 `1<<0 + count(nil) = 1`，正确。
- 该算法**依赖完全二叉树**这一前提；对一般二叉树会算错，不能当作通用求节点数的算法。
- `n <= 5 * 10^4`，`1 << leftH` 不会溢出。
- 递归深度是 O(log n)，不会像斜树那样退化成 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/80-count-complete-tree-nodes-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="完全二叉树的节点个数 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：暴力递归 O(n)
func countNodes(root *TreeNode) int {
    if root == nil {
        return 0
    }
    return 1 + countNodes(root.Left) + countNodes(root.Right)
}

// 方法二：利用完全二叉树性质 O((log n)^2)
func countNodesFast(root *TreeNode) int {
    if root == nil {
        return 0
    }

    // 计算左右子树最左路径的高度
    leftH := 0
    for cur := root.Left; cur != nil; cur = cur.Left {
        leftH++
    }
    rightH := 0
    for cur := root.Right; cur != nil; cur = cur.Left {
        rightH++
    }

    // 如果左右子树的最左路径高度相同，说明左子树是满二叉树
    if leftH == rightH {
        // 左子树 2^leftH - 1 个节点，加上根节点自身，再加上右子树递归结果
        return (1 << leftH) + countNodesFast(root.Right)
    }
    // 否则右子树是满二叉树（高度为 rightH），左子树继续递归
    return (1 << rightH) + countNodesFast(root.Left)
}
```
