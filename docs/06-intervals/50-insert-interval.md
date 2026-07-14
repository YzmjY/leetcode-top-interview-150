# 50. 插入区间

## 题目描述

给你一个 **无重叠的**，按照区间起始端点排序的区间列表 `intervals`，其中 `intervals[i] = [start_i, end_i]` 表示第 `i` 个区间的开始和结束，并且 `intervals` 按照 `start_i` 升序排列。

同样给定一个区间 `newInterval = [start, end]` 表示另一个区间的开始和结束。

在 `intervals` 中插入区间 `newInterval`，使得 `intervals` 依然按照 `start_i` 升序排列，且区间之间互不重叠（如果有必要的话，可以合并区间）。

返回插入后的 `intervals`。

**注意**：你不需要原地修改 `intervals`。你可以创建一个新数组然后返回它。

**示例 1：**

```
输入：intervals = [[1,3],[6,9]], newInterval = [2,5]
输出：[[1,5],[6,9]]
```

**示例 2：**

```
输入：intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
输出：[[1,2],[3,10],[12,16]]
解释：这是因为新的区间 [4,8] 与 [3,5],[6,7],[8,10] 重叠
```

**约束条件：**

- `0 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i <= end_i <= 10^5`
- `intervals` 根据 `start_i` 按 **升序** 排列
- `newInterval.length == 2`
- `0 <= start <= end <= 10^5`

## 题目分析

### 算法思路

由于原区间列表已经有序且互不重叠，可以将插入过程分为三个阶段：

**阶段一：收集左侧不重叠区间**

将 `end < newStart` 的区间直接加入结果（这些区间完全在新区间左侧，不受影响）。

**阶段二：合并重叠区间**

对于所有与 `newInterval` 重叠的区间（即 `start <= newEnd`），持续更新 `newInterval`：
- `newStart = min(newStart, interval.start)`
- `newEnd = max(newEnd, interval.end)`

**阶段三：收集右侧不重叠区间**

将合并后的 `newInterval` 加入结果，然后将剩余区间（`start > newEnd`）直接加入结果。

### 复杂度分析

- **时间复杂度**：O(n)，只需一次遍历。
- **空间复杂度**：O(n)，存储结果数组。

## Go 代码实现

```go
func insert(intervals [][]int, newInterval []int) [][]int {
    var result [][]int
    i := 0
    n := len(intervals)

    // 阶段一：将所有在 newInterval 左侧且不重叠的区间加入结果
    for i < n && intervals[i][1] < newInterval[0] {
        result = append(result, intervals[i])
        i++
    }

    // 阶段二：合并所有与 newInterval 重叠的区间
    for i < n && intervals[i][0] <= newInterval[1] {
        // 更新 newInterval 的起点和终点
        if intervals[i][0] < newInterval[0] {
            newInterval[0] = intervals[i][0]
        }
        if intervals[i][1] > newInterval[1] {
            newInterval[1] = intervals[i][1]
        }
        i++
    }
    // 将合并后的区间加入结果
    result = append(result, newInterval)

    // 阶段三：将剩余区间加入结果
    for i < n {
        result = append(result, intervals[i])
        i++
    }

    return result
}
```
