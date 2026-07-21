# 116. 寻找峰值

## 题目描述

峰值元素是指其值严格大于左右相邻值的元素。

给你一个整数数组 `nums`，找到峰值元素并返回其索引。数组可能包含多个峰值，在这种情况下，返回**任何一个峰值**所在位置即可。

你可以假设 `nums[-1] = nums[n] = -∞`。

你必须实现时间复杂度为 O(log n) 的算法来解决此问题。

### 示例 1

```
输入：nums = [1,2,3,1]
输出：2
解释：3 是峰值元素，你的函数应该返回其索引 2。
```

### 示例 2

```
输入：nums = [1,2,1,3,5,6,4]
输出：1 或 5 
解释：你的函数可以返回索引 1（峰值元素为 2），或者返回索引 5（峰值元素为 6）。
```

### 约束条件

- `1 <= nums.length <= 1000`
- `-2^31 <= nums[i] <= 2^31 - 1`
- 对于所有有效的 `i` 都有 `nums[i] != nums[i + 1]`

## 题目分析

### 算法思路

虽然数组不是完全有序的，但我们可以利用"峰值"的局部性质进行二分查找：

1. 取中间位置 `mid`。
2. 比较 `nums[mid]` 和 `nums[mid+1]`：
   - 如果 `nums[mid] < nums[mid+1]`，说明右侧存在上升趋势，峰值一定在右侧（包括 mid+1 自身）。
   - 如果 `nums[mid] > nums[mid+1]`，说明右侧在下降，峰值在左侧（包括 mid 自身）。
3. 不断缩小搜索范围，最终 `left == right` 时即找到了一个峰值。

**为什么二分有效？** 因为题目保证了相邻元素不相等，并且边界视为 `-∞`。每次我们向"更高"的方向收缩，就像爬山一样，总能到达一个峰顶。

### 复杂度分析

- **时间复杂度**：O(log n)，二分查找。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 利用相邻元素严格不等的条件。
- 向更大的方向收缩一定不会错过峰值。
- 边界条件 `nums[-1] = nums[n] = -∞` 天然保证了峰值的存在性。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/116-find-peak-element-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="寻找峰值 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func findPeakElement(nums []int) int {
    left, right := 0, len(nums)-1
    for left < right {
        mid := left + (right-left)/2
        // 比较 mid 和 mid+1，判断峰值在哪一侧
        if nums[mid] < nums[mid+1] {
            // 上升趋势，峰值在右侧
            left = mid + 1
        } else {
            // 下降趋势，峰值在左侧（包括 mid）
            right = mid
        }
    }
    return left
}

func main() {
    testCases := [][]int{
        {1, 2, 3, 1},
        {1, 2, 1, 3, 5, 6, 4},
        {1},
        {1, 2},
        {2, 1},
    }

    for _, nums := range testCases {
        idx := findPeakElement(nums)
        fmt.Printf("nums = %v, 峰值索引 = %d, 峰值值 = %d\n",
            nums, idx, nums[idx])
    }
}
```
