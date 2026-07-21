# 2. 移除元素

## 题目描述

给你一个数组 `nums` 和一个值 `val`，你需要 **原地** 移除所有数值等于 `val` 的元素，并返回移除后数组的新长度。

不要使用额外的数组空间，你必须仅使用 `O(1)` 额外空间并 **原地** 修改输入数组。

元素的顺序可以改变。你不需要考虑数组中超出新长度后面的元素。

**示例 1：**

```
输入：nums = [3,2,2,3], val = 3
输出：2, nums = [2,2,_,_]
解释：你的函数应该返回 k = 2, 并且 nums 中的前两个元素均为 2。
你在返回的 k 个元素之外留下了什么并不重要（因此它们并不计入评测）。
```

**示例 2：**

```
输入：nums = [0,1,2,2,3,0,4,2], val = 2
输出：5, nums = [0,1,4,0,3,_,_,_]
解释：你的函数应该返回 k = 5，并且 nums 中的前五个元素为 0,0,1,3,4。
注意这五个元素可以任意顺序返回。
你在返回的 k 个元素之外留下了什么并不重要（因此它们并不计入评测）。
```

**约束条件：**

- `0 <= nums.length <= 100`
- `0 <= nums[i] <= 50`
- `0 <= val <= 100`

## 题目分析

**算法思路：** 使用快慢指针（双指针）。慢指针 `slow` 指向当前有效位置，快指针 `fast` 遍历整个数组。当 `nums[fast] != val` 时，将 `nums[fast]` 复制到 `nums[slow]` 位置，然后 `slow` 后移。这样所有不等于 `val` 的元素都会被移动到数组的前面。

**时间复杂度：** O(n)，遍历一次数组。

**空间复杂度：** O(1)，原地操作。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/02-remove-element-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="移除元素 - 交互演示">
</iframe>

## Go 代码实现

```go
// removeElement 原地移除数组中所有等于 val 的元素，返回新数组长度
// 使用快慢指针：慢指针指向有效位置，快指针遍历数组
func removeElement(nums []int, val int) int {
    // slow 指向下一个不等于 val 的元素应该放置的位置
    slow := 0
    // fast 遍历数组中的每个元素
    for fast := 0; fast < len(nums); fast++ {
        if nums[fast] != val {
            // 将不等于 val 的元素移动到前面
            nums[slow] = nums[fast]
            slow++
        }
    }
    return slow
}
```
