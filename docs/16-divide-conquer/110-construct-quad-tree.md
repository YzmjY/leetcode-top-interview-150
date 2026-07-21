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
输出需要返回四叉树的根节点。
```

**约束条件：**

- `n == grid.length == grid[i].length`
- `n == 2^x` 其中 `0 <= x <= 6`

## 题目分析

本题是分治法的直接应用，严格遵循四叉树的构建规则。

**分治三步：**

1. **检查终止条件**：检查当前子区域是否全为 0 或全为 1，若是则构造叶子节点返回
2. **分解**：将当前区域划分为四个等大小的子区域（左上、右上、左下、右下）
3. **合并**：递归构建四个子节点，组合成内部节点

**时间复杂度：** O(n^2)，每个格子都会被访问，但在上层区域校验时重复访问可能导致 O(n^2 log n)。通过传入区域范围参数而非拷贝子矩阵可以避免额外开销。

**空间复杂度：** O(log n)，递归栈深度（四叉树高度）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/110-construct-quad-tree-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
