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

**朴素想法**：从左到右把区间里的每个数都按位与一遍。区间跨度最大可达 `2^31`，逐个遍历不可行。

**核心洞察**：区间 `[left, right]` 内所有数字按位与的结果，等于 `left` 和 `right` 的**二进制公共前缀**，公共前缀之后的所有低位都是 0。

**为什么**：设 `left` 与 `right` 的最高分歧位为第 `k` 位（比 `k` 高的位两者完全相同）。由于 `left <= right`，`left` 的第 `k` 位必为 0、`right` 的第 `k` 位必为 1。整数在区间内连续递增，从 `left` 增长到 `right` 必然要跨过第 `k` 位由 0 变 1 的那一刻，因此区间中一定同时存在形如 `...0 111...1` 与 `...1 000...0` 的两个数。把它们按位与，第 `k` 位得 0，所有更低位也得 0。既然这两个数相与已经是这样，整个区间相与的结果中第 `k` 位及更低的所有位必然都是 0，只有更高的公共前缀被保留。

**方法一：位移法（直接寻找公共前缀）**

不断把 `left` 和 `right` 同时右移，直到两者相等，此时得到的就是公共前缀；用 `shift` 记录右移的总次数，最后把公共前缀左移 `shift` 位还原（低位补回 0）。

```
left = 5 (101), right = 7 (111)
101 >> 1 = 10, 111 >> 1 = 11   shift = 1
10  >> 1 = 1,  11  >> 1 = 1    shift = 2
left == right == 1，停止；结果 1 << 2 = 4 (100)
```

**正确性**：`left` 与 `right` 的高位公共前缀在右移过程中始终相同，且只要两者还不相等，就说明还存在分歧位。循环结束时两者相等，得到的就是公共前缀；左移还原后低位补 0，正好是「公共前缀后接全 0」。

**方法二：Brian Kernighan 消除法**

不断执行 `right &= right - 1`（消去 `right` 最低位的 1），直到 `right <= left`，此时 `right` 就是答案。

**正确性**：仍设最高分歧位为第 `k` 位。只要 `right` 在第 `k` 位以下还有 1，那么被消去的总是这些更低的位，`right` 的第 `k` 位始终是 1；而 `left` 的第 `k` 位是 0、更高位两者相同，于是 `right > left`，循环继续。当第 `k` 位以下全部清零后，第 `k` 位成了 `right` 最低位的 1 并被消去，`right` 恰好退化成公共前缀 `P`，此时 `right = P <= left`，循环终止。每步操作都严格减小 `right`，所以循环必然结束。

### 复杂度分析

- **时间复杂度**：O(log n)，最多处理 32 位——方法一最多右移 32 次，方法二最多消去 32 个 1。
- **空间复杂度**：O(1)，只使用常数个变量。

### 关键点

- 核心结论「结果是 `left` 与 `right` 的二进制公共前缀」值得记住，可现场据此推导实现。
- 方法二无需记录移位数，代码更短；方法一更直观易懂。
- `left == right` 时两个方法的循环都不执行，直接返回该数本身（一个数的按位与就是它自己）。
- 循环条件用严格的 `<`（`left < right`），不能用 `<=`：相等时再消一位或再移位一次就会出错。
- 结果一定是 `[left, right]` 中某个数，且按位是 `left` 的子集，所以不会超过 `left`。
- 输入是非负 32 位整数，用 `int` 即可，不涉及符号位问题。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/130-bitwise-and-of-numbers-range-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
