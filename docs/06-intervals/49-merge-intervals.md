# 49. 合并区间

## 题目描述

以数组 `intervals` 表示若干个区间的集合，其中单个区间为 `intervals[i] = [start_i, end_i]`。请你合并所有重叠的区间，并返回 **一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间**。

**示例 1：**

```
输入：intervals = [[1,3],[2,6],[8,10],[15,18]]
输出：[[1,6],[8,10],[15,18]]
解释：区间 [1,3] 和 [2,6] 重叠, 将它们合并为 [1,6]
```

**示例 2：**

```
输入：intervals = [[1,4],[4,5]]
输出：[[1,5]]
解释：区间 [1,4] 和 [4,5] 可被视为重叠区间
```

**约束条件：**

- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i <= end_i <= 10^4`

## 题目分析

### 算法思路

合并区间的标准做法分为两步：

**第一步：排序**

将所有区间按照起点 `start` 升序排列。排序后，可以保证相邻区间如果发生重叠，它们一定是当前位置连续的。

**第二步：遍历合并**

维护一个结果列表 `merged`，遍历排序后的区间：
- 如果 `merged` 为空，或者当前区间的起点 `curr[0]` 大于 `merged` 最后一个区间的终点 `last[1]`，说明不重叠，直接将当前区间加入结果。
- 否则发生重叠，更新 `merged` 最后一个区间的终点为 `max(last[1], curr[1])`（取较大值）。

### 复杂度分析

- **时间复杂度**：O(n log n)，其中 n 是区间数量。排序需要 O(n log n)，遍历需要 O(n)。
- **空间复杂度**：O(n)，存储合并后的结果（不计算排序所需的额外空间）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/49-merge-intervals-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="合并区间 - 交互演示">
</iframe>

## Go 代码实现

```go
import "sort"

func merge(intervals [][]int) [][]int {
    if len(intervals) == 0 {
        return nil
    }

    // 按照区间起点升序排列
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][0] < intervals[j][0]
    })

    // 初始化结果，放入第一个区间
    merged := [][]int{intervals[0]}

    for i := 1; i < len(intervals); i++ {
        last := merged[len(merged)-1]
        curr := intervals[i]

        // 当前区间与最后一个结果区间重叠
        if curr[0] <= last[1] {
            // 合并：更新终点为两者终点的最大值
            if curr[1] > last[1] {
                last[1] = curr[1]
            }
        } else {
            // 不重叠，直接加入
            merged = append(merged, curr)
        }
    }

    return merged
}
```
