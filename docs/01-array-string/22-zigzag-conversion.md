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

**算法步骤：**

1. 若 `numRows == 1` 或 `numRows >= len(s)`，直接返回 `s`。
2. 建立长度为 `numRows` 的字符串数组 `rows`，令 `curRow = 0`、`goingDown = false`。
3. 依次枚举 `s` 的每个字符：把字符追加到 `rows[curRow]`；若 `curRow == 0` 或 `curRow == numRows-1`，翻转 `goingDown`；再按 `goingDown` 把 `curRow` 加一或减一。
4. 顺序拼接 `rows[0..numRows-1]` 返回。

**为什么正确（循环不变量）：**

维护不变量："每轮迭代开始时，`curRow` 是当前字符应写入的行号，`goingDown` 表示行号下一步的变化方向"。初始时首字符写入第 0 行，符合 Z 字形的起点。Z 字形轨迹只在首行和末行改变方向（首行向下、末行向上），代码正是这两处翻转 `goingDown`，因此复现了"自上而下写满一列后斜向上回到首行"的走向。于是每个字符的落行都与真实 Z 字排列一致，按行读取拼出的结果自然就是题目要求的字符串。

关于提前返回：当 `numRows >= len(s)` 时，每个字符依次落在第 0、1、2… 行且永远不会折返，逐行拼接恰好还原 `s`（不提前返回结果也正确，只是会创建大量空行）。而 `numRows == 1` 时必须提前返回，详见易错点。

**时间复杂度：** O(n)，每个字符处理一次，拼接所有行也是 O(n)。（`rows[curRow] += ...` 的单次追加在 Go 中可能触发拷贝，最坏 O(n²)；本题 n ≤ 1000 无影响，若要严格线性可改用 `[]byte` 或 `strings.Builder`。）

**空间复杂度：** O(n)，`rows` 中保存全部字符。

**易错点 / 边界情况：**

- `numRows == 1` 必须提前返回：否则首行即末行，每次写入后方向都被翻转，`curRow` 会在 0 与 -1 之间反复震荡并导致索引越界。
- 方向翻转的判断要在**写入字符之后**执行，顺序不能颠倒。
- 遍历用 `for _, ch := range s` 得到的是 rune；本题字符均为 ASCII，行为与按字节遍历一致。若输入可能含多字节字符，需注意 `len(s)` 与 rune 数量的区别。
- 边界用例：`numRows = 2`、`s` 长度为 1、`numRows` 远大于 `len(s)`、`numRows = 1000`。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/22-zigzag-conversion-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
