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

**算法思路：** 每根柱子能接的水由它左右两侧最高柱子的较小值决定（木桶原理）：`water[i] = min(leftMax[i], rightMax[i]) - height[i]`，负值记 0。最直接的做法是先分别预处理左侧前缀最大值和右侧后缀最大值两个数组，空间 O(n)。进一步观察：任意时刻我们只需要知道「左边已扫过的最高」和「右边已扫过的最高」，而两侧中较矮的那一侧，其指针位置的水量已经可以确定并结算——因为它对面的墙只会更高，不会更低。于是可以用左右对撞的双指针把空间降到 O(1)。

**算法步骤：**

1. 若 `n == 0` 直接返回 0（约束下 `n >= 1`，属保险处理）。
2. 初始化 `left = 0`、`right = n-1`、`leftMax = 0`、`rightMax = 0`、`water = 0`。
3. 当 `left < right` 时循环：
   - 先更新两侧已知最大高度：`leftMax = max(leftMax, height[left])`、`rightMax = max(rightMax, height[right])`；
   - 若 `leftMax < rightMax`：此时左指针位置能接的水由 `leftMax` 封顶（右侧一定存在不低于 `rightMax` 的墙），累加 `water += leftMax - height[left]`，然后 `left++`；
   - 否则处理右指针位置：`water += rightMax - height[right]`，然后 `right--`。
4. 返回 `water`。

**为什么正确（双指针的结算依据）：** 记 `L[i] = max(height[0..i])`、`R[i] = max(height[i..n-1])`，由于 `L[i] >= height[i]` 且 `R[i] >= height[i]`，正确答案就是 `sum(min(L[i], R[i]) - height[i])`。

- 当 `leftMax < rightMax` 时，`leftMax` 恰好是 `L[left]`；又因为 `[left..n-1]` 包含 `[right..n-1]`，有 `R[left] >= rightMax = R[right] > leftMax`，所以 `min(L[left], R[left]) = leftMax`，此刻结算 `leftMax - height[left]` 正确，且之后不再改变。
- 当 `leftMax >= rightMax` 时，`rightMax` 恰好是 `R[right]`；又因为 `[0..right]` 包含 `[0..left]`，有 `L[right] >= leftMax = L[left] >= rightMax`，所以 `min(L[right], R[right]) = rightMax`，结算右指针位置同样正确。

每次结算后对应指针向内移动一位，永不回头，因此每个位置的水量最多被计算一次且计算正确。

**时间复杂度：** O(n)，`left` 与 `right` 合计移动 n-1 次，每个下标只被访问一次。

**空间复杂度：** O(1)，只用 `left/right/leftMax/rightMax/water` 五个变量。

**易错点：**

- 更新 `leftMax`/`rightMax` 要放在比较和结算之前，否则当前柱子自身的高度不会计入它能接水的上界。
- 结算时用 `leftMax - height[left]`，因为 `leftMax` 已经先取过 `max(..., height[left])`，差值必然非负，无需再与 0 取最大值。
- 循环条件是 `left < right`，相遇位置不参与结算。可以证明相遇位置要么是数组端点，要么是全局最高点（否则与指针移动规则矛盾），它自身能接的水量本就是 0，因此不会漏算。
- 边界：`n == 1` 返回 0；单调递增或递减数组返回 0；全等高度返回 0；下标 0 与 n-1 因为缺少一侧的墙，水量恒为 0。
- 高度非负，`leftMax/rightMax` 初始化为 0 即可，不需要设为 `height[0]`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/16-trapping-rain-water-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
