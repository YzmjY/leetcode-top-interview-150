# 27. 两数之和 II - 输入有序数组

## 题目描述

给你一个下标从 **1** 开始的整数数组 `numbers`，该数组已按 **非递减顺序排列**，请你从数组中找出满足相加之和等于目标数 `target` 的两个数。如果设这两个数分别是 `numbers[index1]` 和 `numbers[index2]`，则 `1 <= index1 < index2 <= numbers.length`。

以长度为 2 的整数数组 `[index1, index2]` 的形式返回这两个整数的下标 `index1` 和 `index2`。

你可以假设每个输入 **只对应唯一的答案**，而且你 **不可以** 重复使用相同的元素。

你所设计的解决方案必须只使用常量级的额外空间。

**示例 1：**

```
输入：numbers = [2,7,11,15], target = 9
输出：[1,2]
解释：2 与 7 之和等于目标数 9。因此 index1 = 1, index2 = 2。返回 [1, 2]。
```

**示例 2：**

```
输入：numbers = [2,3,4], target = 6
输出：[1,3]
解释：2 与 4 之和等于目标数 6。因此 index1 = 1, index2 = 3。返回 [1, 3]。
```

**示例 3：**

```
输入：numbers = [-1,0], target = -1
输出：[1,2]
解释：-1 与 0 之和等于目标数 -1。因此 index1 = 1, index2 = 2。返回 [1, 2]。
```

**约束条件：**

- `2 <= numbers.length <= 3 * 10^4`
- `-1000 <= numbers[i] <= 1000`
- `numbers` 按 **非递减顺序** 排列
- `-1000 <= target <= 1000`
- 仅存在一个有效答案

## 题目分析

**算法思路：** 数组有序是本题最重要的性质。暴力枚举所有数对是 O(n²)；而有序让「和的大小」随指针移动单调变化——`left` 右移和变大，`right` 左移和变小。于是可以从两端向中间逼近，每次移动都能排除掉一整批不可能的组合。

**算法步骤：**

1. `left = 0`，`right = n - 1`。
2. 当 `left < right` 时，令 `sum = numbers[left] + numbers[right]`：
   - `sum == target`：找到答案，返回 `[left+1, right+1]`（题目要求 1-based 下标）；
   - `sum < target`：需要更大的和，`left++`；
   - `sum > target`：需要更小的和，`right--`。
3. 题目保证有唯一解，循环内必然返回。

**为什么正确（排除法证明）：** 每次移动都能排除掉一整批组合。

- 若 `numbers[left] + numbers[right] < target`：对任何 `k < right`，都有 `numbers[k] <= numbers[right]`，于是 `numbers[left] + numbers[k] <= numbers[left] + numbers[right] < target`。也就是说，`left` 与 `right` 左侧的任何下标都无法凑出 target，`left` 可以永久排除，放心 `left++`。
- 若 `numbers[left] + numbers[right] > target`：对任何 `k > left`，`numbers[k] >= numbers[left]`，所以 `numbers[k] + numbers[right] >= numbers[left] + numbers[right] > target`，`right` 与右侧任何下标也无法凑出 target，排除 `right`，放心 `right--`。

被排除的组合都包含当前被丢弃的端点且都满足不了 target，因此不会误删答案；由于解存在，指针最终一定会在解处停下。

**不变量：** 区间 `[left, right]` 内始终包含至少一组解（解的两个下标都在区间内）。

**时间复杂度：** O(n)。每轮至少移动一个指针，两个指针合计移动不超过 n 次；无需二分，也不需要额外扫描。

**空间复杂度：** O(1)。只用了两个指针和常数个变量，符合题目「常量级额外空间」的要求。

**易错点：**

- 返回的是 **1-based** 下标，别忘记 `+1`。
- 数组是**非递减**的，可能相等。`numbers[left] == numbers[right]` 时移动哪一侧都可以，但每轮必须有一个指针移动，否则会死循环。
- 不要排序后再找：本题数组本身有序且要求返回原下标，排序会破坏下标对应关系。
- 题目只保证唯一解，所以找到即可返回；若要「返回所有解」，就不能提前返回。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/27-two-sum-ii-input-array-is-sorted-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="两数之和 II - 交互演示">
</iframe>

## Go 代码实现

```go
// twoSum 在有序数组中找到两数之和等于 target 的两个数的下标（1-based）
// 使用对撞双指针，利用数组有序的性质
func twoSum(numbers []int, target int) []int {
    left, right := 0, len(numbers)-1

    for left < right {
        sum := numbers[left] + numbers[right]
        if sum == target {
            // 找到目标，返回 1-based 下标
            return []int{left + 1, right + 1}
        } else if sum < target {
            // 和太小，左指针右移增大和
            left++
        } else {
            // 和太大，右指针左移减小和
            right--
        }
    }

    // 题目保证一定有解，不会执行到这里
    return []int{-1, -1}
}
```
