# 130. 数字范围按位与

## 题目描述

给你两个整数 `left` 和 `right`，表示区间 `[left, right]`，返回此区间内所有数字**按位与**的结果（包含 `left`、`right` 端点）。

### 示例 1

```
输入：left = 5, right = 7
输出：4
```

### 示例 2

```
输入：left = 0, right = 0
输出：0
```

### 示例 3

```
输入：left = 1, right = 2147483647
输出：0
```

### 约束条件

- `0 <= left <= right <= 2^31 - 1`

## 题目分析

### 算法思路

本题的核心洞察：区间 `[left, right]` 内所有数字的按位与结果，等于 `left` 和 `right` 的**二进制表示的公共前缀**。

**为什么？** 在区间 `[left, right]` 中，随着数字递增，低位会不断变化（0 和 1 交替）。只有高位（公共前缀）在所有数字中保持不变。对于变化的低位，至少存在一个数字在该位为 0，所以按位与结果为 0。

**方法一：位移法（寻找公共前缀）**

不断将 `left` 和 `right` 同时右移，直到两者相等。此时相等的部分就是公共前缀。然后将结果左移相同的位数还原。

```
例如：left = 5 (101), right = 7 (111)
步骤 1：101 >> 1 = 10, 111 >> 1 = 11, shift = 1
步骤 2：10 >> 1 = 1, 11 >> 1 = 1, shift = 2
left == right == 1，停止
结果：1 << 2 = 4 (100)
```

**方法二：Brian Kernighan 消除法**

不断消除 `right` 最低位的 1：`right &= right - 1`，直到 `right <= left`。剩余的 `right` 就是答案。

### 复杂度分析

- **时间复杂度**：O(log n)，最多处理 32 位。
- **空间复杂度**：O(1)。

### 关键点

- 核心洞察：结果是 left 和 right 的二进制公共前缀。
- Brian Kernighan 方法更加简洁。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/130-bitwise-and-of-numbers-range-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="数字范围按位与 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// 方法一：位移法（寻找公共前缀）
func rangeBitwiseAnd(left int, right int) int {
    shift := 0
    for left < right {
        left >>= 1
        right >>= 1
        shift++
    }
    return left << shift
}

// 方法二：Brian Kernighan 消除法
func rangeBitwiseAnd2(left int, right int) int {
    for left < right {
        right &= right - 1 // 消除 right 最低位的 1
    }
    return right
}

func main() {
    testCases := []struct {
        left, right int
    }{
        {5, 7},
        {0, 0},
        {1, 2147483647},
        {4, 5},
        {12, 15},
    }

    for _, tc := range testCases {
        fmt.Printf("left = %d, right = %d, 按位与结果 = %d\n",
            tc.left, tc.right, rangeBitwiseAnd(tc.left, tc.right))
    }
}
```
