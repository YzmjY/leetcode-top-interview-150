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

### 算法思路

由于矩阵满足两个条件：行内升序 + 行首大于前行尾，整个矩阵从左到右、从上到下是严格递增的。因此可以将二维矩阵视为一个长度为 `m * n` 的一维有序数组，直接进行二分查找。

坐标映射关系：
- 一维索引 `idx` 对应二维坐标 `[r, c]`：`r = idx / n`，`c = idx % n`
- 其中 `n` 是列数。

### 复杂度分析

- **时间复杂度**：O(log(m * n))，将二维问题转化为一维二分查找。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 坐标映射是本题的核心技巧。
- 该矩阵本质上就是一个排序数组按行折叠的结果。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/115-search-a-2d-matrix-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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

// 方法二：两次二分（先找行，再找列）
func searchMatrix2(matrix [][]int, target int) bool {
    m, n := len(matrix), len(matrix[0])

    // 先在第一列中二分查找目标所在行
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
