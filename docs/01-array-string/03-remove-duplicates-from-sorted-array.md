# 3. 删除有序数组中的重复项

## 题目描述

给你一个 **非严格递增排列** 的数组 `nums`，请你 **原地** 删除重复出现的元素，使每个元素 **只出现一次**，返回删除后数组的新长度。元素的 **相对顺序** 应该保持 **一致**。然后返回 `nums` 中唯一元素的个数。

考虑 `nums` 的唯一元素的数量为 `k`，你需要做以下事情确保你的题解可以通过：

- 更改数组 `nums`，使 `nums` 的前 `k` 个元素包含唯一元素，并按照它们最初在 `nums` 中出现的顺序排列。`nums` 的其余元素与 `nums` 的大小无关。
- 返回 `k`。

**示例 1：**

```
输入：nums = [1,1,2]
输出：2, nums = [1,2,_]
解释：函数应该返回新的长度 2，并且原数组 nums 的前两个元素被修改为 1, 2。
不需要考虑数组中超出新长度后面的元素。
```

**示例 2：**

```
输入：nums = [0,0,1,1,1,2,2,3,3,4]
输出：5, nums = [0,1,2,3,4]
解释：函数应该返回新的长度 5，并且原数组 nums 的前五个元素被修改为 0, 1, 2, 3, 4。
不需要考虑数组中超出新长度后面的元素。
```

**约束条件：**

- `1 <= nums.length <= 3 * 10^4`
- `-100 <= nums[i] <= 100`
- `nums` 已按非严格递增排列

## 题目分析

**算法思路：** 使用快慢指针。由于数组已经有序，相同元素必然相邻。慢指针 `slow` 指向最后一个已确认不重复的元素的位置，快指针 `fast` 遍历数组。当 `nums[fast] != nums[slow]` 时，说明发现了一个新的不重复元素，将其放到 `slow+1` 的位置。

**时间复杂度：** O(n)，遍历一次数组。

**空间复杂度：** O(1)，原地操作。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/03-remove-duplicates-from-sorted-array-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="删除有序数组中的重复项 - 交互演示">
</iframe>

## Go 代码实现

```go
// removeDuplicates 原地删除有序数组中的重复项，返回新数组长度
// 使用快慢指针，利用数组有序的特性
func removeDuplicates(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }

    // slow 指向最后一个不重复元素的位置
    slow := 0
    // fast 遍历数组，寻找新的不重复元素
    for fast := 1; fast < n; fast++ {
        if nums[fast] != nums[slow] {
            // 发现新的不重复元素，放置到 slow+1 位置
            slow++
            nums[slow] = nums[fast]
        }
    }
    // slow 是索引，长度需要 +1
    return slow + 1
}
```
