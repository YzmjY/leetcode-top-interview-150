# 128. 只出现一次的数字

## 题目描述

给你一个**非空**整数数组 `nums`，除了某个元素只出现一次以外，其余每个元素均出现两次。找出那个只出现了一次的元素。

你必须设计并实现线性时间复杂度的算法来解决此问题，且该算法只使用常量额外空间。

### 示例 1

```
输入：nums = [2,2,1]
输出：1
```

### 示例 2

```
输入：nums = [4,1,2,1,2]
输出：4
```

### 示例 3

```
输入：nums = [1]
输出：1
```

### 约束条件

- `1 <= nums.length <= 3 * 10^4`
- `-3 * 10^4 <= nums[i] <= 3 * 10^4`
- 除了某个元素只出现一次以外，其余每个元素均出现两次。

## 题目分析

### 算法思路

利用**异或运算 (XOR)** 的三个核心性质：

1. **任何数与 0 异或等于自身**：`a ^ 0 = a`
2. **任何数与自身异或等于 0**：`a ^ a = 0`
3. **异或满足交换律和结合律**：`a ^ b ^ a = b ^ (a ^ a) = b ^ 0 = b`

因此，将数组中所有元素异或起来：
- 出现两次的元素会互相抵消（`a ^ a = 0`）
- 最终结果就是那个只出现一次的元素

### 复杂度分析

- **时间复杂度**：O(n)，只需一次遍历。
- **空间复杂度**：O(1)，只使用了常量额外空间。

### 关键点

- 异或运算的交换律和结合律使得顺序无关紧要。
- 这是异或最经典的面试题应用。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/128-single-number-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="只出现一次的数字 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func singleNumber(nums []int) int {
    result := 0
    for _, num := range nums {
        result ^= num
    }
    return result
}

func main() {
    testCases := [][]int{
        {2, 2, 1},
        {4, 1, 2, 1, 2},
        {1},
    }

    for _, nums := range testCases {
        fmt.Printf("nums = %v, 只出现一次的数字 = %d\n",
            nums, singleNumber(nums))
    }
}
```
