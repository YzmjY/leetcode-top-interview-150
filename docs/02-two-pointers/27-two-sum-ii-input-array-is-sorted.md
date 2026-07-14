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

**算法思路：** 利用数组有序的性质，使用对撞双指针。初始化 `left = 0`，`right = n - 1`：

- 如果 `numbers[left] + numbers[right] == target`，找到答案
- 如果和小于 `target`，说明需要更大的值，`left++`
- 如果和大于 `target`，说明需要更小的值，`right--`

**时间复杂度：** O(n)，每个元素最多被访问一次。

**空间复杂度：** O(1)。

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
