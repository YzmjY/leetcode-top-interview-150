# 136. 直线上最多的点数 (Max Points on a Line)

## 题目描述

给你一个数组 `points`，其中 `points[i] = [xi, yi]` 表示 **X-Y** 平面上的一个点。求最多有多少个点在同一条直线上。

**示例 1：**

```
输入：points = [[1,1],[2,2],[3,3]]
输出：3
```

**示例 2：**

```
输入：points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]
输出：4
```

**约束条件：**

- `1 <= points.length <= 300`
- `points[i].length == 2`
- `-10^4 <= xi, yi <= 10^4`
- 所有的点 **互不相同**

## 题目分析

### 算法思路

**核心思想：枚举每个点作为基准，统计经过该点的所有直线的斜率分布。**

对于每个点 `i`：

1. 使用哈希表记录从点 `i` 到其他点的斜率及其出现次数。
2. 斜率用分数（最简分数）表示，避免浮点数精度问题。
   - dx = x2 - x1, dy = y2 - y1
   - 将 dx, dy 除以它们的最大公约数（gcd）化为最简分式。
   - 用字符串 `"dy/dx"` 作为 key 存储。
3. 统计所有斜率中频率最高的，加上点 `i` 自身即为经过点 `i` 的直线上的最大点数。
4. 对所有点取最大值。

**处理特殊情况：**
- dx = 0（垂直线）：斜率定义为 `"vertical"`。
- dy = 0（水平线）：斜率定义为 `"horizontal"`。

### 复杂度分析

- **时间复杂度**：O(n^2)，对每个点枚举其余点，每次计算 gcd 为 O(log M)，M 为坐标范围。总体 O(n^2 log M)。
- **空间复杂度**：O(n)，哈希表存储斜率计数。

### 关键点

- 使用分数（最简分式）而非浮点数表示斜率，避免精度问题。
- 注意重复点的情况（本题保证点互不相同，但 LeetCode 原题可能有重复点）。
- 使用 GCD 化简分数。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/136-max-points-on-a-line-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="直线上最多的点数 (Max Points on a Line) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func maxPoints(points [][]int) int {
    n := len(points)
    if n <= 2 {
        return n
    }

    maxCount := 0

    for i := 0; i < n; i++ {
        slopeMap := make(map[string]int)
        for j := 0; j < n; j++ {
            if i == j {
                continue
            }
            slope := getSlope(points[i], points[j])
            slopeMap[slope]++
        }

        // 找出经过 point[i] 的直线上最多的点数
        for _, count := range slopeMap {
            if count+1 > maxCount { // +1 是点 i 自身
                maxCount = count + 1
            }
        }

        // 如果所有点都与当前点不共线（或无其他点），至少有一个点
        if len(slopeMap) == 0 && maxCount == 0 {
            maxCount = 1
        }
    }

    return maxCount
}

func getSlope(p1, p2 []int) string {
    dx := p2[0] - p1[0]
    dy := p2[1] - p1[1]

    if dx == 0 {
        return "vertical"
    }
    if dy == 0 {
        return "horizontal"
    }

    // 化简分数
    g := gcd(abs(dx), abs(dy))
    dx /= g
    dy /= g

    // 保证符号一致性（把符号统一放在 dx 上）
    if dx < 0 {
        dx = -dx
        dy = -dy
    }

    return fmt.Sprintf("%d/%d", dy, dx)
}

func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

func abs(x int) int {
    if x < 0 {
        return -x
    }
    return x
}
```

注意：上述代码需要引入 `"fmt"` 包。完整可运行版本：

```go
package main

import "fmt"

func maxPoints(points [][]int) int {
    n := len(points)
    if n <= 2 {
        return n
    }

    maxCount := 0

    for i := 0; i < n; i++ {
        slopeMap := make(map[string]int)
        for j := 0; j < n; j++ {
            if i == j {
                continue
            }
            slope := getSlope(points[i], points[j])
            slopeMap[slope]++
        }

        for _, count := range slopeMap {
            if count+1 > maxCount {
                maxCount = count + 1
            }
        }
    }

    return maxCount
}

func getSlope(p1, p2 []int) string {
    dx := p2[0] - p1[0]
    dy := p2[1] - p1[1]

    if dx == 0 {
        return "vertical"
    }
    if dy == 0 {
        return "horizontal"
    }

    g := gcd(abs(dx), abs(dy))
    dx /= g
    dy /= g

    if dx < 0 {
        dx = -dx
        dy = -dy
    }

    return fmt.Sprintf("%d/%d", dy, dx)
}

func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

func abs(x int) int {
    if x < 0 {
        return -x
    }
    return x
}
```
