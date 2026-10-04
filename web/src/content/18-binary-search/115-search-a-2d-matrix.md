# 115. 搜索二维矩阵

## 题目描述

编写一个高效的算法来判断 `m x n` 矩阵中，是否存在一个目标值。该矩阵具有如下特性：

- 每行中的整数从左到右按升序排列。
- 每行的第一个整数大于前一行的最后一个整数。

### 示例 1

```
输入：matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
输出：true
```

### 示例 2

```
输入：matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13
输出：false
```

### 约束条件

- `m == matrix.length`
- `n == matrix[i].length`
- `1 <= m, n <= 100`
- `-10^4 <= matrix[i][j], target <= 10^4`

## 题目分析

### 算法思路（方法一：整体二分）

**关键观察**：矩阵满足两个条件——行内从左到右升序，且每行的第一个数大于前一行的最后一个数。两者合起来说明：按「一行接一行」读出的 `m * n` 个数字整体严格递增。因此**整个矩阵可以看作一个长度为 `m * n` 的一维有序数组**，直接对它二分。

坐标映射关系：
- 一维索引 `idx` 对应二维坐标 `[r, c]`：`r = idx / n`，`c = idx % n`
- 其中 `n` 是列数。

**算法步骤**：在闭区间 `[0, m*n-1]` 上做标准二分。每轮取 `mid`，用映射取出 `matrix[mid/n][mid%n]` 与 target 比较：相等返回 `true`；小于则 `left = mid + 1`；大于则 `right = mid - 1`。循环结束仍未命中则返回 `false`。

**为什么正确**：映射 `idx → (idx/n, idx%n)` 是一一且保序的（行优先展开），所以「一维数组上的二分」与「在矩阵中查目标」完全等价。二分查找的正确性由标准不变量保证：答案（若存在）始终落在当前区间 `[left, right]` 内。

### 算法思路（方法二：两次二分）

先**对行二分**，定位 target 可能所在的那一行：

- 每一行的值域是 `[matrix[r][0], matrix[r][n-1]]`；由于行间有序，这些区间互不重叠且整体递增，所以 target 至多落在一行里。
- 取 `midRow`，若 `matrix[midRow][0] <= target <= matrix[midRow][n-1]`，target 只可能在这一行，于是**再对这一行做一次二分**并返回结果；
- 若 `matrix[midRow][0] > target`，说明 target 只会出现在更小的行，令 `bottom = midRow - 1`；
- 否则 `target > matrix[midRow][n-1]`，target 只会出现在更大的行，令 `top = midRow + 1`。

### 复杂度分析

- **方法一**：时间复杂度 O(log(m * n))；空间复杂度 O(1)。
- **方法二**：时间复杂度 O(log m + log n) = O(log(m * n))；空间复杂度 O(1)。
- 两者渐近相同（log m + log n 与 log(mn) 只差常数倍），方法一常数更小但依赖坐标除法。

### 关键点

- 坐标映射是方法一的核心技巧，该矩阵本质上就是一个排序数组按行折叠的结果。
- 方法二不需要坐标映射，但必须用「行的值域」来判断 target 在哪一行。
- 两种方法在 `m = 1`、`n = 1` 时都要能正常工作。

### 易错点 / 边界情况

- **空矩阵 / 空行**：`matrix` 为空或 `len(matrix[0]) == 0` 时要直接返回 `false`，否则 `len(matrix[0])` 会 panic（约束下不会出现，但两种方法都应保持一致的防御）。
- **映射方向**：`matrix[mid/n][mid%n]`，除的是**列数 n**，别用成行数 m。
- **方法二的行判断顺序**：先判「区间覆盖」再判「偏大 / 偏小」，不能少判；判偏大全用 `matrix[midRow][n-1]` 而非 `matrix[midRow][0]`。
- **target 比所有元素都大 / 都小**：方法二会把 `top`/`bottom` 推出边界后返回 `false`，属于正常流程。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/115-search-a-2d-matrix-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="搜索二维矩阵 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func searchMatrix(matrix [][]int, target int) bool {
    m := len(matrix)
    if m == 0 {
        return false
    }
    n := len(matrix[0])
    if n == 0 {
        return false
    }

    left, right := 0, m*n-1
    for left <= right {
        mid := left + (right-left)/2
        // 一维坐标映射到二维
        midVal := matrix[mid/n][mid%n]

        if midVal == target {
            return true
        } else if midVal < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return false
}

// 方法二：两次二分（先定位行，再在行内二分）
func searchMatrix2(matrix [][]int, target int) bool {
    m := len(matrix)
    if m == 0 {
        return false
    }
    n := len(matrix[0])
    if n == 0 {
        return false
    }

    // 先在行上二分：找出区间能覆盖 target 的那一行
    top, bottom := 0, m-1
    for top <= bottom {
        midRow := top + (bottom-top)/2
        if matrix[midRow][0] <= target && target <= matrix[midRow][n-1] {
            // 在该行内二分查找
            row := matrix[midRow]
            left, right := 0, n-1
            for left <= right {
                mid := left + (right-left)/2
                if row[mid] == target {
                    return true
                } else if row[mid] < target {
                    left = mid + 1
                } else {
                    right = mid - 1
                }
            }
            return false
        } else if matrix[midRow][0] > target {
            bottom = midRow - 1
        } else {
            top = midRow + 1
        }
    }
    return false
}

func main() {
    matrix := [][]int{
        {1, 3, 5, 7},
        {10, 11, 16, 20},
        {23, 30, 34, 60},
    }

    testTargets := []int{3, 13, 60, 1, 34}
    for _, target := range testTargets {
        fmt.Printf("target = %d, found = %v\n",
            target, searchMatrix(matrix, target))
    }
}
```
