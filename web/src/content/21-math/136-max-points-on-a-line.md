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

**朴素想法**：枚举所有点对确定一条直线，再数这条直线包含多少点，共 O(n³)（n ≤ 300 时约千万量级，勉强可行但存在大量重复计算）。

**关键观察**：一条直线上的所有点，从其中任一点出发看，彼此斜率都相同；反过来，从某个固定点出发斜率相同的点必然与它共线。因此可以**枚举基准点 i，统计点 i 到其余各点连线的斜率分布**，出现次数最多的斜率对应的点数（再加 i 自己）就是以 i 为起点的最多共线点数。对所有 i 取最大值即可，复杂度降为 O(n²)。

**用最简分数表示斜率**：斜率 `dy/dx` 若用浮点数存储，接近的斜率可能因精度被错误地合并或区分。正确做法是把 `(dx, dy)` 同时除以 `gcd(|dx|, |dy|)` 化为最简分数，并把符号统一（例如固定让 `dx > 0`），再用字符串 `"dy/dx"` 作为 map 的 key，保证同样的斜率得到同样的 key、不同的斜率得到不同的 key。

**特殊情况**：`dx == 0` 是竖直线，`dy == 0` 是水平线，它们不能参与约分，分别用字符串 `"vertical"`、`"horizontal"` 作 key。

**算法步骤**：
1. `n <= 2` 时任意两点必共线，直接返回 n。
2. `maxCount = 0`。
3. 对每个基准点 i：清空哈希表；对每个 j ≠ i 计算 `getSlope(points[i], points[j])` 并计数；遍历哈希表，用 `count+1`（+1 是点 i 自身）更新 `maxCount`。
4. 返回 `maxCount`。

**为什么正确**：对固定的 i，所有与 i 共线的点 j 与 i 连线的斜率完全相同，会被统计到同一个 key 下；反过来，同一 key 下的任意两点与 i 的斜率都等于该 key，所以它们都与 i 共线。因此「key 的最大计数 + 1」正好是经过 i 的直线上的最多点数。任何一条直线都至少经过某个点 i，对所有 i 取最大值就是全局答案。n ≥ 3 时哈希表必然非空（至少有 n-1 ≥ 2 个点被统计），`maxCount` 一定会被更新，不需要额外兜底。

### 复杂度分析

- **时间复杂度**：O(n² log M)。对每个 i 枚举其余 n-1 个点（共 O(n²)），每次求斜率做一次 gcd，代价 O(log M)，M 为坐标范围（|dx|, |dy| ≤ 2×10^4）。由于 M 很小，也可近似看作 O(n²)。
- **空间复杂度**：O(n)，哈希表最多存 n-1 个斜率。

### 关键点

- 用最简分数而非浮点数表示斜率，避免精度问题。
- 符号要统一后再拼 key，否则 `1/-2` 与 `-1/2` 会被当成两个不同的斜率。
- 竖直线、水平线要单独处理；本题保证点互不相同，因此不会出现 `dx = dy = 0`（重合点）的情况。
- n ≤ 2 要直接返回 n。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/136-max-points-on-a-line-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="直线上最多的点数 (Max Points on a Line) - 交互演示">
</iframe>

## Go 代码实现

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

        // 找出经过 point[i] 的直线上最多的点数
        for _, count := range slopeMap {
            if count+1 > maxCount { // +1 是点 i 自身
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
