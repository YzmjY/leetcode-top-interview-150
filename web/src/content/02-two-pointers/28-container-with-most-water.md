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

**算法思路：** 容器水量由两条线中较短的那条决定：`area = (right - left) * min(height[left], height[right])`。暴力枚举所有 `(i, j)` 是 O(n²)。优化的关键观察是：容量受**短板**限制，移动长板没有意义——把较高的那条线向内移，宽度一定变小，而新的高度不可能超过原来的短板，水量只会更小或不变。所以从两端开始，每次只移动较短的那条线，才有可能让短板变高、把容量做大。

**算法步骤：**

1. `left = 0`，`right = n - 1`，`maxWater = 0`。
2. 当 `left < right` 时：
   - 取 `h = min(height[left], height[right])`，算 `area = (right - left) * h`，更新 `maxWater`；
   - 若 `height[left] < height[right]` 则 `left++`，否则 `right--`（相等时移动哪侧都行，只要有移动）。
3. 返回 `maxWater`。

**为什么正确（贪心 / 排除法）：** 不妨设 `height[left] < height[right]`（另一侧对称）。此时对任何 `k`（`left < k < right`），以 `left` 为左端点的容器水量为 `(k - left) * min(height[left], height[k]) <= (right - left) * height[left]`——宽度变小，高度又不会超过 `height[left]`。也就是说，**在所有以 `left` 为一边的容器中，当前的 `(left, right)` 已经最大**。既然 `left` 不可能再和右边任何位置组成更大的水量，就可以安全地丢弃 `left` 并右移。每轮迭代丢弃一个端点，最终必然检查过最优解所在的那对端点。

**不变量：** 每轮开始时，尚未被排除的候选端点都落在 `[left, right]` 内，且最优解仍可能在其中。

**时间复杂度：** O(n)。每轮至少移动一个指针，两个指针合计移动不超过 n 次。

**空间复杂度：** O(1)，只用指针和当前最大水量。

**易错点：**

- 移动的是**较短**的线；写反成移动较长的线会得到错误答案。
- 两侧等高时移动任意一侧都不影响正确性，但每轮必须有指针移动，否则死循环。
- `height[i]` 可以为 0，此时那一侧贡献水量为 0；全为 0 时答案为 0。
- 不要对数组排序：下标本身就是容器宽度，排序会破坏问题结构。
- `n <= 10^5`、`height[i] <= 10^4`，最大水量约 `10^9`，32 位 int 足够，不会溢出。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/28-container-with-most-water-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
