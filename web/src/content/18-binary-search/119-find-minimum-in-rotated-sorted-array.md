# 119. 寻找旋转排序数组中的最小值

## 题目描述

已知一个长度为 `n` 的数组，预先按照升序排列，经由 `1` 到 `n` 次**旋转**后，得到输入数组。例如，原数组 `nums = [0,1,2,4,5,6,7]` 在变化后可能得到：

- 若旋转 `4` 次，则可以得到 `[4,5,6,7,0,1,2]`
- 若旋转 `7` 次，则可以得到 `[0,1,2,4,5,6,7]`

注意，数组 `[a[0], a[1], a[2], ..., a[n-1]]` **旋转一次**的结果为数组 `[a[n-1], a[0], a[1], a[2], ..., a[n-2]]`。

给你一个元素值**互不相同**的数组 `nums`，它原来是一个升序排列的数组，并按上述情形进行了多次旋转。请你找出并返回数组中的**最小元素**。

你必须设计一个时间复杂度为 O(log n) 的算法解决此问题。

### 示例 1

```
输入：nums = [3,4,5,1,2]
输出：1
解释：原数组为 [1,2,3,4,5] ，旋转 3 次得到输入数组。
```

### 示例 2

```
输入：nums = [4,5,6,7,0,1,2]
输出：0
解释：原数组为 [0,1,2,4,5,6,7] ，旋转 4 次得到输入数组。
```

### 示例 3

```
输入：nums = [11,13,15,17]
输出：11
解释：原数组为 [11,13,15,17] ，旋转 4 次得到输入数组。
```

### 约束条件

- `n == nums.length`
- `1 <= n <= 5000`
- `-5000 <= nums[i] <= 5000`
- `nums` 中的所有整数**互不相同**
- `nums` 原来是一个升序排序的数组，并进行了 `1` 至 `n` 次旋转

## 题目分析

### 算法思路

**关键观察**：旋转后的数组由两段升序数组拼成，最小值恰好是第二段的开头（也就是旋转点）。整个数组「先增后降」至多一次，因此可以通过比较 `mid` 与某个边界来判断最小值在哪一侧。

**与右端点比较**（本代码采用的方式）：

- 取 `mid = left + (right-left)/2`，比较 `nums[mid]` 与 `nums[right]`：
  - 若 `nums[mid] < nums[right]`，则 `[mid, right]` 这一段是升序的，`nums[mid]` 是这一段的最小值。既然 `nums[mid]` 本身在候选区间内、且它右边没有更小的元素，最小值一定在 `[left, mid]` 中（**包括 mid**），令 `right = mid`。
  - 若 `nums[mid] > nums[right]`，说明从 `mid` 到 `right` 存在「下降」，旋转点（最小值）落在 `(mid, right]` 内，`mid` 不可能是最小值，令 `left = mid + 1`。
- 区间不断收缩，最终 `left == right` 指向最小值。

**为什么正确（不变量论证）**：维护不变量「最小值在 `[left, right]` 内」。

- 初始区间是整个数组，成立。
- `nums[mid] < nums[right]` 时，`[mid, right]` 升序 ⇒ `nums[mid]` 是该段最小值 ⇒ `[mid+1, right]` 内任何元素都 `≥ nums[mid]`，而 `nums[mid]` 已被 `[left, mid]` 覆盖，故最小值一定在 `[left, mid]`，令 `right = mid` 保持不变量。
- `nums[mid] > nums[right]` 时，`nums[right]` 比 `nums[mid]` 小，说明下降点在 `mid` 右侧，最小值必在 `(mid, right]`，令 `left = mid + 1` 保持不变量。
- 循环终止时 `left == right`，区间只剩一个元素，它就是最小值。

**为什么比较 `nums[right]` 而不是 `nums[left]`？** 因为 `nums[right]` 与旋转状态的关系更明确：`nums[mid] < nums[right]` 说明右端到中点这段已经回到升序，断点只可能在左侧。若改与 `nums[left]` 比较，在数组未旋转或断点位置特殊时无法单凭一侧判断，需要额外分情况。

### 复杂度分析

- **时间复杂度**：O(log n)，每轮区间减半。
- **空间复杂度**：O(1)。

### 关键点

- 比较 `nums[mid]` 与 `nums[right]` 来判断有序性。
- 当 `nums[mid] > nums[right]` 时，最小值一定在右边（且 `mid` 自身可排除）。
- 当数组没有旋转（完全有序）时，`nums[mid] < nums[right]` 始终成立，`right` 一路收缩到 0，最终返回 `nums[0]`。

### 易错点 / 边界情况

- **循环条件是 `left < right`**，返回 `nums[left]`；若用 `left <= right` 且返回 `nums[left]`，收缩到单元素后可能再一步越界。
- **必须比较 `right` 而不是 `left`**：写成 `nums[mid] > nums[left]` 会在很多旋转情况下给出错误方向。
- **单元素数组**：循环不执行，返回 `nums[0]`。
- **旋转 n 次等价于未旋转**：数组完全升序，返回 `nums[0]`。
- **元素互异**保证 `nums[mid] != nums[right]`（`mid < right`），不会出现需要单独处理的相等情形；若允许重复，则该判据需要改写。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/119-find-minimum-in-rotated-sorted-array-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="寻找旋转排序数组中的最小值 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func findMin(nums []int) int {
    left, right := 0, len(nums)-1
    for left < right {
        mid := left + (right-left)/2
        // 比较 mid 和 right
        if nums[mid] < nums[right] {
            // 右半有序，最小值在左边（包括 mid）
            right = mid
        } else {
            // nums[mid] > nums[right]，最小值在右边
            left = mid + 1
        }
    }
    return nums[left]
}

func main() {
    testCases := [][]int{
        {3, 4, 5, 1, 2},
        {4, 5, 6, 7, 0, 1, 2},
        {11, 13, 15, 17},
        {2, 1},
        {1},
    }

    for _, nums := range testCases {
        fmt.Printf("nums = %v, 最小值 = %d\n", nums, findMin(nums))
    }
}
```
