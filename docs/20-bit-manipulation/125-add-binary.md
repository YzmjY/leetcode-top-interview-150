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

从右向左逐位模拟二进制加法，维护进位 `carry`。

- 处理每一位时，将 `a[i]`、`b[j]` 和 `carry` 相加。
- 当前位结果 = `sum % 2`，进位 = `sum / 2`。
- 处理完所有位后，如果仍有进位，在最高位补 `1`。
- 最后将结果翻转（因为是逆序构建的）。

### 复杂度分析

- **时间复杂度**：O(max(m, n))，其中 m 和 n 为两个字符串的长度。
- **空间复杂度**：O(max(m, n))，存储结果字符串。

### 关键点

- 模拟手工二进制加法，从低位向高位计算。
- 进位 `carry` 的初始值和最终处理。


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
