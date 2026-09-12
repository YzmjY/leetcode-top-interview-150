# 110. 建立四叉树

## 题目描述

给你一个 `n * n` 矩阵 `grid`，矩阵由若干 `0` 和 `1` 组成。请你用四叉树表示该矩阵 `grid`。

你需要返回能表示矩阵 `grid` 的四叉树的根结点。

四叉树是一种树数据，其中每个内部节点恰好有四个子节点。每个节点具有两个属性：

- `val`：储存叶子节点所代表区域的值。`1` 对应 `true`，`0` 对应 `false`。注意，当 `isLeaf` 为 `false` 时，你可以把 `true` 或者 `false` 作为节点值，但通常使用 `false`。
- `isLeaf`：当这个节点是一个叶子节点时为 `true`，如果它有 4 个子节点则为 `false`。

```
type Node struct {
    Val         bool
    IsLeaf      bool
    TopLeft     *Node
    TopRight    *Node
    BottomLeft  *Node
    BottomRight *Node
}
```

我们可以按以下步骤为二维区域构建四叉树：

1. 如果当前区域的值相同（即，全为 `0` 或者全为 `1`），将 `isLeaf` 设为 `true`，并将 `val` 设为对应的值，并将四个子节点都设为 `null`，然后停止。
2. 如果当前区域的值不同，将 `isLeaf` 设为 `false`，将 `val` 设为任意值，然后将当前区域划分为四个子区域，对每个子区域递归地构建四叉树。

**示例 1：**

```
输入：grid = [[0,1],[1,0]]
输出：[[0,1],[1,0],[1,1],[1,1],[1,0]]
```

**示例 2：**

```
输入：grid = [
  [1,1,1,1,0,0,0,0],
  [1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,0,0,0,0],
  [1,1,1,1,0,0,0,0],
  [1,1,1,1,0,0,0,0],
  [1,1,1,1,0,0,0,0]
]
输出：`[[0,1],[1,1],[0,1],[1,1],[1,0],null,null,null,null,[1,0],[1,0],[1,1],[1,1]]`

说明：上面的输出按 LeetCode 的层序序列化给出，每个节点写成 `[isLeaf, val]`（`1` 表示 `true`，`0` 表示 `false`），不存在的位置记为 `null`，末尾的 `null` 省略。非叶子节点的 `val` 题目允许取任意值，这里与代码一致取 `true`。
```

**约束条件：**

- `n == grid.length == grid[i].length`
- `n == 2^x` 其中 `0 <= x <= 6`

## 题目分析

**核心思路：**

题目已经把构建规则写清楚了，直接照着规则做就是分治：

- 一个问题实例是「用一个节点表示某块方形区域」；
- 如果这块区域同值，答案是一目了然的叶子节点；
- 否则必须拆成四个子问题（左上、右上、左下、右下四个等大子方块），再把四个子结果组合成内部节点。

关键实现技巧是**只传区域的位置与边长** `(r, c, size)`，不复制子矩阵。这样每次划分是 O(1) 的，真正的工作都花在判断区域是否同值上。

**算法步骤：**

1. **检查终止条件**：扫描区域 `[r, r+size) × [c, c+size)`，若所有格子都等于 `grid[r][c]`，返回一个 `IsLeaf = true`、`Val = (grid[r][c] == 1)` 的叶子节点。
2. **分解**：令 `half = size / 2`，把区域分成四个边长为 `half` 的子区域。
3. **合并**：对四个子区域递归构建，分别作为 `TopLeft / TopRight / BottomLeft / BottomRight`，返回一个 `IsLeaf = false` 的内部节点。
4. 顶层调用 `build(0, 0, len(grid))`。

**为什么正确（正确性论证）：**

对区域边长 `size` 做归纳。`size == 1` 时区域只有一个格子，一定同值，返回的叶子节点正确。`size > 1` 时：

- 若区域同值，按规则 1 返回叶子节点，正确；
- 若区域不同值，按规则 2 必须继续划分，而四个子区域的并集恰好是整个区域且两两不重叠，递归（归纳假设）得到的四棵子树正确，组合后的内部节点自然正确地表示整个区域。

因为题目保证 `n = 2^x`，每次二分都能整除，四个子区域始终是正方形且边长相等，不会出现无法等分的情况。

**时间复杂度：** 每层递归中，所有区域加起来恰好覆盖整个矩阵一次性扫描的工作量是 O(n²)，而递归深度为 O(log n)，因此**最坏情况 O(n² log n)**（例如整块区域只有右下角一个格子不同，每一层都要把整块区域扫完才遇到差异）；如果区域很快出现差异或在早期就判定为叶子，实际接近 O(n²)。若把「区域是否同值」用二维前缀和预处理，可优化到 O(n²)，本题解未采用。

**空间复杂度：** O(log n)，递归栈深度等于四叉树的高度（每层把边长减半）。返回的四叉树本身需要与节点数成正比的输出空间，不计入额外空间。

**易错点 / 边界情况：**

- **`n = 1`（`x = 0`）**：不进入划分，直接返回一个叶子节点，不能假设 `size ≥ 2`。
- **非叶子节点的 `Val`**：题目说可以取任意值，本代码统一取 `true`，与 LeetCode 序列化格式中非叶子的 `val` 一致即可，不要误以为 `Val` 必须为 `false`。
- **四个子区域的下标**：左上 `(r, c)`、右上 `(r, c+half)`、左下 `(r+half, c)`、右下 `(r+half, c+half)`，别把行列写反。
- **不要复制子矩阵**：`append`/切片拷贝会让复杂度与空间急剧上升；用 `(r, c, size)` 描述区域即可。
- **同值判断的基准**：以区域左上角 `grid[r][c]` 为基准逐格比较即可，无需分别统计 0 和 1 的个数。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/110-construct-quad-tree-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="建立四叉树 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// Node 四叉树节点定义
type Node struct {
    Val         bool
    IsLeaf      bool
    TopLeft     *Node
    TopRight    *Node
    BottomLeft  *Node
    BottomRight *Node
}

// construct 构建四叉树
func construct(grid [][]int) *Node {
    var build func(r, c, size int) *Node
    build = func(r, c, size int) *Node {
        // 检查当前区域是否全部相同
        if isUniform(grid, r, c, size) {
            return &Node{
                Val:    grid[r][c] == 1,
                IsLeaf: true,
            }
        }

        // 分解为四个子区域
        half := size / 2
        return &Node{
            Val:         true, // 任意值
            IsLeaf:      false,
            TopLeft:     build(r, c, half),
            TopRight:    build(r, c+half, half),
            BottomLeft:  build(r+half, c, half),
            BottomRight: build(r+half, c+half, half),
        }
    }

    return build(0, 0, len(grid))
}

// isUniform 检查区域 [r, r+size) x [c, c+size) 是否全部相同
func isUniform(grid [][]int, r, c, size int) bool {
    val := grid[r][c]
    for i := r; i < r+size; i++ {
        for j := c; j < c+size; j++ {
            if grid[i][j] != val {
                return false
            }
        }
    }
    return true
}

func main() {
    grid := [][]int{
        {0, 1},
        {1, 0},
    }
    root := construct(grid)
    fmt.Printf("Root IsLeaf: %v, Val: %v\n", root.IsLeaf, root.Val)
}
```
