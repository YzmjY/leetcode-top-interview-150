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

**核心思路：** 最直接的做法是把 `newInterval` 先塞进 `intervals`，再调用「合并区间」的做法排序后扫描，时间是 O(n log n)。但这白白浪费了输入的两条性质：**区间已经按起点有序，而且互不重叠**。利用这两条性质，可以做到 O(n)。

关键观察：既然原列表有序，那么与 `newInterval` 相交的区间在列表中一定是**连续的一段**。并且，这段重叠区间左边的区间完全在新区间左侧（右端点都小于新区间的起点），右边的区间完全在新区间右侧。于是整个过程天然分成三段，一次线性扫描即可。

**算法步骤：**

设 `start, end` 为当前合并区间的两个端点，初值为 `newInterval` 的两个端点。

1. **阶段一（左侧不重叠段）**：只要 `intervals[i][1] < start`，说明该区间整体在 `start` 左边且不相接，直接原样放入结果，`i` 后移。
2. **阶段二（重叠段）**：只要 `intervals[i][0] <= end`，说明该区间与当前合并区间相交（因为已排序，其起点不小于之前的起点，只要起点不超过当前右端点就一定有公共点），于是并入：`start = min(start, intervals[i][0])`、`end = max(end, intervals[i][1])`，`i` 后移。循环退出时 `[start, end]` 就是合并后的完整区间，把它放入结果。
3. **阶段三（右侧不重叠段）**：剩余的区间起点都大于 `end`，全部原样放入结果。

**为什么正确：**

- **阶段二收集的正是全部重叠区间**：设某个区间满足 `intervals[j][0] <= end`，则它从 `start` 到 `end` 的这段（非空）与合并区间相交，必须并入；反之，若 `intervals[j][0] > end`，由于排序后更靠后的区间起点只会更大，它们也都不会相交。因此「连续一段」的判断是完备的。
- **合并后的 `[start, end]` 就是这段区间的并集**：取 `min`/`max` 保证覆盖所有被并入区间的端点；又因为这些区间彼此相交（都与合并区间相交），并集仍然是一个连续区间，不会出现空洞。
- **结果有序且不重叠**：阶段一放入的区间右端点严格小于 `start`，阶段三放入的区间左端点严格大于 `end`；由于每个阶段内的元素在输入中本就递增，三段拼接后整体仍按起点递增且两两不重叠。

### 复杂度分析

- **时间复杂度**：O(n)。三个阶段里下标 `i` 只增不减，每个区间最多被访问一次。
- **空间复杂度**：O(1) 额外空间（不计输出）。除了结果数组，只用了 `i`、`start`、`end` 等常数个变量。

### 易错点 / 边界情况

- **阶段一的判据必须是严格小于**：`intervals[i][1] < start`。若写成 `<=`，像 `intervals=[[1,5]], newInterval=[5,10]` 这样的输入会把 `[1,5]` 当成左侧区间直接放入，得到 `[[1,5],[5,10]]`，而正确答案是 `[[1,10]]`（端点相接视为重叠）。
- **阶段二的判据是 `<=`**：与上面一条互为镜像，`intervals[i][0] <= end` 表示端点相等也算相交。
- **不要原地修改传入的 `newInterval`**：代码用局部变量 `start, end` 承接端点的变化。若直接写 `newInterval[0] = ...`，会污染调用方的切片——如果同一个 `newInterval` 被复用（例如连续调用两次 `insert`），第二次就会拿到被改过的值而算错。同理，结果里应放入新建的 `[]int{start, end}`，而不是 `newInterval` 本身，避免结果与调用方共享底层数组。
- **`intervals` 为空**：两个循环都不执行，直接把合并区间放入结果即可，代码无需特判。
- **新区间落在所有区间右侧**：阶段一和阶段二都不会执行，结果是在末尾追加一个区间。
- **新区间与多个区间重叠**：例如示例 2，`[4,8]` 一次吞掉 `[3,5]`、`[6,7]`、`[8,10]`，阶段二会连续合并三次，注意循环条件是动态的 `end`，不要写成只与原始的 `newInterval[1]` 比较（虽然本题保证输入区间互不重叠、两种写法的结果恰好一致，但用动态端点才是通用正确的写法）。
- **结果与原输入共享内部切片**：阶段一、阶段三直接 `append` 了 `intervals[i]`，所以返回列表里的这些区间与原输入指向同一块 `[]int`；只有合并后的新区间是 `[]int{start, end}` 这个新切片。本题允许这种别名（评测只看值），但如果调用方之后还要修改原 `intervals`，需要注意结果会跟着改变。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/50-insert-interval-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="插入区间 - 交互演示">
</iframe>

## Go 代码实现

```go
func insert(intervals [][]int, newInterval []int) [][]int {
    var result [][]int
    i := 0
    n := len(intervals)

    // 用局部变量记录合并区间的边界，避免修改调用方传入的 newInterval
    start, end := newInterval[0], newInterval[1]

    // 阶段一：将所有在 newInterval 左侧且不重叠的区间加入结果
    for i < n && intervals[i][1] < start {
        result = append(result, intervals[i])
        i++
    }

    // 阶段二：合并所有与 newInterval 重叠的区间
    for i < n && intervals[i][0] <= end {
        // 更新合并区间的起点和终点
        if intervals[i][0] < start {
            start = intervals[i][0]
        }
        if intervals[i][1] > end {
            end = intervals[i][1]
        }
        i++
    }
    // 将合并后的区间加入结果
    result = append(result, []int{start, end})

    // 阶段三：将剩余区间加入结果
    for i < n {
        result = append(result, intervals[i])
        i++
    }

    return result
}
```
