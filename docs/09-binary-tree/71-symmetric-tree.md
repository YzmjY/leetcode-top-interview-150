# 71. 对称二叉树

## 题目描述

给你一个二叉树的根节点 `root`，检查它是否轴对称。

**示例 1：**

```
输入：root = [1,2,2,3,4,4,3]
输出：true
```

**示例 2：**

```
输入：root = [1,2,2,null,3,null,3]
输出：false
```

**提示：**

- 树中节点数目在范围 `[1, 1000]` 内。
- `-100 <= Node.val <= 100`

**进阶**：你可以运用递归和迭代两种方法解决这个问题吗？

## 题目分析

### 算法思路

**核心思路**：轴对称并不等于「左子树和右子树相同」。示例 2 就是一个明显的反例：`[1,2,2,null,3,null,3]` 左右子树的值集合一样，但结构一左一右，并不对称。正确的刻画是「两棵子树互为镜像」：左子树的**左**边要对着右子树的**右**边。

于是把问题转化成：判断两棵子树是否互为镜像。两棵树互为镜像的条件：
1. 它们的根节点值相等；
2. 每棵树的左子树与另一棵树的右子树互为镜像（同时每棵树的右子树与另一棵树的左子树互为镜像）。

**方法一：递归**

定义一个辅助函数 `isMirror(left, right)`，递归比较：
- 两个节点都为空：true（镜像位置都为空）；
- 一个为空：false（结构不同）；
- 值不相等：false；
- 递归比较 `left.Left` 与 `right.Right`，以及 `left.Right` 与 `right.Left`，两者都要成立。

主函数对空树返回 true，否则调用 `isMirror(root.Left, root.Right)`。

**方法二：迭代（队列）**

用队列模拟上面的递归：队列里始终按「待比较的成对节点」存放。初始把 `root.Left`、`root.Right` 成对入队；只要队列里还剩至少两个元素，就取出最前面的两个节点做同样的三项判断，然后把 `(left.Left, right.Right)`、`(left.Right, right.Left)` 两对依次入队。队列耗尽仍未出现矛盾即对称。

### 为什么正确

`isMirror` 的定义与「镜像」的递归定义一一对应：两棵子树互为镜像 ⟺ 根值相同、且一方的左子树与另一方的右子树互为镜像。对子树高度归纳：基础情形（都空、一方空、值不同）判断显然正确；其余情形下，由归纳假设两个子调用正确判定两对深层子树，二者的 `&&` 即整体判定。迭代版本只是把这一对对比较显式排队：每次从队首取出的两个节点恰好是镜像位置的一对，入队顺序保证深层比较的配对关系不被破坏，因此与递归版本等价。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点被访问一次。
- **空间复杂度**：递归版 O(h)（h 为树高）；迭代版 O(n)，队列中最多同时存放一整层节点（最宽一层约 n/2 个）。

### 易错点 / 边界情况

- 递归时要交叉比较 `left.Left ↔ right.Right`、`left.Right ↔ right.Left`，写成 `left.Left ↔ right.Left` 就退化成「两棵子树相同」了。
- 迭代版本中「两个都为空」要用 `continue` 而不是 `return true`，因为队列里可能还有其它待比较的节点对。
- `len(queue) >= 2` 与 `len(queue) > 0` 在本写法下等价（成对入队保证长度恒为偶数），但不能只取一个元素。
- 空树视为对称（返回 true）；题目约束 n ≥ 1，但代码不应因此崩溃。
- 节点值可为负数，判断「值为空」只能靠指针是否为 nil。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/71-symmetric-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="对称二叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：递归
func isSymmetric(root *TreeNode) bool {
    if root == nil {
        return true
    }
    return isMirror(root.Left, root.Right)
}

func isMirror(left, right *TreeNode) bool {
    if left == nil && right == nil {
        return true
    }
    if left == nil || right == nil {
        return false
    }
    if left.Val != right.Val {
        return false
    }
    // 左的左 vs 右的右；左的右 vs 右的左
    return isMirror(left.Left, right.Right) && isMirror(left.Right, right.Left)
}

// 方法二：迭代（队列）
func isSymmetricIter(root *TreeNode) bool {
    if root == nil {
        return true
    }
    queue := []*TreeNode{root.Left, root.Right}
    for len(queue) >= 2 {
        left := queue[0]
        right := queue[1]
        queue = queue[2:]
        if left == nil && right == nil {
            continue
        }
        if left == nil || right == nil {
            return false
        }
        if left.Val != right.Val {
            return false
        }
        queue = append(queue, left.Left, right.Right)
        queue = append(queue, left.Right, right.Left)
    }
    return true
}
```
