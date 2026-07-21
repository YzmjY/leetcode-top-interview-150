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

使用 BFS 层序遍历，对每层节点的值求和，然后除以该层节点数得到平均值。

步骤：
1. 使用队列进行标准的层序遍历。
2. 对于每一层，累加所有节点的值，记录节点数量。
3. 计算该层的平均值（将和转为 float64 后进行除法）。
4. 将平均值加入结果列表。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点访问一次。
- **空间复杂度**：O(w)，w 为树的最大宽度。


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
