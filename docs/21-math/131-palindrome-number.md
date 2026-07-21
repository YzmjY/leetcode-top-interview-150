# 131. 回文数 (Palindrome Number)

## 题目描述

给你一个整数 `x`，如果 `x` 是一个回文整数，返回 `true`；否则，返回 `false`。

回文数是指正序（从左向右）和倒序（从右向左）读都是一样的整数。

**示例 1：**

```
输入：x = 121
输出：true
```

**示例 2：**

```
输入：x = -121
输出：false
解释：从左向右读, 为 -121 。 从右向左读, 为 121- 。因此它不是一个回文数。
```

**示例 3：**

```
输入：x = 10
输出：false
解释：从右向左读, 为 01 。因此它不是一个回文数。
```

**约束条件：**

- `-2^31 <= x <= 2^31 - 1`

**进阶：** 你能不将整数转为字符串来解决这个问题吗？

## 题目分析

### 算法思路

**方法一：反转一半数字**

回文数的核心特征是前后对称。我们不需要反转整个数字，只需要反转数字的后半部分，然后与前半部分比较即可。

关键步骤：
1. 负数一定不是回文数（因为有负号）。
2. 末尾为 0 的非零数一定不是回文数（因为最高位不能是 0）。
3. 不断将 `x` 的最低位弹出，追加到 `reversed` 的末尾。
4. 当 `x <= reversed` 时，说明已经处理了一半以上的数字。
5. 比较 `x` 与 `reversed`（偶数位），或 `x` 与 `reversed / 10`（奇数位）。

### 复杂度分析

- **时间复杂度**：O(log n)，其中 n 是输入整数。每次迭代将输入除以 10。
- **空间复杂度**：O(1)，只使用了常数额外空间。

### 关键点

- 只需要反转一半，避免溢出问题。
- 注意奇数位和偶数位的不同比较方式。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/131-palindrome-number-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="回文数 (Palindrome Number) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func isPalindrome(x int) bool {
    // 负数和以0结尾的非0数不是回文数
    if x < 0 || (x%10 == 0 && x != 0) {
        return false
    }

    reversed := 0
    for x > reversed {
        reversed = reversed*10 + x%10
        x /= 10
    }

    // 偶数位: x == reversed
    // 奇数位: x == reversed/10 (去掉中间的数字)
    return x == reversed || x == reversed/10
}
```
