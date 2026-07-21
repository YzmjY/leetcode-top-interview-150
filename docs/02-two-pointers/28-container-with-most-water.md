# 28. 盛最多水的容器

## 题目描述

给定一个长度为 `n` 的整数数组 `height`。有 `n` 条垂线，第 `i` 条线的两个端点是 `(i, 0)` 和 `(i, height[i])`。

找出其中的两条线，使得它们与 `x` 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明：** 你不能倾斜容器。

**示例 1：**

```
输入：[1,8,6,2,5,4,8,3,7]
输出：49
解释：图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。
```

**示例 2：**

```
输入：height = [1,1]
输出：1
```

**约束条件：**

- `n == height.length`
- `2 <= n <= 10^5`
- `0 <= height[i] <= 10^4`

## 题目分析

**算法思路：** 使用对撞双指针 + 贪心。容量由两条线的距离和较短线的高度决定：`area = (right - left) * min(height[left], height[right])`。

从两端开始，每次移动较短的那根线（因为移动较长的线不会增大容量，短板决定了上限）：

- 若 `height[left] < height[right]`，则 `left++`
- 否则 `right--`

在移动过程中持续更新最大容量。

**时间复杂度：** O(n)，每个元素最多被访问一次。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/28-container-with-most-water-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="盛最多水的容器 - 交互演示">
</iframe>

## Go 代码实现

```go
// maxArea 计算容器可以容纳的最大水量
// 使用对撞双指针 + 贪心：每次移动较短的线
func maxArea(height []int) int {
    left, right := 0, len(height)-1
    maxWater := 0

    for left < right {
        // 计算当前容器的水量
        // 宽度 = right - left，高度 = 较短的线
        h := height[left]
        if height[right] < h {
            h = height[right]
        }
        area := (right - left) * h
        if area > maxWater {
            maxWater = area
        }

        // 移动较短的线，保留较长的线
        // 因为移动较长的线不会增加容量（短板不变，宽度减小）
        if height[left] < height[right] {
            left++
        } else {
            right--
        }
    }

    return maxWater
}
```
