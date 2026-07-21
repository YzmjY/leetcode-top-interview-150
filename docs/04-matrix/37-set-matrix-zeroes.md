# 37. 矩阵置零

## 题目描述

给定一个 `m x n` 的矩阵，如果一个元素为 `0`，则将其所在行和列的所有元素都设为 `0`。请使用 **原地** 算法。

**示例 1：**

```
输入：matrix = [[1,1,1],[1,0,1],[1,1,1]]
输出：[[1,0,1],[0,0,0],[1,0,1]]
```

**示例 2：**

```
输入：matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
输出：[[0,0,0,0],[0,4,5,0],[0,3,1,0]]
```

**约束条件：**

- `m == matrix.length`
- `n == matrix[0].length`
- `1 <= m, n <= 200`
- `-2^31 <= matrix[i][j] <= 2^31 - 1`

**进阶：**

- 一个直观的解决方案是使用 `O(mn)` 的额外空间，但这并不是一个好的解决方案。
- 一个简单的改进方案是使用 `O(m + n)` 的额外空间，但这仍然不是最好的解决方案。
- 你能想出一个仅使用常量空间的解决方案吗？

## 题目分析

**算法思路：** O(1) 空间复杂度的原地标记法。使用矩阵的第一行和第一列作为标记数组（类似于使用自身存储状态）：

1. 用两个布尔变量 `firstRowZero` 和 `firstColZero` 记录第一行和第一列本身是否需要置零
2. 遍历矩阵其余部分，如果 `matrix[i][j] == 0`，则将 `matrix[i][0] = 0`（标记该行需要置零）和 `matrix[0][j] = 0`（标记该列需要置零）
3. 根据标记将对应的行和列置零
4. 最后根据 `firstRowZero` 和 `firstColZero` 处理第一行和第一列

**时间复杂度：** O(m * n)。

**空间复杂度：** O(1)，只使用了两个布尔变量。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/37-set-matrix-zeroes-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="矩阵置零 - 交互演示">
</iframe>

## Go 代码实现

```go
// setZeroes 将矩阵中含 0 的行和列全部置零（原地操作）
// 使用第一行和第一列作为标记数组，实现 O(1) 额外空间
func setZeroes(matrix [][]int) {
    m, n := len(matrix), len(matrix[0])
    // firstRowZero 标记第一行是否需要置零
    // firstColZero 标记第一列是否需要置零
    firstRowZero := false
    firstColZero := false

    // 1. 检查第一行是否有 0
    for j := 0; j < n; j++ {
        if matrix[0][j] == 0 {
            firstRowZero = true
            break
        }
    }

    // 2. 检查第一列是否有 0
    for i := 0; i < m; i++ {
        if matrix[i][0] == 0 {
            firstColZero = true
            break
        }
    }

    // 3. 使用第一行和第一列作为标记数组
    // 遍历其余位置，如果 matrix[i][j] == 0，在对应的第一行和第一列做标记
    for i := 1; i < m; i++ {
        for j := 1; j < n; j++ {
            if matrix[i][j] == 0 {
                matrix[i][0] = 0 // 标记该行
                matrix[0][j] = 0 // 标记该列
            }
        }
    }

    // 4. 根据标记，将对应行和列的元素置零（跳过第一行第一列）
    for i := 1; i < m; i++ {
        for j := 1; j < n; j++ {
            if matrix[i][0] == 0 || matrix[0][j] == 0 {
                matrix[i][j] = 0
            }
        }
    }

    // 5. 处理第一行
    if firstRowZero {
        for j := 0; j < n; j++ {
            matrix[0][j] = 0
        }
    }

    // 6. 处理第一列
    if firstColZero {
        for i := 0; i < m; i++ {
            matrix[i][0] = 0
        }
    }
}
```
