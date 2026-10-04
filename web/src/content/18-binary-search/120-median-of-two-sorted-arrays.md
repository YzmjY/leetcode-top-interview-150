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

**朴素想法**：把两个数组归并成一个有序数组再取中位数，时间 O(m+n)、空间 O(m+n)，达不到题目 O(log(m+n)) 的要求。

**问题转化（关键观察）**：中位数的本质是「把合并后的数组切一刀，使左半部分的所有元素都不大于右半部分的所有元素」。设左半部分一共有 `halfLen = ⌈(m+n)/2⌉` 个元素：

- 总数为奇数时，左半比右半多一个，中位数就是左半的最大值；
- 总数为偶数时，左右各半，中位数是「左半最大值」与「右半最小值」的平均值。

因此只要能找到**这样一条合法的切分线**，无需真正合并。

**二分划分**：不妨设 `nums1` 比 `nums2` 短（否则交换）。在 `nums1` 中取前 `i` 个元素进入左半，则在 `nums2` 中取前 `j` 个元素进入左半。为保证左半总数恒为 `halfLen`，必须

```
j = halfLen - i,  halfLen = (m + n + 1) / 2   // 整数除法，奇数时左半多一个
```

划分后的四个边界值：

- `nums1LeftMax = nums1[i-1]`（`i == 0` 时记为 `-∞`）
- `nums1RightMin = nums1[i]`（`i == m` 时记为 `+∞`）
- `nums2LeftMax = nums2[j-1]`（`j == 0` 时记为 `-∞`）
- `nums2RightMin = nums2[j]`（`j == n` 时记为 `+∞`）

**合法划分的判据**：因为每个数组内部有序，`nums1LeftMax <= nums1RightMin` 与 `nums2LeftMax <= nums2RightMin` 自动成立，所以只需两个**跨数组**条件：

```
nums1LeftMax <= nums2RightMin  且  nums2LeftMax <= nums1RightMin
```

**二分调整**：`i` 从 0 到 m 枚举时，`j = halfLen - i`。注意数组已交换使 `m ≤ n`，此时 `halfLen ≤ n` 且 `halfLen ≥ m`，所以对每个 `i ∈ [0, m]` 都有 `j ∈ [0, n]`，不会越界——这正是「对较短数组二分」的原因。

- 若 `nums1LeftMax > nums2RightMin`：说明 `i` 太大（左半从 nums1 拿了太多），令 `right = i - 1`；
- 否则若 `nums2LeftMax > nums1RightMin`：说明 `i` 太小，令 `left = i + 1`；
- 两者都不越界时即找到合法划分。

**计算中位数**：

- 总数为奇数：`max(nums1LeftMax, nums2LeftMax)`；
- 总数为偶数：`(max(nums1LeftMax, nums2LeftMax) + min(nums1RightMin, nums2RightMin)) / 2`。

**为什么正确**：

- 二分的单调性：`i` 增大 ⇒ `j` 减小 ⇒ `nums1LeftMax` 不减、`nums2RightMin` 不增。所以 `nums1LeftMax > nums2RightMin` 说明 `i` 需要变小，反之 `nums2LeftMax > nums1RightMin` 说明需要变大；两个方向互斥且单调，标准二分必然收敛到合法划分。
- 由合法性条件，左半 `i + j = halfLen` 个元素全部 ≤ 右半 `m-i + n-j` 个元素，因此左半最大值与右半最小值就是合并数组中间的两个数，据此取奇数/偶数的中位数即为答案。
- `halfLen = (m+n+1)/2` 的取整方式保证奇数时左半恰好包含中间那个元素，故奇数情形直接取左半最大值。

### 复杂度分析

- **时间复杂度**：O(log(min(m, n)))，只对较短的数组做二分；每次迭代 O(1)。
- **空间复杂度**：O(1)，只用常数个变量。

### 关键点

- 对较短的数组二分，确保 O(log(min(m, n)))。
- 边界处理：当 `i=0` 或 `i=m`（`j=0` 或 `j=n`）时，用负无穷大/正无穷大替代，避免访问越界。
- `j = (m+n+1)/2 - i` 保证了左半部分元素个数恒定。
- 用 `float64` 参与计算，避免整数除法截断（例如 `(2+3)/2` 会得到 2 而不是 2.5）。

### 易错点 / 边界情况

- **必须先交换成 `nums1` 更短**，否则无法保证 `j` 始终落在 `[0, n]`，可能越界或找不到划分。
- **`±∞` 的替代**：`i=0` 时 `nums1LeftMax = -∞`、`i=m` 时 `nums1RightMin = +∞`；`j` 的两个边界同理，四个都要处理。
- **`halfLen` 用 `(m+n+1)/2`**：写成 `(m+n)/2` 会让奇数长度的中位数取错。
- **一个数组为空**：`m = 0` 时 `i` 只能取 0，`j = halfLen`，`nums1LeftMax/RightMin` 都为 `±∞`，答案直接来自 `nums2`，代码无需特判。
- **元素有重复**：判据用的是 `<=`，可正确容纳相等元素。
- **整数溢出 / 精度**：值域 `|nums[i]| ≤ 10⁶`，转 `float64` 精确无误差；若数据范围更大需注意。


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
