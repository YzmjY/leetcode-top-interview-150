# 51. 用最少数量的箭引爆气球

## 题目描述

有一些球形气球贴在一堵用 XY 平面表示的墙面上。墙面上的气球记录在整数数组 `points`，其中 `points[i] = [x_start, x_end]` 表示水平直径在 `x_start` 和 `x_end` 之间的气球。你不知道气球的确切 y 坐标。

一支弓箭可以沿着 x 轴从不同点 **完全垂直** 地射出。在坐标 `x` 处射出一支箭，若有一个气球的直径的开始和结束坐标为 `x_start, x_end`，且满足 `x_start <= x <= x_end`，则该气球会被 **引爆**。可以射出的弓箭的数量 **没有限制**。弓箭一旦被射出之后，可以无限地前进。

给你一个数组 `points`，返回引爆所有气球所必须射出的 **最小** 弓箭数。

**示例 1：**

```
输入：points = [[10,16],[2,8],[1,6],[7,12]]
输出：2
解释：气球可以用2支箭来爆破:
- 在 x = 6 处射出箭，击破气球 [2,8] 和 [1,6]
- 在 x = 11 处射出箭，击破气球 [10,16] 和 [7,12]
```

**示例 2：**

```
输入：points = [[1,2],[3,4],[5,6],[7,8]]
输出：4
解释：每个气球需要射出一支箭，总共需要 4 支箭
```

**示例 3：**

```
输入：points = [[1,2],[2,3],[3,4],[4,5]]
输出：2
解释：气球可以用2支箭来爆破:
- 在 x = 2 处射出箭，击破气球 [1,2] 和 [2,3]
- 在 x = 4 处射出箭，击破气球 [3,4] 和 [4,5]
```

**约束条件：**

- `1 <= points.length <= 10^5`
- `points[i].length == 2`
- `-2^31 <= x_start < x_end <= 2^31 - 1`

## 题目分析

### 算法思路

本题是经典的 **贪心 + 区间问题**，核心思想是：将气球按照右边界升序排列，每次在尽量靠右的位置射箭，让一支箭尽可能多地覆盖气球。

具体步骤：
1. 将所有气球（区间）按照右边界 `x_end` 升序排序。
2. 初始化箭的位置 `arrowPos` 为第一个气球的右边界，箭的数量 `arrows = 1`。
3. 遍历剩余气球：
   - 如果当前气球的左边界 `> arrowPos`，说明当前箭无法引爆该气球，需要新射一支箭。将 `arrowPos` 更新为当前气球的右边界，`arrows++`。
   - 如果 `<= arrowPos`，说明当前箭可以覆盖该气球，无需额外操作。

为什么按右边界排序？因为右边界越小的气球越"紧迫"，需要优先考虑。在它的右边界位置射箭，可以尽可能多地覆盖其他气球。

### 复杂度分析

- **时间复杂度**：O(n log n)，排序需要 O(n log n)，遍历需要 O(n)。
- **空间复杂度**：O(log n)，排序所需的栈空间。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/51-minimum-number-of-arrows-to-burst-balloons-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="用最少数量的箭引爆气球 - 交互演示">
</iframe>

## Go 代码实现

```go
import "sort"

func findMinArrowShots(points [][]int) int {
    if len(points) == 0 {
        return 0
    }

    // 按照右边界升序排列
    sort.Slice(points, func(i, j int) bool {
        return points[i][1] < points[j][1]
    })

    // 第一支箭射在第一个气球的右边界
    arrows := 1
    arrowPos := points[0][1]

    for i := 1; i < len(points); i++ {
        // 如果当前气球的左边界大于箭的位置，需要新射一支箭
        if points[i][0] > arrowPos {
            arrows++
            arrowPos = points[i][1]
        }
    }

    return arrows
}
```
