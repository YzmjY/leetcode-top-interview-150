# 24. 文本左右对齐

## 题目描述

给定一个单词数组 `words` 和一个长度 `maxWidth`，重新排版单词，使其成为每行恰好有 `maxWidth` 个字符，且左右两端对齐的文本。

你应该使用"贪心算法"来放置给定的单词；也就是说，尽可能多地往每行中放置单词。必要时可用空格 `' '` 填充，使得每行恰好有 `maxWidth` 个字符。

要求尽可能均匀分配单词间的空格数量。如果某一行单词间的空格不能均匀分配，则左侧放置的空格数要多于右侧的空格数。

文本的最后一行应为左对齐，且单词之间不插入额外的空格。

**说明：**

- 单词是指由非空格字符组成的字符序列。
- 每个单词的长度大于 0，小于等于 `maxWidth`。
- 输入单词数组 `words` 至少包含一个单词。

**示例 1：**

```
输入: words = ["This", "is", "an", "example", "of", "text", "justification."], maxWidth = 16
输出:
[
   "This    is    an",
   "example  of text",
   "justification.  "
]
```

**示例 2：**

```
输入: words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16
输出:
[
  "What   must   be",
  "acknowledgment  ",
  "shall be        "
]
解释: 注意最后一行的格式应为 "shall be    " 而不是 "shall     be"，因为最后一行应为左对齐，而不是左右两端对齐。
  第二行同样为左对齐，只有一个单词。
```

**示例 3：**

```
输入: words = ["Science","is","what","we","understand","well","enough","to","explain","to","a","computer.","Art","is","everything","else","we","do"]，maxWidth = 20
输出:
[
  "Science  is  what we",
  "understand      well",
  "enough to explain to",
  "a  computer.  Art is",
  "everything  else  we",
  "do                  "
]
```

**约束条件：**

- `1 <= words.length <= 300`
- `1 <= words[i].length <= 20`
- `words[i]` 由小写英文字母和符号组成
- `1 <= maxWidth <= 100`
- `words[i].length <= maxWidth`

## 题目分析

**算法思路：** 贪心模拟。核心步骤：

1. **分组**：从 `words` 中尽可能多地选取单词，使得单词总长度加上单词间至少一个空格的长度不超过 `maxWidth`
2. **分配空格**：对于非最后一行，计算需要分配的总空格数，均匀分配到单词间隙中。若不能均匀分配，左侧间隙多分配一个空格
3. **特殊处理最后一行**：左对齐，所有单词间只放一个空格，末尾补空格到 `maxWidth`
4. **特殊处理单单词行**：左对齐，后面补空格

**时间复杂度：** O(n * maxWidth)，其中 n 为单词数量。

**空间复杂度：** O(maxWidth)，存储结果字符串。

## Go 代码实现

```go
import "strings"

// fullJustify 实现文本左右对齐
// 贪心分配单词到每行，均匀分配空格
func fullJustify(words []string, maxWidth int) []string {
    result := make([]string, 0)
    i := 0 // 当前处理的单词索引

    for i < len(words) {
        // 1. 确定当前行可以放哪些单词
        // lineStart 记录当前行起始单词索引
        lineStart := i
        // lineLength 记录当前行单词的总长度（不含空格）
        lineLength := len(words[i])
        i++

        // 尽可能多地把单词放入当前行（单词长度 + 至少一个空格）
        for i < len(words) && lineLength+1+len(words[i]) <= maxWidth {
            lineLength += 1 + len(words[i])
            i++
        }

        // 当前行包含的单词数量
        wordCount := i - lineStart
        // 当前行的单词列表
        lineWords := words[lineStart:i]

        // 2. 构建当前行
        var line string

        // 特殊情况：最后一行或只有一个单词（左对齐）
        if i == len(words) || wordCount == 1 {
            // 左对齐：单词间一个空格，末尾补空格
            line = strings.Join(lineWords, " ")
            // 补足剩余空格到 maxWidth
            remainingSpaces := maxWidth - len(line)
            line += strings.Repeat(" ", remainingSpaces)
        } else {
            // 普通行：左右对齐，均匀分配空格
            // totalSpaces 需要分配的总空格数
            totalSpaces := maxWidth - lineLength + (wordCount - 1)
            // gaps 间隙数（单词数 - 1）
            gaps := wordCount - 1
            // spacePerGap 每个间隙的基本空格数
            spacePerGap := totalSpaces / gaps
            // extraSpaces 左侧需要额外多分配的空格数
            extraSpaces := totalSpaces % gaps

            for j := 0; j < wordCount; j++ {
                line += lineWords[j]
                // 最后一个单词后不加空格
                if j == wordCount-1 {
                    break
                }
                // 添加基本空格
                line += strings.Repeat(" ", spacePerGap)
                // 左侧额外空格（多分配一个）
                if j < extraSpaces {
                    line += " "
                }
            }
        }

        result = append(result, line)
    }

    return result
}
```
