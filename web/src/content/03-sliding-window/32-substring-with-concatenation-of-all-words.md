# 32. 串联所有单词的子串

## 题目描述

给定一个字符串 `s` 和一个字符串数组 `words`。`words` 中所有字符串 **长度相同**。

`words` 中的 **串联子串** 是指一个包含 `words` 中所有字符串以任意顺序排列连接起来的子串。

- 例如，如果 `words = ["ab","cd","ef"]`，那么 `"abcdef"`、`"abefcd"`、`"cdabef"`、`"cdefab"`、`"efabcd"` 和 `"efcdab"` 都是串联子串。`"acdbef"` 不是串联子串，因为他不是任何 `words` 排列的连接。

返回所有串联子串在 `s` 中的开始索引。你可以以 **任意顺序** 返回答案。

**示例 1：**

```
输入：s = "barfoothefoobarman", words = ["foo","bar"]
输出：[0,9]
解释：因为 words.length == 2 同时 words[i].length == 3，连接的子字符串的长度必须为 6。
子串 "barfoo" 开始位置是 0。它是 words 中以 ["bar","foo"] 顺序排列的连接。
子串 "foobar" 开始位置是 9。它是 words 中以 ["foo","bar"] 顺序排列的连接。
输出顺序无关紧要。返回 [9,0] 也是可以的。
```

**示例 2：**

```
输入：s = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]
输出：[]
解释：因为 words.length == 4 并且 words[i].length == 4，所以串联子串的长度必须为 16。
s 中没有子串长度为 16 并且等于 words 的任何顺序排列的连接。
所以我们返回一个空数组。
```

**示例 3：**

```
输入：s = "barfoofoobarthefoobarman", words = ["bar","foo","the"]
输出：[6,9,12]
解释：因为 words.length == 3 并且 words[i].length == 3，所以串联子串的长度必须为 9。
子串 "foobarthe" 开始位置是 6。它是 words 中以 ["foo","bar","the"] 顺序排列的连接。
子串 "barthefoo" 开始位置是 9。它是 words 中以 ["bar","the","foo"] 顺序排列的连接。
子串 "thefoobar" 开始位置是 12。它是 words 中以 ["the","foo","bar"] 顺序排列的连接。
```

**约束条件：**

- `1 <= s.length <= 10^4`
- `1 <= words.length <= 5000`
- `1 <= words[i].length <= 30`
- `words[i]` 和 `s` 由小写英文字母组成

## 题目分析

**算法思路：** 所有单词长度相同（记 `wordLen`），所以任意串联子串的长度固定为 `totalLen = wordLen * len(words)`，并且都能按 `wordLen` 切成若干个整词来检查。暴力做法是枚举每个起点（O(n)）再切分检查（O(totalLen)）。

优化点在于：**起点不必逐个枚举，只需枚举 `wordLen` 种对齐方式**。把 `s` 按起点下标模 `wordLen` 分成若干条「轨道」，任何固定长度的子串一定完整落在其中一条轨道上、由连续的若干整词组成。对每条轨道（偏移 `offset = 0..wordLen-1`）做一次定长滑动窗口：窗口里始终保持恰好 `wordCount` 个整词，用哈希表统计窗口内词频并与目标词频比较。

**算法步骤：**

1. 预处理：统计 `words` 中每个单词的目标频次 `targetCount`；若 `len(s) < totalLen` 直接返回空。
2. 对每个偏移 `offset ∈ [0, wordLen-1]`：
   - `left = offset`，`windowCount = {}`，`matched` 表示「频次已与目标完全一致的单词种类数」；
   - `right` 从 `offset` 开始每次前进 `wordLen`，取当前词 `word = s[right : right+wordLen]`：
     - 若 `word` 在目标中：`windowCount[word]++`，若刚好达到目标频次则 `matched++`。接着，若窗口长度 `right+wordLen-left` 超过 `totalLen`，说明窗口多了一个词，把最左的词 `s[left:left+wordLen]` 移出（若移出前它的频次正好等于目标则 `matched--`），然后 `left += wordLen`。最后若 `matched == len(targetCount)`，说明窗口内词频与目标完全一致，记录 `left`。
     - 若 `word` 不在目标中：任何包含该词的窗口都不可能合法，于是清空 `windowCount`、`matched = 0`，并把 `left` 跳到 `right + wordLen`。
3. 返回所有记录的位置。

**为什么正确：**

