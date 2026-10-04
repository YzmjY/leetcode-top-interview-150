# 125. 二进制求和

## 题目描述

给你两个二进制字符串 `a` 和 `b`，以二进制字符串的形式返回它们的和。

### 示例 1

```
输入: a = "11", b = "1"
输出: "100"
```

### 示例 2

```
输入: a = "1010", b = "1011"
输出: "10101"
```

### 约束条件

- `1 <= a.length, b.length <= 10^4`
- `a` 和 `b` 仅由字符 `'0'` 或 `'1'` 组成
- 字符串如果不是 `"0"`，就不含前导零

## 题目分析

### 算法思路

**朴素想法**：先把二进制串转成整数再相加。但 `a`、`b` 的长度可达 `10^4`，远超任何内置整数类型的范围，所以只能在字符串上模拟竖式加法。

**关键观察**：二进制加法和十进制竖式完全同构——从最低位（字符串末尾）向最高位逐位相加，本位结果由 `(a_i + b_i + carry) % 2` 决定，向高位的进位由 `(a_i + b_i + carry) / 2` 决定。因为每位参与相加的只有 3 个 0/1，进位只可能是 0 或 1，不需要任何大数库。

**算法步骤**：

1. 双指针 `i, j` 分别从 `a`、`b` 的末尾出发，进位 `carry = 0`，用一个 `[]byte` 从低位到高位收集结果。
2. 只要 `i >= 0 || j >= 0 || carry > 0` 就重复：
   - `sum = carry`；
   - 若 `i >= 0`，`sum += int(a[i] - '0')`，然后 `i--`；
   - 若 `j >= 0`，`sum += int(b[j] - '0')`，然后 `j--`；
   - 追加本位 `byte('0' + sum%2)`，更新 `carry = sum / 2`。
3. 由于结果是从低位往高位追加的，最后把 `result` 原地翻转，再转成字符串返回。

**为什么正确（循环不变量）**：每轮循环开始时，`carry` 恰好是「低位相加后向当前位产生的进位」（初值 0，符合最低位没有进位的语义），并且 `result` 中已按低位到高位保存了此前所有位的正确结果。循环体先求出 `sum = carry + a_i + b_i`（越界的位视为 0），`sum % 2` 就是这一位的最终值——更高位产生的进位只影响更高位，不会改变本位；`sum / 2` 则是本位向高位的进位。把 `sum % 2` 追加到 `result` 后不变量继续成立。

循环条件里的 `i >= 0 || j >= 0` 保证两个数的每一位都被处理，`carry > 0` 保证最高位残留的进位也被写出（例如 `111 + 1 = 1000`）。因此循环结束时 `result` 的逆序串就是正确的和。

### 复杂度分析

- **时间复杂度**：O(max(m, n))，其中 `m, n` 为两个字符串的长度。每一位恰好处理一次，最后一次翻转也是线性的。
- **空间复杂度**：O(max(m, n))，用于存储结果，长度最多为 `max(m, n) + 1`。

### 关键点

- 模拟手工二进制加法，从低位向高位计算。
- 循环条件必须显式带上 `carry > 0`，否则最高位的进位会丢失。
- 两个串长度不同时，取字符前要先判断指针是否越界（`i >= 0` / `j >= 0`）。
- 结果按低位→高位收集，别忘记翻转。
- 用 `append` 到 `[]byte` 再一次性转字符串，比反复拼接字符串高效得多。
- `a[i]` 是 `byte`，做加法前要转成 `int`，否则类型不匹配。
- `[]byte` 中存的是字符 `'0'`/`'1'`（即 48/49），不是数值 0/1，追加时别写成 `byte(sum % 2)`。
- 题目保证除 `"0"` 外没有前导零，因此不必处理去前导零；`"0" + "0"` 时循环仍会执行一次（`i, j >= 0`），返回 `"0"`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/125-add-binary-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="二进制求和 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func addBinary(a string, b string) string {
    i, j := len(a)-1, len(b)-1
    carry := 0
    result := make([]byte, 0, max(len(a), len(b))+1)

    for i >= 0 || j >= 0 || carry > 0 {
        sum := carry
        if i >= 0 {
            sum += int(a[i] - '0')
            i--
        }
        if j >= 0 {
            sum += int(b[j] - '0')
            j--
        }
        result = append(result, byte('0'+sum%2))
        carry = sum / 2
    }

    // 翻转结果
    for left, right := 0, len(result)-1; left < right; left, right = left+1, right-1 {
        result[left], result[right] = result[right], result[left]
    }

    return string(result)
}

func main() {
    testCases := [][2]string{
        {"11", "1"},
        {"1010", "1011"},
        {"0", "0"},
        {"111", "111"},
    }

    for _, tc := range testCases {
        fmt.Printf("%s + %s = %s\n", tc[0], tc[1], addBinary(tc[0], tc[1]))
    }
}
```
