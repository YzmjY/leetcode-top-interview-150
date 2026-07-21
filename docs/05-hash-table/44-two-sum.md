# 44. 两数之和

## 题目描述

给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出 **和为目标值** `target` 的那 **两个** 整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

**示例 1：**

```
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9，返回 [0, 1]。
```

**示例 2：**

```
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

**示例 3：**

```
输入：nums = [3,3], target = 6
输出：[0,1]
```

**约束条件：**

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`
- **只会存在一个有效答案**

**进阶**：你可以想出一个时间复杂度小于 O(n^2) 的算法吗？

## 题目分析

### 算法思路

**方法一：暴力枚举**

双重循环遍历所有数对，找到和为 `target` 的两个数。时间复杂度 O(n^2)，空间复杂度 O(1)。

**方法二：哈希表（推荐）**

核心思想：对于数组中的每个元素 `x`，需要寻找的另一个值是 `target - x`。如果能 O(1) 地判断 `target - x` 是否已经出现过，就能在 O(n) 时间内找到答案。

具体做法：
1. 遍历数组，对于当前元素 `nums[i]`：
   - 计算 `complement = target - nums[i]`。
   - 检查 `complement` 是否在哈希表中（作为键存在）。
   - 如果在，返回 `[index_of_complement, i]`。
   - 如果不在，将 `(nums[i], i)` 存入哈希表。

关键技巧：**遍历时一边检查一边插入**，这样可以避免处理重复元素和同一元素用两次的情况。

### 复杂度分析

- **时间复杂度**：O(n)，只需遍历数组一次。
- **空间复杂度**：O(n)，哈希表最多存储 n 个元素。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/44-two-sum-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="两数之和 - 交互演示">
</iframe>

## Go 代码实现

```go
func twoSum(nums []int, target int) []int {
    // 哈希表：值 -> 下标
    numIdx := make(map[int]int)

    for i, num := range nums {
        // 计算需要配对的另一个数
        complement := target - num

        // 检查 complement 是否已经在哈希表中
        if idx, ok := numIdx[complement]; ok {
            return []int{idx, i}
        }

        // 将当前数字和下标存入哈希表
        numIdx[num] = i
    }

    // 题目保证有解，不会执行到这里
    return nil
}
```
