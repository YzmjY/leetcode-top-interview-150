# 114. 搜索插入位置

## 题目描述

给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。

请必须使用时间复杂度为 O(log n) 的算法。

### 示例 1

```
输入: nums = [1,3,5,6], target = 5
输出: 2
```

### 示例 2

```
输入: nums = [1,3,5,6], target = 2
输出: 1
```

### 示例 3

```
输入: nums = [1,3,5,6], target = 7
输出: 4
```

### 约束条件

- `1 <= nums.length <= 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 为**无重复元素**的**升序**排列数组
- `-10^4 <= target <= 10^4`

## 题目分析

### 算法思路

**关键观察**：如果 target 不存在，它会插在「所有小于 target 的元素之后、所有大于等于 target 的元素之前」。也就是说，插入位置恰好等于**第一个大于等于 target 的下标**（数组中严格小于 target 的元素个数）。这正是二分查找里的 **lowerBound**。题目要求 O(log n)，lowerBound 的标准二分即可。

**算法步骤**（左闭右开区间 `[left, right)`）：

1. 初始化 `left = 0, right = len(nums)`，表示答案在 `[left, right]` 内。注意 `right` 取 `len(nums)` 而不是 `len(nums)-1`，因为答案可能是「插到末尾」。
2. 当 `left < right` 时，取 `mid = left + (right-left)/2`。
3. 若 `nums[mid] < target`：`mid` 及其左边都不可能成为答案，令 `left = mid + 1`。
4. 否则（`nums[mid] >= target`）：`mid` 有可能是答案，但它右边还可能更早的元素满足条件，令 `right = mid`。
5. 循环结束时有 `left == right`，该位置就是答案。

**不变量**：循环的每一轮开始前都满足「`nums[0..left-1]` 全部 `< target`」且「`nums[right..n-1]` 全部 `>= target`」，因此答案一定落在 `[left, right]` 中。第 3、4 步分别把不满足条件的半边排除，不变量得以保持。循环终止时 `left == right`，区间收缩为一个点，必为答案。

### 为什么正确

- 循环结束时 `left == right` 记作 `pos`，由不变量：`nums[pos-1] < target`（若 `pos > 0`），`nums[pos] >= target`（若 `pos < n`）。这正是「第一个大于等于 target」的定义，也就是 target 应插入的位置。
- 若 `target` 存在于数组中，`pos` 就是它第一次出现的下标，符合「找到目标值返回其索引」。

### 复杂度分析

- **时间复杂度**：O(log n)，每轮区间长度减半。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 区间定义 `[left, right)`，所以 `right = len(nums)`。
- 循环条件为 `left < right`，退出时 `left == right`。
- `right = mid` 而不是 `mid - 1`，因为 `mid` 本身可能是答案。
- 该模板天然处理了 target 大于所有元素的情况（返回 `len(nums)`）。

### 易错点 / 边界情况

- **target 小于所有元素**：`right` 会一路收缩到 0，返回 0。
- **target 大于所有元素**：`left` 会一路加到 `n`，返回 `n`（`right` 初值必须是 `n`，否则这一情况无法表达）。
- **不能用 `nums[mid] <= target` 收缩左边**：那样求到的是 upperBound，target 存在时会返回它之后的位置。
- **单元素数组**：`[1]` 配合 target `0/1/2` 分别返回 `0/0/1`，模板都能覆盖。
- **题目约束保证了数组无重复且 target 范围与元素同量级**，无需担心 `target+1` 之类的越界写法（本解法也没用到）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/114-search-insert-position-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="搜索插入位置 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func searchInsert(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left
}

func main() {
    testCases := []struct {
        nums   []int
        target int
    }{
        {[]int{1, 3, 5, 6}, 5},
        {[]int{1, 3, 5, 6}, 2},
        {[]int{1, 3, 5, 6}, 7},
        {[]int{1, 3, 5, 6}, 0},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, target = %d, 插入位置 = %d\n",
            tc.nums, tc.target, searchInsert(tc.nums, tc.target))
    }
}
```
