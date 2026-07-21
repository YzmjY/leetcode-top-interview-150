# 10. 跳跃游戏 II

## 题目描述

给定一个长度为 `n` 的 **0 索引** 整数数组 `nums`。初始位置为 `nums[0]`。

每个元素 `nums[i]` 表示从索引 `i` 向前跳转的最大长度。换句话说，如果你在 `nums[i]` 处，你可以跳转到任意 `nums[i + j]` 处：

- `0 <= j <= nums[i]`
- `i + j < n`

返回到达 `nums[n - 1]` 的最小跳跃次数。生成的测试用例可以到达 `nums[n - 1]`。

**示例 1：**

```
输入: nums = [2,3,1,1,4]
输出: 2
解释: 跳到最后一个位置的最小跳跃数是 2。
从下标为 0 跳到下标为 1 的位置，跳 1 步，然后跳 3 步到达数组的最后一个位置。
```

**示例 2：**

```
输入: nums = [2,3,0,1,4]
输出: 2
```

**约束条件：**

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 1000`
- 题目保证可以到达 `nums[n-1]`

## 题目分析

**算法思路：** 贪心 + "层序遍历"思想。可以把跳跃的过程看作 BFS：每一跳覆盖一个区间范围的元素。维护三个变量：

- `jumps`：已跳跃的次数
- `curEnd`：当前这一跳能到达的最远边界
- `curFarthest`：遍历过程中能到达的最远位置

当遍历到 `curEnd` 时，说明需要再跳一次，`jumps++`，并将 `curEnd` 更新为 `curFarthest`。

**时间复杂度：** O(n)，遍历一次数组。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/10-jump-game-ii-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="跳跃游戏 II - 交互演示">
</iframe>

## Go 代码实现

```go
// jump 计算到达最后一个下标的最小跳跃次数
// 贪心 + BFS 层序遍历思想
func jump(nums []int) int {
    n := len(nums)
    // 如果只有一个元素，不需要跳跃
    if n == 1 {
        return 0
    }

    // jumps 记录跳跃次数
    // curEnd 记录当前这一跳能到达的最远边界
    // curFarthest 记录遍历过程中能到达的最远位置
    jumps := 0
    curEnd := 0
    curFarthest := 0

    for i := 0; i < n-1; i++ {
        // 更新能到达的最远位置
        if i+nums[i] > curFarthest {
            curFarthest = i + nums[i]
        }
        // 到达当前跳跃的边界，必须再跳一次
        if i == curEnd {
            jumps++
            curEnd = curFarthest
            // 如果已经能到达最后一个元素，提前返回
            if curEnd >= n-1 {
                break
            }
        }
    }

    return jumps
}
```
