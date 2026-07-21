# 21. 反转字符串中的单词

## 题目描述

给你一个字符串 `s`，请你反转字符串中 **单词** 的顺序。

**单词** 是由非空格字符组成的字符串。`s` 中使用至少一个空格将字符串中的 **单词** 分隔开。

返回 **单词** 顺序颠倒且 **单词** 之间用单个空格连接的结果字符串。

**注意：** 输入字符串 `s` 中可能会存在前导空格、尾随空格或者单词间的多个空格。返回的结果字符串中，单词间应当仅用单个空格分隔，且不包含任何额外的空格。

**示例 1：**

```
输入：s = "the sky is blue"
输出："blue is sky the"
```

**示例 2：**

```
输入：s = "  hello world  "
输出："world hello"
解释：反转后的字符串中不能存在前导空格和尾随空格。
```

**示例 3：**

```
输入：s = "a good   example"
输出："example good a"
解释：如果两个单词间有多余的空格，反转后的字符串需要将单词间的空格减少到仅有一个。
```

**约束条件：**

- `1 <= s.length <= 10^4`
- `s` 包含英文大小写字母、数字和空格 `' '`
- `s` 中 **至少存在一个单词**

**进阶：** 如果字符串在你使用的编程语言中是一种可变数据类型，请尝试使用 `O(1)` 额外空间复杂度的 **原地** 解法。

## 题目分析

**算法思路：** Go 中字符串不可变，使用 `strings.Fields` 分割单词（自动处理多余空格），然后反转单词顺序，最后用 `strings.Join` 连接。

**时间复杂度：** O(n)，遍历字符串进行分割和重组。

**空间复杂度：** O(n)，存储分割后的单词数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/21-reverse-words-in-a-string-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="反转字符串中的单词 - 交互演示">
</iframe>

## Go 代码实现

```go
import "strings"

// reverseWords 反转字符串中单词的顺序
// 使用 strings.Fields 自动处理多余空格
func reverseWords(s string) string {
    // Fields 按空格分割，自动去除前导、尾随和多余空格
    words := strings.Fields(s)

    // 反转单词数组
    n := len(words)
    for i := 0; i < n/2; i++ {
        words[i], words[n-1-i] = words[n-1-i], words[i]
    }

    // 用单个空格连接
    return strings.Join(words, " ")
}
```
