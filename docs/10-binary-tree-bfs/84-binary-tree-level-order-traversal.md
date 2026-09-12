# 84. 二叉树的层序遍历

## 题目描述

给你二叉树的根节点 `root`，返回其节点值的 **层序遍历**。（即逐层地，从左到右访问所有节点）。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[9,20],[15,7]]
```

**示例 2：**

```
输入：root = [1]
输出：[[1]]
```

**示例 3：**

```
输入：root = []
输出：[]
```

**提示：**

- 树中节点数目在范围 `[0, 2000]` 内。
- `-1000 <= Node.val <= 1000`

## 题目分析

### 算法思路

本题是 BFS/层序遍历的最基础模板题：用队列把节点按层「排队」，每轮只处理一层。难点不在思路，而在于**如何界定「一层」的边界**——答案是用队列长度做快照。

**算法步骤**：

1. 空树直接返回空结果；否则把根节点入队。
2. 当队列不为空时，先执行 `levelSize := len(queue)`，把「当前层有多少个节点」记下来。此刻队列里的 `levelSize` 个节点恰好就是本层的全部节点。
3. 循环 `levelSize` 次：弹出队首节点，把它的值放进本层的 `level` 切片，再把它的左右孩子依次入队（这些孩子属于下一层，不会在本轮被处理）。
4. 把 `level` 追加到二维结果中，回到第 2 步。
5. 队列为空时结束，返回结果。

这是最标准、最基础的层序遍历模板，后续所有变体（右视图取每层末元素、锯齿形反转奇数层、层平均值求均值等）都只是在它的基础上修改「如何填 `level`」。

### 为什么正确

不变量是：每次外层循环开始时，队列中恰好保存第 `d` 层的全部节点，且按从左到右排列。初始 `d = 0`，队列中只有根节点，成立。归纳一步：第 `d` 层的 `levelSize` 个节点在被弹出时，把各自的孩子按「先左后右」的顺序入队；这些孩子正是第 `d+1` 层从左到右的全部节点，而处理它们之前不会有别的节点入队，所以下一轮循环开始时队列恰好是第 `d+1` 层。既然每轮恰好处理一层、且 `level` 按出队顺序记录，结果数组就是逐层、每层从左到右的值，符合题目要求。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点入队、出队各一次，追加值一次。
- **空间复杂度**：队列 O(w)，w 为树的最大宽度；w 在最坏情况（如满二叉树）约为 n/2，故队列空间上界为 O(n)。若把输出也算入，则还要 O(n) 存放所有层的结果。

### 易错点 / 边界情况

- `levelSize` 必须**先取快照**再进入内层循环。写成 `for i := 0; i < len(queue); i++` 是经典错误：孩子入队会让 `len(queue)` 不断变大，一层会和下一层混在一起。
- 空树要返回空结果，且 `root == nil` 的判断必须在入队前完成，否则队列里会放进 `nil` 并在取值时 panic。
- 不要在多个层之间复用同一个 `level` 切片：Go 的切片是引用语义，复用会导致所有层指向同一块底层数组、内容互相覆盖。
- 内层循环结束后队列里是下一层的节点，不会再包含本层节点——这是「逐层」的关键，不要在这一步清空队列。
- 单节点树返回 `[[1]]`（一层、一个元素），不要少一层也不要多一层。
- 题目允许 `return nil` 表示空结果（Go 中打印为 `[]`），层序为空时不要返回 `[[]]`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/84-binary-tree-level-order-traversal-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的层序遍历 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    var result [][]int
    queue := []*TreeNode{root}

    for len(queue) > 0 {
        levelSize := len(queue)
        var level []int

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            level = append(level, node.Val)

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }

        result = append(result, level)
    }

    return result
}
```
