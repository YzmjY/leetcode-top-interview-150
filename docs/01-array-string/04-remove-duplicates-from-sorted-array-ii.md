# 4. 删除有序数组中的重复项 II

## 题目描述

给你一个有序数组 `nums`，请你 **原地** 删除重复出现的元素，使得出现次数超过两次的元素**只出现两次**，返回删除后数组的新长度。

不要使用额外的数组空间，你必须在 **原地** 修改输入数组 并在使用 O(1) 额外空间的条件下完成。

**示例 1：**

```
输入：nums = [1,1,1,2,2,3]
输出：5, nums = [1,1,2,2,3]
解释：函数应返回新长度 length = 5，并且原数组的前五个元素被修改为 1, 1, 2, 2, 3。
不需要考虑数组中超出新长度后面的元素。
```

**示例 2：**

```
输入：nums = [0,0,1,1,1,1,2,3,3]
输出：7, nums = [0,0,1,1,2,3,3]
解释：函数应返回新长度 length = 7，并且原数组的前七个元素被修改为 0, 0, 1, 1, 2, 3, 3。
不需要考虑数组中超出新长度后面的元素。
```

**约束条件：**

- `1 <= nums.length <= 3 * 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `nums` 已按升序排列

## 题目分析

**算法思路：** 使用快慢指针的变体。由于每个元素最多出现两次，我们可以利用有序数组的性质：如果当前元素 `nums[fast]` 不等于 `nums[slow-2]`，则说明它可以被保留（前两个位置没有与它重复超过两次）。`slow` 指针指向下一个可以放置的位置。初始时 `slow` 从索引 2 开始（前两个元素无条件保留），然后遍历从索引 2 开始的元素。

**时间复杂度：** O(n)，遍历一次数组。

**空间复杂度：** O(1)，原地操作。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/04-remove-duplicates-from-sorted-array-ii-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="删除有序数组中的重复项 II - 交互演示">
</iframe>

## Go 代码实现

```go
// removeDuplicates 原地删除有序数组中重复超过两次的元素，返回新数组长度
// 使用快慢指针，利用 nums[fast] != nums[slow-2] 判断是否允许保留
func removeDuplicates(nums []int) int {
    n := len(nums)
    if n <= 2 {
        return n
    }

    // slow 指向下一个可放置的位置，前两个元素无条件保留
    slow := 2
    // fast 从第 3 个元素开始遍历
    for fast := 2; fast < n; fast++ {
        // 如果当前元素不等于 slow-2 位置的元素，
        // 说明当前元素不会导致出现 3 次重复
        if nums[fast] != nums[slow-2] {
            nums[slow] = nums[fast]
            slow++
        }
    }
    return slow
}
```
