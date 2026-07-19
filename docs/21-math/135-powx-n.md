# 135. Pow(x, n) (Pow(x, n))

## 题目描述

实现 `pow(x, n)`，即计算 `x` 的整数 `n` 次幂函数（即，`x^n`）。

**示例 1：**

```
输入：x = 2.00000, n = 10
输出：1024.00000
```

**示例 2：**

```
输入：x = 2.10000, n = 3
输出：9.26100
```

**示例 3：**

```
输入：x = 2.00000, n = -2
输出：0.25000
解释：2^(-2) = 1/(2^2) = 1/4 = 0.25
```

**约束条件：**

- `-100.0 < x < 100.0`
- `-2^31 <= n <= 2^31 - 1`
- `n` 是一个整数
- 要么 `x` 不为零，要么 `n > 0`
- `-10^4 <= x^n <= 10^4`

## 题目分析

### 算法思路

**方法：快速幂（二分幂）**

利用指数的二分性质：`x^n` 可以递归地表示为：

- 如果 n 是偶数：`x^n = (x^2)^(n/2)`
- 如果 n 是奇数：`x^n = x * (x^2)^(n/2)`

这样每次将指数减半，时间复杂度从 O(n) 降至 O(log n)。

**处理负指数：** 当 n < 0 时，计算 `x^n = 1 / (x^(-n))`。

**迭代写法：** 利用二进制表示，n 的二进制中每一位 1 对应的权重累乘即可。

### 复杂度分析

- **时间复杂度**：O(log n)，每次将指数减半。
- **空间复杂度**：O(log n)（递归写法）或 O(1)（迭代写法）。

### 关键点

- n 可能为负数，先处理符号。
- n 可能为 INT_MIN，取反会溢出，需要用 `int64` 或特殊处理。
- 递归和迭代两种写法都要掌握。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/135-powx-n-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="Pow(x, n) (Pow(x, n)) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func myPow(x float64, n int) float64 {
    // 处理负指数
    if n < 0 {
        x = 1 / x
        n = -n
    }
    return fastPow(x, n)
}

// 递归快速幂
func fastPow(x float64, n int) float64 {
    if n == 0 {
        return 1.0
    }

    half := fastPow(x, n/2)

    if n%2 == 0 {
        return half * half
    }
    return half * half * x
}

// 迭代快速幂（备选方案）
func myPowIterative(x float64, n int) float64 {
    if n < 0 {
        x = 1 / x
        n = -n
    }

    result := 1.0
    for n > 0 {
        if n&1 == 1 { // n 的当前二进制位为 1
            result *= x
        }
        x *= x  // x = x^2
        n >>= 1 // n = n/2
    }
    return result
}
```
