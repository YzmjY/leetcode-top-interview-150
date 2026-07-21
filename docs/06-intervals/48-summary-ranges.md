# 48. 汇总区间

## 题目描述

给定一个 **无重复元素** 的 **有序** 整数数组 `nums`。

返回 **恰好覆盖数组中所有数字** 的 **最小有序** 区间范围列表。也就是说，`nums` 的每个元素都恰好被某个区间范围所覆盖，并且不存在属于某个范围但不属于 `nums` 的数字 `x`。

列表中的每个区间范围 `[a,b]` 应该按如下格式输出：
- `"a->b"`，如果 `a != b`
- `"a"`，如果 `a == b`

**示例 1：**

```
输入：nums = [0,1,2,4,5,7]
输出：["0->2","4->5","7"]
解释：区间范围是：
[0,2] --> "0->2"
[4,5] --> "4->5"
[7,7] --> "7"
```

**示例 2：**

```
输入：nums = [0,2,3,4,6,8,9]
输出：["0","2->4","6","8->9"]
解释：区间范围是：
[0,0] --> "0"
[2,4] --> "2->4"
[6,6] --> "6"
[8,9] --> "8->9"
```

**约束条件：**

- `0 <= nums.length <= 20`
- `-2^31 <= nums[i] <= 2^31 - 1`
- `nums` 中的所有值都 **互不相同**
- `nums` 按升序排列

## 题目分析

### 算法思路

本题需要将有序的整数数组转换为区间表示。核心思路是**一次遍历**，在遍历过程中识别连续数字段的起点和终点。

1. 使用指针 `i` 遍历数组。
2. 对于每个 `i`，它代表当前区间段的起点：
   - 用 `start` 记录当前起点值 `nums[i]`。
   - 内层循环不断移动 `i`，直到 `nums[i+1] != nums[i] + 1`（连续被打破）。
   - 此时 `nums[i]` 是当前区间段的终点。
3. 根据 `start` 和 `end` 是否相等，生成 `"start"` 或 `"start->end"` 格式的字符串。

### 复杂度分析

- **时间复杂度**：O(n)，每个元素只被访问一次。
- **空间复杂度**：O(1)，除结果列表外不占用额外空间（结果列表不计入空间复杂度）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/48-summary-ranges-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="汇总区间 - 交互演示">
</iframe>

## Go 代码实现

```go
import "strconv"

func summaryRanges(nums []int) []string {
    n := len(nums)
    if n == 0 {
        return nil
    }

    var result []string

    for i := 0; i < n; {
        // 当前区间的起点
        start := nums[i]

        // 不断向后移动，直到连续被打破
        for i++; i < n && nums[i] == nums[i-1]+1; i++ {
        }

        // 当前区间的终点
        end := nums[i-1]

        // 根据起点和终点生成对应的字符串
        if start == end {
            result = append(result, strconv.Itoa(start))
        } else {
            result = append(result, strconv.Itoa(start)+"->"+strconv.Itoa(end))
        }
    }

    return result
}
```
