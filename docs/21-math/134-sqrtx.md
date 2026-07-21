# 134. x 的平方根 (Sqrt(x))

## 题目描述

给你一个非负整数 `x`，计算并返回 `x` 的 **算术平方根**。

由于返回类型是整数，结果只保留 **整数部分**，小数部分将被舍去。

**注意：** 不允许使用任何内置指数函数和算符，例如 `pow(x, 0.5)` 或者 `x ** 0.5`。

**示例 1：**

```
输入：x = 4
输出：2
```

**示例 2：**

```
输入：x = 8
输出：2
解释：8 的算术平方根是 2.82842..., 由于返回类型是整数，小数部分将被舍去。
```

**约束条件：**

- `0 <= x <= 2^31 - 1`

## 题目分析

### 算法思路

**方法一：二分查找**

由于平方根函数是单调递增的，可以使用二分查找在 `[0, x]` 范围内搜索答案。

- 对于 x = 0 或 1，直接返回 x。
- 对于 x >= 2，在 `[2, x/2]` 范围内二分查找。
- 每次取 `mid`，比较 `mid * mid` 与 `x` 的关系调整搜索范围。
- 注意 `mid * mid` 可能溢出，使用 `mid` 和 `x / mid` 的比较来避免。

**方法二：牛顿迭代法（进阶）**

利用牛顿法求 `f(y) = y^2 - x = 0` 的根，迭代公式：`y_{n+1} = (y_n + x / y_n) / 2`。

### 复杂度分析

- **时间复杂度**：O(log x)，二分查找每次将搜索范围缩小一半。
- **空间复杂度**：O(1)。

### 关键点

- 使用除法代替乘法避免溢出：`mid > x / mid` 等价于 `mid * mid > x`。
- 注意边界条件：x = 0 和 x = 1。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/134-sqrtx-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="x 的平方根 (Sqrt(x)) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func mySqrt(x int) int {
    if x < 2 {
        return x
    }

    left, right := 2, x/2
    var mid int

    for left <= right {
        mid = left + (right-left)/2
        square := mid * mid

        if square == x {
            return mid
        } else if square < x {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }

    // 循环结束时 right < left，right 就是向下取整的平方根
    return right
}
```
