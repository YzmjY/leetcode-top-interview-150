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

**算法步骤：**

1. 用双指针把单词切成连续的分行。`lineStart` 指向行首单词；`lineLength` 记录"按单词间一个空格计算"的行内容长度，初值为 `len(words[lineStart])`；只要 `lineLength + 1 + len(words[i]) <= maxWidth`，就把第 i 个单词纳入当前行并执行 `lineLength += 1 + len(words[i])`。
2. 记 `wordCount = i - lineStart`、`lineWords = words[lineStart:i]`。
3. 若 `i == len(words)`（最后一行）或 `wordCount == 1`：左对齐，`strings.Join(lineWords, " ")` 后补 `maxWidth - len(line)` 个空格。
4. 否则左右对齐：`totalSpaces = maxWidth - Σ len(word)`。由于 `lineLength = Σ len(word) + (wordCount-1)`，可得 `totalSpaces = maxWidth - lineLength + (wordCount-1)`。令 `gaps = wordCount-1`、`spacePerGap = totalSpaces / gaps`、`extra = totalSpaces % gaps`：第 j 个间隙放 `spacePerGap` 个空格，并在 `j < extra` 时再多放一个。
5. 把该行加入 `result`，令 `lineStart = i`，继续处理下一行。

**为什么正确：**

- **分组贪心性质**：单词必须按原顺序连续分行。对固定行起点，若 `lineLength + 1 + len(words[i]) > maxWidth`，说明第 i 个单词无论如何放不进当前行，当前行的单词集合已是唯一可能的最大集合；任何更小的分组只会增加行数，且不会给后续行留出更多空间（剩余单词序列不变）。因此"每行尽可能多放"得到的就是行数最少的合法划分。
- **空格分配**：需要填充的空格总数由 `maxWidth - Σ len(word)` 唯一确定。算法用带余除法把它写成 `gaps * spacePerGap + extra`：先给每个间隙 `spacePerGap` 个，再把余下的 `extra` 个从**左往右**各加一个。于是任意两个间隙的空格数之差至多为 1，满足"尽可能均匀"；且靠左的间隙不少于靠右的间隙，满足"左侧空格数不少于右侧"。
- **最后一行与单单词行**：题目规定最后一行左对齐、单词间不插入额外空格；单单词行没有间隙可分配（`gaps = 0` 还可能导致除零）。两者都用"单词间一个空格 + 末尾补空格"处理，恰好满足要求。

**时间复杂度：** O(n · maxWidth)。每个单词只被并入一行一次；构造每行的代价与其输出长度（恰好 `maxWidth`）成正比，行数不超过 n，故总时间以 O(n · maxWidth) 为上界，这也是输出规模的上界。

**空间复杂度：** O(L · maxWidth)，其中 L 为行数。`result` 需要保存所有行的完整内容，每行恰好 `maxWidth` 个字符；`lineWords` 只是原切片的视图，不额外复制单词。

**易错点 / 边界情况：**

- **除零**：单词数为 1 时 `gaps = 0`，绝不能进入左右对齐分支，必须先判 `wordCount == 1`（代码中与"最后一行"合并判断）。
- 最后一行即使包含多个单词也必须左对齐（示例 2 的 `"shall be    "` 而不是 `"shall     be"`），不能套用前面的间隙分配。
- 末尾补空格数 `maxWidth - len(line)` 恒非负：分组条件保证任何一行按单空格拼接后长度不超过 `maxWidth`。
- 余数 `extra` 个额外空格要加在**最左侧**的间隙上，方向加错会违反"左侧不少于右侧"。
- 单词长度可能恰好等于 `maxWidth`，此时该行只能放一个单词，走单单词分支。
- 边界用例：`maxWidth == 1`、单词数组只有一个元素、所有单词刚好拼满一行、`maxWidth` 较大而单词都很短。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/24-text-justification-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="文本左右对齐 - 交互演示">
</iframe>

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
        // lineLength 记录当前行按单词间一个空格计算的长度
        // （等于当前行单词总长度 + 已放入的间隔数）
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
