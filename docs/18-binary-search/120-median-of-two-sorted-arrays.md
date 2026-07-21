# 120. 寻找两个正序数组的中位数

## 题目描述

给定两个大小分别为 `m` 和 `n` 的正序（从小到大）数组 `nums1` 和 `nums2`。请你找出并返回这两个正序数组的**中位数**。

算法的时间复杂度应该为 O(log(m + n))。

### 示例 1

```
输入：nums1 = [1,3], nums2 = [2]
输出：2.00000
解释：合并数组 = [1,2,3] ，中位数 2
```

### 示例 2

```
输入：nums1 = [1,2], nums2 = [3,4]
输出：2.50000
解释：合并数组 = [1,2,3,4] ，中位数 (2 + 3) / 2 = 2.5
```

### 约束条件

- `nums1.length == m`
- `nums2.length == n`
- `0 <= m <= 1000`
- `0 <= n <= 1000`
- `1 <= m + n <= 2000`
- `-10^6 <= nums1[i], nums2[i] <= 10^6`

## 题目分析

### 算法思路

本题的核心是在不使用合并排序的情况下，在 O(log(min(m, n))) 时间内找到中位数。思路如下：

**问题转化**：中位数将合并后的数组分为左右两部分，使得：
- 左侧元素个数 = 右侧元素个数（总数为偶数）或左侧多一个（总数为奇数）。
- 左侧所有元素 <= 右侧所有元素。

**二分划分**：对较短的数组进行二分，在 `nums1` 中取 `i` 个元素进入左半部分，则在 `nums2` 中应取 `j = (m+n+1)/2 - i` 个元素进入左半部分。

划分后的四个关键值：
- `nums1LeftMax`：nums1 左侧最大值（`nums1[i-1]`）
- `nums1RightMin`：nums1 右侧最小值（`nums1[i]`）
- `nums2LeftMax`：nums2 左侧最大值（`nums2[j-1]`）
- `nums2RightMin`：nums2 右侧最小值（`nums2[j]`）

**二分调整条件**：
- 如果 `nums1LeftMax <= nums2RightMin` 且 `nums2LeftMax <= nums1RightMin`，找到了正确的划分。
- 如果 `nums1LeftMax > nums2RightMin`，说明 i 太大，需要减小 i。
- 否则 i 太小，需要增大 i。

**计算中位数**：
- 总数为奇数：`median = max(nums1LeftMax, nums2LeftMax)`
- 总数为偶数：`median = (max(nums1LeftMax, nums2LeftMax) + min(nums1RightMin, nums2RightMin)) / 2`

### 复杂度分析

- **时间复杂度**：O(log(min(m, n)))，只对较短的数组进行二分。
- **空间复杂度**：O(1)。

### 关键点

- 对较短的数组二分，确保 O(log(min(m, n)))。
- 边界处理：当 i=0 或 i=len(nums1) 时，用负无穷大/正无穷大替代。
- `j = (m+n+1)/2 - i` 保证了左半部分元素个数正确。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/120-median-of-two-sorted-arrays-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="寻找两个正序数组的中位数 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import (
    "fmt"
    "math"
)

func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    // 确保 nums1 是较短的数组，减少二分次数
    if len(nums1) > len(nums2) {
        nums1, nums2 = nums2, nums1
    }

    m, n := len(nums1), len(nums2)
    left, right := 0, m
    halfLen := (m + n + 1) / 2

    for left <= right {
        i := left + (right-left)/2 // nums1 中进入左半的元素个数
        j := halfLen - i           // nums2 中进入左半的元素个数

        // 四个边界值
        var nums1LeftMax float64
        if i == 0 {
            nums1LeftMax = math.Inf(-1)
        } else {
            nums1LeftMax = float64(nums1[i-1])
        }

        var nums1RightMin float64
        if i == m {
            nums1RightMin = math.Inf(1)
        } else {
            nums1RightMin = float64(nums1[i])
        }

        var nums2LeftMax float64
        if j == 0 {
            nums2LeftMax = math.Inf(-1)
        } else {
            nums2LeftMax = float64(nums2[j-1])
        }

        var nums2RightMin float64
        if j == n {
            nums2RightMin = math.Inf(1)
        } else {
            nums2RightMin = float64(nums2[j])
        }

        // 检查划分是否正确
        if nums1LeftMax <= nums2RightMin && nums2LeftMax <= nums1RightMin {
            // 找到正确划分
            if (m+n)%2 == 1 {
                // 总数为奇数
                if nums1LeftMax > nums2LeftMax {
                    return nums1LeftMax
                }
                return nums2LeftMax
            }
            // 总数为偶数
            leftMax := nums1LeftMax
            if nums2LeftMax > leftMax {
                leftMax = nums2LeftMax
            }
            rightMin := nums1RightMin
            if nums2RightMin < rightMin {
                rightMin = nums2RightMin
            }
            return (leftMax + rightMin) / 2.0
        } else if nums1LeftMax > nums2RightMin {
            // i 太大，向左收缩
            right = i - 1
        } else {
            // i 太小，向右收缩
            left = i + 1
        }
    }
    return 0.0
}

func main() {
    testCases := []struct {
        nums1, nums2 []int
    }{
        {[]int{1, 3}, []int{2}},
        {[]int{1, 2}, []int{3, 4}},
        {[]int{0, 0}, []int{0, 0}},
        {[]int{}, []int{1}},
        {[]int{2}, []int{}},
    }

    for _, tc := range testCases {
        fmt.Printf("nums1 = %v, nums2 = %v, 中位数 = %.5f\n",
            tc.nums1, tc.nums2,
            findMedianSortedArrays(tc.nums1, tc.nums2))
    }
}
```
