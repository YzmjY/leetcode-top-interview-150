# 35. 螺旋矩阵

## 题目描述

给你一个 `m` 行 `n` 列的矩阵 `matrix`，请按照 **顺时针螺旋顺序**，返回矩阵中的所有元素。

**示例 1：**

```
输入：matrix = [[1,2,3],[4,5,6],[7,8,9]]
输出：[1,2,3,6,9,8,7,4,5]
```

**示例 2：**

```
输入：matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
输出：[1,2,3,4,8,12,11,10,9,5,6,7]
```

**约束条件：**

- `m == matrix.length`
- `n == matrix[i].length`
- `1 <= m, n <= 10`
- `-100 <= matrix[i][j] <= 100`

## 题目分析

**算法思路：** 螺旋遍历的本质是「贴着当前尚未访问区域的四条边，按顺时针各走一趟，然后收窄范围」。把注意力放在「还剩哪些格子没走」上，会发现未访问区域始终是一个矩形，只要用 `top/bottom/left/right` 四个边界就能完整描述它。每走完一条边就把对应边界向内收缩一格，下一圈的范围自然变小。关键观察是：边界本身就是「已访问区域的补集」，因此不需要额外的 visited 数组。

**算法步骤：**

1. 初始化四个边界 `top = 0`、`bottom = m-1`、`left = 0`、`right = n-1`。
2. 当 `top <= bottom` 且 `left <= right` 时循环：
   - 第 1 步：从左到右遍历 `top` 行（`j` 从 `left` 到 `right`），然后 `top++`；
   - 第 2 步：从上到下遍历 `right` 列（`i` 从 `top` 到 `bottom`），然后 `right--`；
   - 第 3 步：若 `top <= bottom`，从右到左遍历 `bottom` 行（`j` 从 `right` 到 `left`），然后 `bottom--`；
   - 第 4 步：若 `left <= right`，从下到上遍历 `left` 列（`i` 从 `bottom` 到 `top`），然后 `left++`。
3. 返回结果数组。

**为什么正确：** 循环开始前的不变量是「尚未访问的格子恰好构成矩形 `[top..bottom] x [left..right]」」。四步依次遍历该矩形的上、右、下、左四条边，首尾相接，恰好覆盖外圈且不重不漏；随后四个边界各自内缩一格，不变量对下一轮成立。当矩形退化为单行或单列时，第 3、4 步的前置判断阻止了对已经走过的行/列再走一遍。每一轮至少消耗一个元素，循环必然终止；终止时 `top > bottom` 或 `left > right` 表示矩形已空，全部 `m * n` 个元素都被收集了一次。

**时间复杂度：** O(m * n)，每个元素恰好被 append 一次。

**空间复杂度：** O(1) 额外空间（不计长度为 `m * n` 的输出数组），只用四个边界变量。

**易错点 / 边界情况：**

- 第 3、4 步的 `top <= bottom`、`left <= right` 判断不能省，否则单行或单列矩阵会把同一批元素重复收集。例如 `[[1,2,3]]` 走完第 1 步后 `top = 1 > bottom = 0`，若不判断，第 3 步会再从右到左输出 `3,2,1`。
- 四个边界的自增/自减位置要和实际访问一致：第 1、2 步无条件收缩，第 3、4 步的收缩必须在各自的 `if` 内部。
- 单列矩阵 `[[1],[2],[3]]` 靠「第 2 步后 `right < left`」与第 4 步的判断共同避免重复，可以手动推演验证。
- 结果数组可预分配容量 `m * n`，避免反复扩容。
- 代码直接取 `len(matrix[0])`，题目保证 `m, n >= 1`；若允许空矩阵需额外保护。

### 交互演示

以 `3 行 × 4 列` 矩阵为例，边界收缩法按顺时针方向逐步收窄。你可以点击下方演示的按钮逐步观察每一步的遍历过程：

<iframe
  src="../../assets/interactive/35-spiral-matrix-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="螺旋矩阵遍历交互演示">
</iframe>

> **说明：** 第 3 步和第 4 步前分别检查 `top ≤ bottom` 和 `left ≤ right`，是为了防止单行或单列矩阵在已完成第 1、2 步后产生重复遍历。每个单元格右上角的数字表示它是第几个被访问的，颜色区分了四步不同的扫描方向。

## Go 代码实现

```go
// spiralOrder 按顺时针螺旋顺序返回矩阵中的所有元素
// 使用边界收缩法
func spiralOrder(matrix [][]int) []int {
    m := len(matrix)
    n := len(matrix[0])
    result := make([]int, 0, m*n)

    // 定义四个边界
    top, bottom := 0, m-1
    left, right := 0, n-1

    for top <= bottom && left <= right {
        // 1. 从左到右遍历上边界
        for j := left; j <= right; j++ {
            result = append(result, matrix[top][j])
        }
        top++ // 上边界下移

        // 2. 从上到下遍历右边界
        for i := top; i <= bottom; i++ {
            result = append(result, matrix[i][right])
        }
        right-- // 右边界左移

        // 3. 从右到左遍历下边界（需检查 top <= bottom 防止重复遍历）
        if top <= bottom {
            for j := right; j >= left; j-- {
                result = append(result, matrix[bottom][j])
            }
            bottom-- // 下边界上移
        }

        // 4. 从下到上遍历左边界（需检查 left <= right 防止重复遍历）
        if left <= right {
            for i := bottom; i >= top; i-- {
                result = append(result, matrix[i][left])
            }
            left++ // 左边界右移
        }
    }

    return result
}
```
