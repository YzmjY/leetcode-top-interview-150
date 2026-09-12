# 117. 搜索旋转排序数组

## 题目描述

整数数组 `nums` 按升序排列，数组中的值**互不相同**。

在传递给函数之前，`nums` 在预先未知的某个下标 `k`（`0 <= k < nums.length`）上进行了**旋转**，使数组变为 `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]`（下标从 0 开始计数）。例如，`[0,1,2,4,5,6,7]` 在下标 `3` 处经旋转后可能变为 `[4,5,6,7,0,1,2]`。

给你**旋转后**的数组 `nums` 和一个整数 `target`，如果 `nums` 中存在这个目标值 `target`，则返回它的索引，否则返回 `-1`。

你必须设计一个时间复杂度为 O(log n) 的算法解决此问题。

### 示例 1

```
输入：nums = [4,5,6,7,0,1,2], target = 0
输出：4
```

### 示例 2

```
输入：nums = [4,5,6,7,0,1,2], target = 3
输出：-1
```

### 示例 3

```
输入：nums = [1], target = 0
输出：-1
```

### 约束条件

- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 中的每个值都**独一无二**
- 题目数据保证 `nums` 在预先未知的某个下标上进行了旋转
- `-10^4 <= target <= 10^4`

## 题目分析

### 算法思路

**朴素想法**：先找出旋转点，再做普通二分。可行但需要两趟二分，代码更繁琐。

**关键观察**：把旋转排序数组从任意位置 `mid` 切开，**「左半 `[left, mid]`」和「右半 `[mid, right]`」中至少有一半是完全有序的**。原因：旋转只是把一段升序数组的首部搬到尾部，至多产生一个「下降点」；`mid` 要么在下降点左侧、要么在右侧，因此另一半必然不含下降点。

既然有一半有序，就可以用「值是否落在有序那一半的区间内」来决定往哪边收缩——这是标准二分能成立的根本原因。

**算法步骤**：

1. 计算 `mid = left + (right-left)/2`。
2. 若 `nums[mid] == target`，直接返回 `mid`。
3. 判断 **哪一侧是有序的**：
   - 如果 `nums[left] <= nums[mid]`，说明左半部分 `[left, mid]` 是有序的（用 `<=` 是为了兼容 `left == mid` 的单元素区间）。
   - 否则 `nums[left] > nums[mid]`，右半部分 `[mid, right]` 是有序的。
4. 判断 target 是否在**有序的那一半**：
   - 左半有序时：如果 `nums[left] <= target < nums[mid]`，则 target 在左半；否则在右半。
   - 右半有序时：如果 `nums[mid] < target <= nums[right]`，则 target 在右半；否则在左半。
5. 根据判断结果收缩区间（左半则 `right = mid - 1`，右半则 `left = mid + 1`），回到第 1 步；若 `left > right` 说明不存在，返回 -1。

**为什么正确（不变量论证）**：维护不变量「若 target 存在，其下标必在 `[left, right]` 内」。

- 初始 `[0, n-1]` 覆盖整个数组，成立。
- 每轮先排除 `mid`（因为 `nums[mid] != target`）。接下来只需保证「若 target 在 `[left,right]` 内，则它落在我们保留的半边」。
  - 左半有序时，左半的值域恰为 `[nums[left], nums[mid]]`。若 `target` 落在其中，则它只可能在左半；若不在其中，由于数组元素互异，target 只可能在右半。
  - 右半有序时同理，右半值域为 `[nums[mid], nums[right]]`，target 在区间内则去右半，否则去左半。
- 因此收缩后不变量保持。若中途命中 `nums[mid] == target` 立刻返回正确下标；若区间收缩为空仍未命中，则 target 不存在，返回 -1 正确。

### 复杂度分析

- **时间复杂度**：O(log n)，每轮搜索区间缩小一半。
- **空间复杂度**：O(1)。

### 关键点

- 利用「至少有一半是有序的」性质。
- 必须严格判断 target 是否落在有序区间内，再决定收缩方向。
- 与标准二分查找相比，多了判断有序区间的步骤。
- 元素互异是「target 不在有序半边 ⇒ 必在另半边」这条推理的前提。

### 易错点 / 边界情况

- **有序判断要用 `nums[left] <= nums[mid]`**：写成 `<` 在 `left == mid`（区间长度为 1）时会误判成右半有序，导致收缩错误。
- **两个值域判断的边界**：左半用 `nums[left] <= target && target < nums[mid]`，右半用 `nums[mid] < target && target <= nums[right]`。虽然 `target != nums[mid]` 已经保证，但写全等号能覆盖 `target == nums[left]`、`target == nums[right]` 这两个端点。
- **单元素数组**：`[1]` 查 1 返回 0、查 0 返回 -1。
- **旋转点位于两端**：`k = 0` 时数组完全有序，`k` 使最小值在开头时同理，算法都应正常返回。
- **返回值**：只在命中时返回下标，循环结束必须是 -1，不要返回 `left` 之类的近似位置。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/117-search-in-rotated-sorted-array-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="搜索旋转排序数组 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2

        if nums[mid] == target {
            return mid
        }

        // 判断哪一侧是有序的
        if nums[left] <= nums[mid] {
            // 左半部分有序
            if nums[left] <= target && target < nums[mid] {
                right = mid - 1 // target 在左半
            } else {
                left = mid + 1 // target 在右半
            }
        } else {
            // 右半部分有序
            if nums[mid] < target && target <= nums[right] {
                left = mid + 1 // target 在右半
            } else {
                right = mid - 1 // target 在左半
            }
        }
    }
    return -1
}

func main() {
    testCases := []struct {
        nums   []int
        target int
    }{
        {[]int{4, 5, 6, 7, 0, 1, 2}, 0},
        {[]int{4, 5, 6, 7, 0, 1, 2}, 3},
        {[]int{1}, 0},
        {[]int{4, 5, 6, 7, 0, 1, 2}, 4},
        {[]int{3, 1}, 1},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, target = %d, index = %d\n",
            tc.nums, tc.target, search(tc.nums, tc.target))
    }
}
```
