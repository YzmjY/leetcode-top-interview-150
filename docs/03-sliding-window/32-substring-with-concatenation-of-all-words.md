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

**算法思路：** 定长滑动窗口 + 哈希表。由于所有单词长度相同（设为 `wordLen`），串联子串的总长度是固定的 `wordLen * len(words)`。

核心思路：对于每种可能的起始偏移 `offset`（0 到 `wordLen-1`），以 `wordLen` 为步长进行滑动窗口扫描。在窗口中维护单词的频率计数，当窗口内单词频率与目标频率完全匹配时，记录起始位置。

**时间复杂度：** O(wordLen * n)，其中 n 是 s 的长度。

**空间复杂度：** O(m * wordLen)，其中 m 是 words 的长度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/32-substring-with-concatenation-of-all-words-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
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

                // 窗口大小超过 targetLen，收缩左边界
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
