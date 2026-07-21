# 16. 接雨水

## 题目描述

给定 `n` 个非负整数表示每个宽度为 `1` 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

**示例 1：**

```
输入：height = [0,1,0,2,1,0,1,3,2,1,2,1]
输出：6
解释：上面是由数组 [0,1,0,2,1,0,1,3,2,1,2,1] 表示的高度图，在这种情况下，可以接 6 个单位的雨水（蓝色部分表示雨水）。
```

**示例 2：**

```
输入：height = [4,2,0,3,2,5]
输出：9
```

**约束条件：**

- `n == height.length`
- `1 <= n <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

## 题目分析

**算法思路：** 使用双指针法。对于每个位置 `i`，它能接的雨水量取决于它左右两边最高柱子的较小值（木桶原理）：`water[i] = min(leftMax, rightMax) - height[i]`。

双指针优化：使用 `left` 和 `right` 两个指针从两端向中间移动，同时维护 `leftMax` 和 `rightMax`：

- 当 `leftMax < rightMax` 时，处理左指针：此时 `leftMax` 就是左指针位置能接水的上限，计算后 `left++`
- 否则处理右指针：`rightMax` 是右指针位置能接水的上限，计算后 `right--`

**时间复杂度：** O(n)，单次遍历。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/16-trapping-rain-water-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="接雨水 - 交互演示">
</iframe>

## Go 代码实现

```go
// trap 计算给定高度图能接的雨水总量
// 使用双指针法，左右向中间收缩
func trap(height []int) int {
    n := len(height)
    if n == 0 {
        return 0
    }

    // left, right 为左右指针
    // leftMax 为左边遇到的最大高度
    // rightMax 为右边遇到的最大高度
    left, right := 0, n-1
    leftMax, rightMax := 0, 0
    water := 0

    for left < right {
        // 更新左右最大高度
        if height[left] > leftMax {
            leftMax = height[left]
        }
        if height[right] > rightMax {
            rightMax = height[right]
        }

        // 木桶原理：水位由较矮的一侧决定
        if leftMax < rightMax {
            // 左指针位置的接水量 = leftMax - height[left]
            water += leftMax - height[left]
            left++
        } else {
            // 右指针位置的接水量 = rightMax - height[right]
            water += rightMax - height[right]
            right--
        }
    }

    return water
}
```
