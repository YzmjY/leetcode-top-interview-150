# 82. 二叉树的右视图

## 题目描述

给定一个二叉树的 **根节点** `root`，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。

**示例 1：**

```
输入：root = [1,2,3,null,5,null,4]
输出：[1,3,4]
解释：
      1                 <--- 第 0 层：只有 1
    /   \
   2     3              <--- 第 1 层：取最右的 3
    \     \
     5     4            <--- 第 2 层：取最右的 4
```

**示例 2：**

```
输入：root = [1,null,3]
输出：[1,3]
```

**示例 3：**

```
输入：root = []
输出：[]
```

**提示：**

- 二叉树的节点个数的范围是 `[0, 100]`。
- `-100 <= Node.val <= 100`

## 题目分析

### 算法思路

**核心观察**：右视图就是**每一层最右边那个节点**。于是问题拆成两步：先按层分组，再取每组的最后一个。

**方法一：BFS（层序遍历）**

用队列逐层遍历。每次外层循环开始时，队列里恰好是当前层的全部节点，且按从左到右排列。先记下这一层的大小 `levelSize`，然后只处理这 `levelSize` 个节点：弹出时若它是本层最后一个（`i == levelSize-1`），就把值加入结果；同时把它的左右孩子按「先左后右」入队，为下一层做准备。

**方法二：DFS（根 -> 右 -> 左的前序遍历）**

换个角度：如果遍历时**先走右子树、再走左子树**，那么同一深度上靠右的节点一定先被访问到，于是「每个深度上第一个访问到的节点」就是该层最右节点。用一个 `result` 数组按深度顺序记录这些「第一次到达」的节点：访问节点时若 `depth == len(result)`（此时 `len(result)` 正好等于已记录的层数，也就是该节点应放的下标），说明这是该深度第一次被访问，把节点值追加进去。

### 为什么正确

**BFS**：队列操作保证了「层」的语义。不变量是：每当外层循环开始时，队列中保存的正好是第 `d` 层的所有节点，且顺序为从左到右。初始 `d = 0` 时队列只有根节点，成立；归纳一步，处理第 `d` 层时按从左到右的顺序依次弹出节点，并把每个节点的左孩子先于右孩子入队，于是第 `d+1` 层的节点全部入队后仍是从左到右。因此第 `d` 层最后一个出队的节点就是该层最右节点，取它即得右视图的第 `d` 个元素。

**DFS**：先说明「根 -> 右 -> 左」的访问顺序中，同一深度上偏右的节点先被访问。设同深度的两个节点 u（靠右）、v（靠左），它们从某个共同祖先处分叉，u 在该祖先的右子树中、v 在左子树中；由于遍历顺序是右子树整体先于左子树，所以 u 先于 v 被访问。于是每个深度第一次被访问的节点就是该层最右节点。再看 `depth == len(result)` 这个条件：归纳假设进入某节点前，`result` 恰好保存了深度 `0..len(result)-1` 上各自的最右节点。DFS 每步深度只加 1，因此访问深度 `d` 的节点时必有 `d <= len(result)`：若 `d == len(result)`，说明该深度首次到达，追加后不变量继续成立；若 `d < len(result)`，说明该深度的最右节点早已记录，跳过即可。

### 复杂度分析

- **时间复杂度**：O(n)，每个节点恰好被访问一次。
- **空间复杂度**：BFS 版 O(w)，队列中最多同时存放一整层节点，w 是树的最大宽度；DFS 版 O(h)，h 是树的高度（递归栈深度）。另外结果数组恰好有「层数」个元素，不超过 h + 1。
- 两个极端：斜树时 w = 1、h = n；满二叉树时 w ≈ n/2、h = log n。

### 易错点 / 边界情况

- **空树**返回空数组（Go 中 `nil` 切片打印为 `[]`），这个判断不能漏，否则 `root.Val` 会 panic。
- BFS 里 `levelSize := len(queue)` 必须在处理本层**之前**取快照。若写成 `for i := 0; i < len(queue); i++`，队列会随入队不断变长，层就串了。
- DFS 的判断是 `depth == len(result)`（等于），不是 `>=`：每个深度至多记录一次，`result` 的长度就是「已记录过的深度数」。
- **只沿右孩子一路走是错的**。当左子树比右子树更深时，更深的那几层只存在于左子树：例如 `[1,2,3,4]` 的右视图是 `[1,3,4]`，最后一层的 4 在左子树里。
- DFS 里必须先递归 `Right` 再递归 `Left`，顺序反了就变成左视图。
- 节点数最多 100、值域 ±100，递归深度最大 100，不会栈溢出。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/82-binary-tree-right-side-view-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二叉树的右视图 - 交互演示">
</iframe>

## Go 代码实现

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 方法一：BFS 层序遍历
func rightSideView(root *TreeNode) []int {
    if root == nil {
        return nil
    }

    var result []int
    queue := []*TreeNode{root}

    for len(queue) > 0 {
        levelSize := len(queue)
        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]

            // 每层最后一个节点加入结果
            if i == levelSize-1 {
                result = append(result, node.Val)
            }

            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
    }

    return result
}

// 方法二：DFS（根-右-左）
func rightSideViewDFS(root *TreeNode) []int {
    var result []int
    var dfs func(*TreeNode, int)
    dfs = func(node *TreeNode, depth int) {
        if node == nil {
            return
        }
        // 第一次到达该深度，加入结果
        if depth == len(result) {
            result = append(result, node.Val)
        }
        // 先右后左，保证右视图优先
        dfs(node.Right, depth+1)
        dfs(node.Left, depth+1)
    }
    dfs(root, 0)
    return result
}
```
