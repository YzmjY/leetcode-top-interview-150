# 22. Z 字形变换

## 题目描述

将一个给定字符串 `s` 根据给定的行数 `numRows`，以从上往下、从左到右进行 Z 字形排列。

比如输入字符串为 `"PAYPALISHIRING"`，行数为 `3` 时，排列如下：

```
P   A   H   N
A P L S I I G
Y   I   R
```

之后，你的输出需要从左往右逐行读取，产生出一个新的字符串，比如：`"PAHNAPLSIIGYIR"`。

请你实现这个将字符串进行指定行数变换的函数：

```
string convert(string s, int numRows);
```

**示例 1：**

```
输入：s = "PAYPALISHIRING", numRows = 3
输出："PAHNAPLSIIGYIR"
```

**示例 2：**

```
输入：s = "PAYPALISHIRING", numRows = 4
输出："PINALSIGYAHRPI"
解释：
P     I    N
A   L S  I G
Y A   H R
P     I
```

**示例 3：**

```
输入：s = "A", numRows = 1
输出："A"
```

**约束条件：**

- `1 <= s.length <= 1000`
- `s` 由英文字母（小写和大写）、`','` 和 `'.'` 组成
- `1 <= numRows <= 1000`

## 题目分析

**算法思路：** 模拟法。使用一个字符串数组 `rows` 来模拟每行的字符。遍历字符串，用一个 `curRow` 记录当前行，`goingDown` 记录方向。当 `curRow == 0` 时方向变为向下，当 `curRow == numRows-1` 时方向变为向上。最后将所有行的字符串拼接起来。

**时间复杂度：** O(n)，遍历一次字符串。

**空间复杂度：** O(n)，存储所有字符。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/22-zigzag-conversion-demo.html"
  style="width:100%; height:450px; border:none; border-radius:8px; background:transparent;"
  title="Z 字形变换 - 交互演示">
</iframe>

## Go 代码实现

```go
// convert 将字符串按照 Z 字形排列后按行读取
// 模拟填入过程，使用 rows 数组存储每行的字符
func convert(s string, numRows int) string {
    // 如果只有一行或行数大于等于字符串长度，直接返回
    if numRows == 1 || numRows >= len(s) {
        return s
    }

    // rows 存储每行的字符
    rows := make([]string, numRows)
    // curRow 当前行索引，goingDown 方向（true 向下，false 向上）
    curRow := 0
    goingDown := false

    for _, ch := range s {
        // 将当前字符添加到对应行
        rows[curRow] += string(ch)
        // 在首行或末行时改变方向
        if curRow == 0 || curRow == numRows-1 {
            goingDown = !goingDown
        }
        // 根据方向移动到下一行
        if goingDown {
            curRow++
        } else {
            curRow--
        }
    }

    // 拼接所有行
    result := ""
    for _, row := range rows {
        result += row
    }
    return result
}
```
