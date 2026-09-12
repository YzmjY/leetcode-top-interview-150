# 75. 二叉树展开为链表

## 题目描述

给你二叉树的根结点 `root`，请你将它展开为一个单链表：

- 展开后的单链表应该同样使用 `TreeNode`，其中 `right` 子指针指向链表中下一个结点，而左子指针始终为 `null`。
- 展开后的单链表应该与二叉树 **先序遍历** 顺序相同。

**示例 1：**

```
输入：root = [1,2,5,3,4,null,6]
输出：[1,null,2,null,3,null,4,null,5,null,6]
```

**示例 2：**

```
输入：root = []
输出：[]
```

**示例 3：**

```
输入：root = [0]
输出：[0]
```

**提示：**

- 树中结点数在范围 `[0, 2000]` 内。
- `-100 <= Node.val <= 100`

**进阶**：你可以使用原地算法（O(1) 额外空间）展开这棵树吗？

## 题目分析

### 算法思路

**核心思路**：题目要求展开后的单链表与**先序**遍历顺序一致，且左指针全部为空。最直接的办法是先序遍历把所有节点收集起来，再按顺序重连；如果想满足 O(1) 额外空间的进阶要求，就要在遍历过程中就地搬家：先序中，某个节点的下一个节点是它左子树的最左节点；把左子树整体搬到根的右侧之后，为了让原右子树仍然排在左子树之后，需要把它接到「左子树中先序最后访问的节点」——也就是**左子树的最右节点**后面。这个节点正是先序序列里左子树部分的末尾，通常称为前驱。

**方法一：前序遍历 + 重建（O(n) 额外空间）**

先进行前序遍历收集所有节点，再逐个把 `Left` 置空、`Right` 指向下一个节点，最后一个节点两个指针都置空。

**方法二：原地展开（O(1) 空间，Morris 遍历思想，本题推荐）**

对于每个节点 `cur`：
1. 如果 `cur.Left` 不为空，找到左子树中最右边的节点 `predecessor`（沿 `Left` 后一路走 `Right` 到底）。
2. 将 `cur` 的右子树整条挂到 `predecessor.Right` 上。
3. 将 `cur.Left` 移到 `cur.Right`，并把 `cur.Left` 置空。
4. `cur = cur.Right` 继续处理下一个节点。

### 为什么正确

先看单步操作。在以 `cur` 为根的子树中，先序是 `[cur, 左子树先序, 右子树先序]`。操作后，`cur` 右侧接的是原左子树，而原左子树先序的最后访问节点是它的最右节点 `predecessor`，把原右子树接到 `predecessor` 之后，恰好得到 `[cur, 原左子树先序, 原右子树先序]`，与原先序一致；同时没有节点被丢弃。再看不变量：每轮开始时，`cur` 之后尚未展开的部分仍保有一棵二叉树的形状，其先序与全树先序的剩余部分一致。第 3 步后 `cur.Right` 指向原左子树的根，正是先序中 `cur` 的后继，于是 `cur = cur.Right` 前进到下一个待处理节点而不会跳过任何节点。归纳可知所有节点都会按先序被串联。若 `cur.Left` 为空，返回的 `cur.Right` 本来就是先后继，直接前进即可。循环结束时 `cur` 为 nil，链表已经成形，且所有节点的 `Left` 都在被处理时置空。

复杂度方面，虽然寻找前驱有一个内层循环，但每条右指针边最多被前驱搜索经过一次（Morris 遍历式的摊还分析），总时间仍是 O(n)。

### 复杂度分析

- **时间复杂度**：O(n)。每个节点只被处理一次，寻找前驱的总开销按摊还分析也是 O(n)。
- **空间复杂度**：方法一 O(n)（存放所有节点的切片）；方法二 O(1)，只用了 `cur`、`predecessor` 两个指针。

### 易错点 / 边界情况

- 顺序不能颠倒：必须先 `predecessor.Right = cur.Right`，再 `cur.Right = cur.Left`；反过来会先覆盖 `cur.Right`，导致原右子树永久丢失。
- 前驱是左子树的**最右**节点，不是最左节点。
- 移动后必须把 `cur.Left` 置空，否则最后结构里残留左指针，不符合题目要求。
- 方法一中最后一个节点要把 `Left`、`Right` 都置空。
- 空树直接返回，不发生任何操作。
- 展开是原地修改，不返回新根，函数没有返回值。
- 不要用普通的前序递归直接展开：递归返回时子树已被改写，无法拼接出正确的先序。若想用递归，需要让函数返回「当前子树展开后的尾节点」，并按「右、左、根」的顺序处理。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/75-flatten-binary-tree-to-linked-list-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树展开为链表 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：前序遍历收集 + 重建
func flatten(root *TreeNode) {
    if root == nil {
        return
    }
    var nodes []*TreeNode
    var preorder func(*TreeNode)
    preorder = func(node *TreeNode) {
        if node == nil {
            return
        }
        nodes = append(nodes, node)
        preorder(node.Left)
        preorder(node.Right)
    }
    preorder(root)

    for i := 0; i < len(nodes)-1; i++ {
        nodes[i].Left = nil
        nodes[i].Right = nodes[i+1]
    }
    nodes[len(nodes)-1].Left = nil
    nodes[len(nodes)-1].Right = nil
}

// 方法二：原地展开 O(1) 空间
func flattenInPlace(root *TreeNode) {
    cur := root
    for cur != nil {
        if cur.Left != nil {
            // 找到左子树的最右节点（前驱）
            predecessor := cur.Left
            for predecessor.Right != nil {
                predecessor = predecessor.Right
            }
            // 将右子树接到前驱的右边
            predecessor.Right = cur.Right
            // 将左子树移到右边
            cur.Right = cur.Left
            cur.Left = nil
        }
        // 继续处理下一个节点
        cur = cur.Right
    }
}
```
