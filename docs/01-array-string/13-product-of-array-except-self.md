# 13. 除自身以外数组的乘积

## 题目描述

给你一个整数数组 `nums`，返回 数组 `answer`，其中 `answer[i]` 等于 `nums` 中除 `nums[i]` 之外其余各元素的乘积。

题目数据 **保证** 数组 `nums` 之中任意元素的全部前缀元素和后缀的乘积都在 **32 位** 整数范围内。

请 **不要使用除法**，且在 `O(n)` 时间复杂度内完成此题。

**示例 1：**

```
输入: nums = [1,2,3,4]
输出: [24,12,8,6]
```

**示例 2：**

```
输入: nums = [-1,1,0,-3,3]
输出: [0,0,9,0,0]
```

**约束条件：**

- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- **保证** 数组 `nums` 之中任意元素的全部前缀元素和后缀的乘积都在 **32 位** 整数范围内

**进阶：** 你可以在 `O(1)` 的额外空间复杂度内完成这个题目吗？（出于对空间复杂度分析的目的，输出数组 **不被视为** 额外空间。）

## 题目分析

**算法思路：** 使用前缀积和后缀积。对于位置 `i`，`answer[i] = 左侧所有元素的乘积 * 右侧所有元素的乘积`。

我们可以用两次遍历完成：
1. 第一次从左到右计算前缀积：`answer[i]` 存储 `nums[0] * ... * nums[i-1]`
2. 第二次从右到左计算后缀积：用一个变量 `suffix` 存储右侧乘积，将 `answer[i] *= suffix`，然后更新 `suffix *= nums[i]`

这样只需要 O(1) 的额外空间（输出数组不计入）。

**时间复杂度：** O(n)，两次遍历。

**空间复杂度：** O(1)，输出数组不计入额外空间。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/13-product-of-array-except-self-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="除自身以外数组的乘积 - 交互演示">
</iframe>

## Go 代码实现

```go
// productExceptSelf 计算除自身以外数组的乘积
// 使用前缀积 + 后缀积，两次遍历
func productExceptSelf(nums []int) []int {
    n := len(nums)
    // answer 数组先用于存储前缀积，最终存储结果
    answer := make([]int, n)

    // 第一次遍历：计算前缀积
    // answer[i] = nums[0] * nums[1] * ... * nums[i-1]
    answer[0] = 1 // 索引 0 左侧没有元素，前缀积为 1
    for i := 1; i < n; i++ {
        answer[i] = answer[i-1] * nums[i-1]
    }

    // 第二次遍历：乘以后缀积
    // suffix 记录 nums[i+1] * ... * nums[n-1]
    suffix := 1 // 索引 n-1 右侧没有元素，后缀积为 1
    for i := n - 1; i >= 0; i-- {
        answer[i] *= suffix
        suffix *= nums[i]
    }

    return answer
}
```
