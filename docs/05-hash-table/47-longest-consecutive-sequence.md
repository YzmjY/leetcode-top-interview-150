# 47. 最长连续序列

## 题目描述

给定一个未排序的整数数组 `nums`，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 O(n) 的算法解决此问题。

**示例 1：**

```
输入：nums = [100,4,200,1,3,2]
输出：4
解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。
```

**示例 2：**

```
输入：nums = [0,3,7,2,5,8,4,6,0,1]
输出：9
```

**约束条件：**

- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## 题目分析

### 算法思路

要在 O(n) 时间复杂度内解决此问题，不能使用排序（排序至少 O(n log n)）。

核心思路：**使用哈希集合对每个元素进行 O(1) 的查找**。

具体做法：
1. 将所有数字放入一个哈希集合 `set` 中，以便 O(1) 检查某个数字是否存在。
2. 遍历数组中的每个数字 `num`：
   - 如果 `num - 1` 存在于集合中，说明 `num` 不是一个连续序列的起始点，**跳过**（因为从 `num-1` 开始计数会得到更长的序列）。
   - 如果 `num - 1` 不存在，说明 `num` 是一个序列的起点。此时从 `num` 开始，不断检查 `num+1`, `num+2`, ... 是否在集合中，统计连续序列的长度。
   - 更新全局最长长度。

**关键优化**：只从序列的起点开始计数（`num-1` 不存在于集合中），确保每个元素在最坏情况下也只被访问一次，从而实现 O(n) 的时间复杂度。

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多被访问两次（一次在遍历时，一次在 while 循环中检查连续序列）。因为哈希查找是 O(1)，总体为 O(n)。
- **空间复杂度**：O(n)，哈希集合存储所有元素。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/47-longest-consecutive-sequence-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="最长连续序列 - 交互演示">
</iframe>

## Go 代码实现

```go
func longestConsecutive(nums []int) int {
    // 将所有数字放入哈希集合
    numSet := make(map[int]bool, len(nums))
    for _, num := range nums {
        numSet[num] = true
    }

    longest := 0

    for _, num := range nums {
        // 如果 num-1 存在于集合中，说明 num 不是序列起点，跳过
        if numSet[num-1] {
            continue
        }

        // num 是序列起点，向右侧延伸
        curNum := num
        curLen := 1
        for numSet[curNum+1] {
            curNum++
            curLen++
        }

        // 更新最长长度
        if curLen > longest {
            longest = curLen
        }
    }

    return longest
}
```
