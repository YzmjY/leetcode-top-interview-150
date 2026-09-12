# 83. 二叉树的层平均值

## 题目描述

给定一个非空二叉树的根节点 `root`，以数组的形式返回每一层节点的平均值。与实际答案相差 `10^-5` 以内的答案可以被接受。

**示例 1：**

```
输入：root = [3,9,20,null,null,15,7]
输出：[3.00000,14.50000,11.00000]
解释：第 0 层的平均值为 3,第 1 层的平均值为 14.5,第 2 层的平均值为 11。
因此返回 [3, 14.5, 11]。
```

**示例 2：**

```
输入：root = [3,9,20,15,7]
输出：[3.00000,14.50000,11.00000]
```

**提示：**

- 树中节点数量在 `[1, 10^4]` 范围内。
- `-2^31 <= Node.val <= 2^31 - 1`

## 题目分析

### 算法思路

**核心思路**：题目要求「每一层的平均值」，这天然对应层序遍历（BFS）：先把节点按层分组，再对每组求平均。求平均只需要知道两个量——该层所有节点值之和、该层节点个数。

**算法步骤**：

1. 把根节点放入队列（空树直接返回空结果）。
2. 只要队列非空，先记下当前队列长度 `levelSize`，它就是本层的节点数。
3. 循环 `levelSize` 次：弹出队首节点，把它的值累加到 `sum`，并把左右孩子依次入队。循环结束后，队列里正好是下一层的全部节点。
4. 本层平均值 = `float64(sum) / float64(levelSize)`，追加到结果数组。
5. 重复 2~4，直到队列为空。

数据规模与数据范围提示：节点值可达 `±2^31-1`，而一层最多可有 10^4 个节点，所以**一层之和可能超出 int32**，需要用 64 位整数累加（Go 在 64 位平台上的 `int` 就是 64 位，安全）。

### 为什么正确

不变量是：每次外层循环开始时，队列中恰好保存第 `d` 层的全部节点，且顺序为从左到右（初始 `d = 0` 时队列只有根节点；归纳一步，第 `d` 层节点出队时把各自的孩子按左、右顺序入队，第 `d+1` 层因此也按从左到右排列）。所以内层循环执行的次数 `levelSize` 就是第 `d` 层的节点个数，内层累加的 `sum` 就是该层所有节点值之和，二者相除正是题目要求的第 `d` 层平均值。外层循环按 `d = 0, 1, 2, ...` 递增，结果数组的顺序也与题目要求一致。

至于示例 2 的 `[3,9,20,15,7]`，它同样是标准的层序表示：根是 3，第 1 层是 9、20，第 2 层是 9 的两个孩子 15、7（20 没有孩子）。层平均值为 `[3, 14.5, 11]`，与示例 1 相同，因此两例输出一致。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点入队、出队各一次，累加一次。
- **空间复杂度**：队列 O(w)，w 为树的最大宽度（最多同时存放一整层节点）；结果数组 O(h)，h 为层数。合计 O(w + h)，例如链状树时 w = 1、h = n。

### 易错点 / 边界情况

- **整数除法**：必须写成 `float64(sum) / float64(levelSize)`。若写成 `sum / levelSize`（两个 `int` 相除）会做截断，`14.5` 会变成 `14`。
- **求和范围**：`sum` 不要用 `int32`；一层 10^4 个 `2^31-1` 相加远超 int32 上限。
- `levelSize` 必须在进入内层循环前保存快照，否则队列变长会导致层串行。
- 平均值要用浮点比较，题目允许 `10^-5` 的误差。
- 题目保证二叉树非空，但代码仍用 `root == nil` 兜底返回 `nil`；这在 LeetCode 上同样打印为 `[]`。
- 单节点树返回只有一个元素的 `[root.Val]`；负数、零都要正常处理。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/83-average-of-levels-in-binary-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的层平均值 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func averageOfLevels(root *TreeNode) []float64 {
    if root == nil {
        return nil
    }

    var result []float64
    queue := []*TreeNode{root}

    for len(queue) > 0 {
        levelSize := len(queue)
        sum := 0

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]
            sum += node.Val

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }

        // 计算该层平均值
        avg := float64(sum) / float64(levelSize)
        result = append(result, avg)
    }

    return result
}
```
