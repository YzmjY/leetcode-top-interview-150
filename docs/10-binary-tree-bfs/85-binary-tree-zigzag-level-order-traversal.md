# 85. 二叉树的锯齿形层序遍历

## 题目描述

给你二叉树的根节点 `root`，返回其节点值的 **锯齿形层序遍历**。（即先从左往右，再从右往左进行下一层遍历，以此类推，层与层之间交替进行）。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：[[3],[20,9],[15,7]]
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
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

锯齿形层序遍历 = 标准层序遍历 + 每层的**输出方向交替变化**（第 0 层从左到右，第 1 层从右到左，第 2 层从左到右……）。因此主体仍然是 BFS 模板，只需要额外做两件事：准备一个长度等于本层节点数的切片，并按当前方向决定每个节点值落在切片的哪个下标。

**算法步骤**：

1. 空树返回空结果；维护方向标志 `leftToRight`，初值 `true`（第 0 层从左到右）。
2. 只要队列非空，先取本层节点数 `levelSize`，并创建 `level := make([]int, levelSize)`。
3. 循环 `levelSize` 次：弹出第 `i` 个节点（`i` 从 0 开始计数）。若当前层从左到右，写入 `level[i]`；否则写入 `level[levelSize-1-i]`。同时把左右孩子按左、右顺序入队。
4. 本层填满后追加到结果，并翻转方向标志 `leftToRight = !leftToRight`。
5. 队列为空时结束。

**两种等价实现**：
- **写法一（先收集再反转）**：不管方向，先把本层按从左到右收集成 `level`，遇到反向层再原地反转 `level`。
- **写法二（按方向直接落位，即本解法的代码）**：提前 `make` 出定长切片，反向层把第 `i` 个节点写到 `level[levelSize-1-i]`，省去一次反转。

两者时间、空间复杂度完全相同（每个节点只处理一次），本解法采用写法二。

### 为什么正确

BFS 的不变量保证：第 `d` 层节点出队的顺序就是该层从左到右的顺序，即第 `i` 个出队的节点是该层第 `i` 个（从 0 计数）节点。据此：

- 若本层为从左到右，代码把它写到 `level[i]`，填完即得该层从左到右的序列；
- 若本层为从右到左，代码把它写到 `level[levelSize-1-i]`，于是从左数第 `i` 个节点落在倒数第 `i+1` 个位置，填完恰为该层从右到左的序列。

方向标志在每层结束时翻转，所以第 0 层从左到右、第 1 层从右到左、第 2 层又从左到右……与题目要求的交替方向一致。因为每个节点在 `level` 中恰好被写入一次，最终每层的切片既不重复也不遗漏。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点入队出队各一次、写入 `level` 一次。
- **空间复杂度**：队列 O(w)，w 为树的最大宽度；输出本身占 O(n)（所有层元素总数），另有每层一个临时切片，同样不超过 O(w)。

### 易错点 / 边界情况

- 方向标志的**初值是 `true`**（第 0 层从左到右），且必须在处理完一层之后再翻转；先翻转再处理会整体错位。
- 反向时的下标是 `levelSize-1-i`，注意 `-1` 不能漏，否则会越界或错位。
- `level` 必须按 `make([]int, levelSize)` 预分配定长；若用 `append` 会得到从左到右的顺序，写不进反向位置。
- 不要试图用「奇数层先压右孩子再压左孩子，然后照常从左到右输出」来偷懒：那只反转了**每个父节点内部**的孩子顺序，而不是整层的顺序。以满二叉树 `[1,2,3,4,5,6,7,8,...,15]` 为例，第 1 层输出 `[3,2]` 之后，这样得到的第 2 层是 `[6,7,4,5]`，而正确答案是 `[4,5,6,7]`。
- 空树返回空结果；单节点返回 `[[1]]`。
- 最后一层可能不满，`levelSize` 由队列长度决定，天然正确，不要按满二叉树假设节点数。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/85-binary-tree-zigzag-level-order-traversal-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的锯齿形层序遍历 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func zigzagLevelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    var result [][]int
    queue := []*TreeNode{root}
    leftToRight := true // 当前层方向

    for len(queue) > 0 {
        levelSize := len(queue)
        level := make([]int, levelSize)

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            // 根据方向决定填入位置
            if leftToRight {
                level[i] = node.Val
            } else {
                level[levelSize-1-i] = node.Val
            }

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }

        result = append(result, level)
        leftToRight = !leftToRight // 切换方向
    }

    return result
}
```
