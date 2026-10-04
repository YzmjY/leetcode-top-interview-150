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

**算法思路：** 贪心 + "层序遍历"思想。可以把跳跃的过程看作 BFS：第 0 层只有下标 0，第 k 层是「恰好用 k 跳能到达的位置集合」。由于从 `j` 可以跳到它右侧的任意位置，每一层都是连续区间，因此不必真的用队列，只要用「当前层的右边界 `curEnd`」和「扫描过程中下一层能到达的最远位置 `curFarthest`」两个量就能完成分层扩展。维护三个变量：

- `jumps`：已跳跃的次数
- `curEnd`：当前这一跳能到达的最远边界
- `curFarthest`：遍历过程中能到达的最远位置

当遍历到 `curEnd` 时，说明当前这一层已经全部考察完毕，必须再跳一次，`jumps++`，并将 `curEnd` 更新为 `curFarthest`。

**算法步骤：**

1. 若 `n == 1`，起点即终点，返回 0。
2. 初始化 `jumps = 0`、`curEnd = 0`、`curFarthest = 0`。
3. 枚举 `i = 0 .. n-2`（**不遍历最后一个下标**，否则走到终点后可能还会触发一次边界判断，多算一跳）：
   - 更新 `curFarthest = max(curFarthest, i + nums[i])`；
   - 若 `i == curEnd`：本层考察完毕，`jumps++`，`curEnd = curFarthest`；
   - 若 `curEnd >= n-1`：终点已进入下一层，跳出循环。
4. 返回 `jumps`。

**为什么正确（贪心 = BFS 分层）：** 记 `R_k` 为「最多用 k 跳能到达的最远下标」。显然 `R_0 = 0`，且 `R_{k+1} = max{ j + nums[j] : j <= R_k }`——从 k 跳以内所有可达位置再跳一步能覆盖的最远处。代码里的 `curFarthest` 正是对已扫描前缀 `[0, curEnd]` 逐项取 `i + nums[i]` 的最大值，所以在 `i == curEnd` 时它恰好等于 `R_{jumps}`；执行 `jumps++; curEnd = curFarthest` 之后即得 `curEnd == R_{jumps}`。于是算法第一次满足 `curEnd >= n-1` 时的 `jumps` 就是最小的跳数（在它之前 `R_{jumps-1} < n-1`，终点用更少跳数到不了）。题目保证终点可达，因此 `curFarthest` 不会被 0 卡住，循环必能覆盖终点。

**时间复杂度：** O(n)，一次线性扫描。

**空间复杂度：** O(1)，只用几个整型变量。

**易错点：**

- 循环上界必须是 `i < n-1`。若遍历到最后一个下标，`i == curEnd` 可能在那里再次成立，导致多算一跳。
- `curFarthest` 是对整个已扫描前缀的滚动最大值，不能每层清零，否则会丢掉更早位置提供的射程。
- 更新 `curFarthest` 必须写在 `i == curEnd` 的判断之前，否则会漏掉边界元素自身的射程。
- 边界：`n == 1` 直接返回 0；`nums[i] == 0` 只是该位置没有额外贡献，不代表无解（题目保证可达）。
- 与第 9 题不同：本题保证有解，所以不需要判断「是否可达」。
- 数组元素全为 1 时答案是 `n-1`，可以用来快速自测。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/10-jump-game-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