- **为什么只需 `wordLen` 种偏移**：任意起点 `i` 都能写成 `i = offset + k·wordLen`（`offset = i mod wordLen`），从 `i` 出发的串联子串必然对齐到偏移 `offset` 的轨道，所以枚举全部偏移不会漏解。
- **窗口状态正确**：`matched` 统计「当前词频恰好等于目标频次」的单词种类数；当 `matched == len(targetCount)` 时每个目标词都达标，窗口内单词总数就是 `sum(targetCount) = wordCount`，即窗口恰好由 `words` 的一个排列拼成。窗口内只可能含目标词，因为遇到非目标词会立即清空窗口。
- **窗口大小不变量**：每次扩展最多让窗口多一个词，所以一旦超过 `totalLen`，收缩一个词就必然回到 `totalLen` 以内，代码里的单次收缩足够。
- **重置的合理性**：窗口一旦包含非目标词，任何跨过它的窗口都不合法；清空计数并把 `left` 移到该词之后，等价于从下一个整词位置重新开始，不会漏掉更右侧的解。

**时间复杂度：** O(n·wordLen)。偏移共 `wordLen` 种，每种偏移的窗口扫描总步数约 `n / wordLen`，每步要做一次长度为 `wordLen` 的取子串与哈希（代价 O(wordLen)），合计 O(n·wordLen)；`wordLen <= 30`，与 O(n) 同量级。

**空间复杂度：** O(m·wordLen)。哈希表最多存 `m` 个不同单词，每个键长度 `wordLen`；窗口计数表最多也是 `m` 个键。

**易错点：**

- 忘记 `len(s) < totalLen` 的提前返回可能取子串越界（代码里循环条件 `right+wordLen <= len(s)` 也能防越界）。
- 词频表要统计 `words` 中的**重复单词**（如 `words = ["word","good","best","word"]` 中 `word` 需要 2 次），用 set 会错。
- `matched == len(targetCount)` 判断的是「种类数」而不是「单词总数」，写成 `matched == wordCount` 会错。
- 收缩窗口与清空窗口的时机：超出 `totalLen` 时要先移除左侧词（并在移除前判断是否要把 `matched` 减一），顺序写反会得到错误计数。
- 步长是 `wordLen` 而不是 1；结果顺序任意，校验答案时按集合比较。
- 同一个起点只会被它所属的那条轨道记录一次，不会重复。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/32-substring-with-concatenation-of-all-words-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="串联所有单词的子串 - 交互演示">
</iframe>

## Go 代码实现

```go
// findSubstring 找到所有串联子串的起始索引
// 定长滑动窗口 + 哈希表统计词频
func findSubstring(s string, words []string) []int {
    result := make([]int, 0)
    if len(s) == 0 || len(words) == 0 {
        return result
    }

    // wordLen 每个单词的长度，totalLen 串联子串的总长度
    wordLen := len(words[0])
    wordCount := len(words)
    totalLen := wordLen * wordCount

    if len(s) < totalLen {
        return result
    }

    // targetCount 记录目标词频
    targetCount := make(map[string]int)
    for _, word := range words {
        targetCount[word]++
    }

    // 以不同的偏移量作为扫描起点（0 到 wordLen-1）
    for offset := 0; offset < wordLen; offset++ {
        left := offset
        // windowCount 记录当前窗口内的词频
        windowCount := make(map[string]int)
        matched := 0 // 已匹配的单词种类数

        // 以 wordLen 为步长扩展右边界
        for right := offset; right+wordLen <= len(s); right += wordLen {
            // 取出当前单词
            word := s[right : right+wordLen]

            // 如果单词在目标中
            if targetCount[word] > 0 {
                windowCount[word]++
                // 该单词的频率与目标完全匹配
                if windowCount[word] == targetCount[word] {
                    matched++
                }

                // 窗口大小超过 totalLen，收缩左边界
                if right+wordLen-left > totalLen {
                    leftWord := s[left : left+wordLen]
                    if targetCount[leftWord] > 0 {
                        if windowCount[leftWord] == targetCount[leftWord] {
                            matched--
                        }
                        windowCount[leftWord]--
                    }
                    left += wordLen
                }

                // 所有单词完全匹配
                if matched == len(targetCount) {
                    result = append(result, left)
                }
            } else {
                // 遇到不在目标中的单词，重置窗口
                windowCount = make(map[string]int)
                matched = 0
                left = right + wordLen
            }
        }
    }

    return result
}
```
