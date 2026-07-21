# 9. 跳跃游戏

## 题目描述

给你一个非负整数数组 `nums`，你最初位于数组的 **第一个下标**。数组中的每个元素代表你在该位置可以跳跃的**最大长度**。

判断你是否能够到达最后一个下标，如果可以，返回 `true`；否则，返回 `false`。

**示例 1：**

```
输入：nums = [2,3,1,1,4]
输出：true
解释：可以先跳 1 步，从下标 0 到达下标 1, 然后再从下标 1 跳 3 步到达最后一个下标。
```

**示例 2：**

```
输入：nums = [3,2,1,0,4]
输出：false
解释：无论怎样，总会到达下标为 3 的位置。但该下标的最大跳跃长度是 0，所以永远不可能到达最后一个下标。
```

**约束条件：**

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 10^5`

## 题目分析

**算法思路：** 贪心算法。维护一个变量 `maxReach` 表示当前能够到达的最远位置。遍历数组的过程中，不断更新 `maxReach = max(maxReach, i + nums[i])`。如果在某个位置 `i`，`i > maxReach`，说明当前位置不可达，返回 `false`。如果 `maxReach >= n-1`，说明可以到达最后一个下标。

**时间复杂度：** O(n)，遍历一次数组。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/09-jump-game-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="跳跃游戏 - 交互演示">
</iframe>

## Go 代码实现

```go
// canJump 判断是否能从第一个下标跳到最后一个下标
// 贪心策略：维护当前能到达的最远位置
func canJump(nums []int) bool {
    // maxReach 记录当前能够到达的最远下标
    maxReach := 0
    n := len(nums)

    for i := 0; i < n; i++ {
        // 如果当前位置已经超出了能到达的最远范围，无法继续
        if i > maxReach {
            return false
        }
        // 更新能到达的最远位置
        if i+nums[i] > maxReach {
            maxReach = i + nums[i]
        }
        // 如果已经能到达或超过最后一个下标，提前返回
        if maxReach >= n-1 {
            return true
        }
    }
    return true
}
```
