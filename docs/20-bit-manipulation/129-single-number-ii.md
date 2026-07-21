# 129. 只出现一次的数字 II

## 题目描述

给你一个整数数组 `nums`，除某个元素仅出现**一次**外，其余每个元素都恰出现**三次**。请你找出并返回那个只出现了一次的元素。

你必须设计并实现线性时间复杂度的算法且不使用额外空间来解决此问题。

### 示例 1

```
输入：nums = [2,2,3,2]
输出：3
```

### 示例 2

```
输入：nums = [0,1,0,1,0,1,99]
输出：99
```

### 约束条件

- `1 <= nums.length <= 3 * 10^4`
- `-2^31 <= nums[i] <= 2^31 - 1`
- `nums` 中，除某个元素仅出现**一次**外，其余每个元素都恰出现**三次**。

## 题目分析

### 算法思路

由于每个元素（除了目标元素）出现三次，异或操作不再能直接抵消。本题需要**按位统计**：

**方法一：按位统计（通用方法）**

1. 对于 32 位整数的每一位，统计该位上 `1` 的总出现次数。
2. 由于除目标元素外，每个元素出现三次，所以每一位上 `1` 的个数模 3 的余数就是目标元素在这一位上的值。
3. 将各位的结果组合起来。

**方法二：数字电路设计（有限状态机）**

使用两个变量 `ones` 和 `twos` 模拟 3 进制计数器：
- `ones = (ones ^ num) & ^twos`
- `twos = (twos ^ num) & ^ones`

当某个数出现三次时，`ones` 和 `twos` 均归零。最终 `ones` 就是答案。

### 复杂度分析

- **时间复杂度**：O(n)，方法一为 O(32n)；方法二为 O(n)。
- **空间复杂度**：O(1)。

### 关键点

- 按位统计是一种通用的解决"某个元素出现 p 次，其余出现 k 次"问题的方法。
- 数字电路方法更加精炼，但需要理解状态转移。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/129-single-number-ii-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="只出现一次的数字 II - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// 方法一：按位统计（通用解法）
func singleNumber(nums []int) int {
    result := int32(0)
    for i := 0; i < 32; i++ {
        var count int32
        for _, num := range nums {
            count += (int32(num) >> i) & 1
        }
        // 模 3 得到目标元素在该位的值
        if count%3 != 0 {
            result |= (1 << i)
        }
    }
    return int(result)
}

// 方法二：数字电路 / 有限状态机
func singleNumber2(nums []int) int {
    ones, twos := 0, 0
    for _, num := range nums {
        ones = (ones ^ num) & ^twos
        twos = (twos ^ num) & ^ones
    }
    return ones
}

func main() {
    testCases := [][]int{
        {2, 2, 3, 2},
        {0, 1, 0, 1, 0, 1, 99},
        {-2, -2, 1, 1, 4, 1, 4, 4, -2, -2},
    }

    for _, nums := range testCases {
        fmt.Printf("nums = %v, 只出现一次的数字 = %d\n",
            nums, singleNumber(nums))
    }
}
```
