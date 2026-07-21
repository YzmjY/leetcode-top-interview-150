# 33. 最小覆盖子串

## 题目描述

给你一个字符串 `s`、一个字符串 `t`。返回 `s` 中涵盖 `t` 所有字符的最小子串。如果 `s` 中不存在涵盖 `t` 所有字符的子串，则返回空字符串 `""`。

**注意：**

- 对于 `t` 中重复字符，我们寻找的子字符串中该字符数量必须不少于 `t` 中该字符数量。
- 如果 `s` 中存在这样的子串，我们保证它是唯一的答案。

**示例 1：**

```
输入：s = "ADOBECODEBANC", t = "ABC"
输出："BANC"
解释：最小覆盖子串 "BANC" 包含来自字符串 t 的 'A'、'B' 和 'C'。
```

**示例 2：**

```
输入：s = "a", t = "a"
输出："a"
解释：整个字符串 s 是最小覆盖子串。
```

**示例 3：**

```
输入: s = "a", t = "aa"
输出: ""
解释: t 中两个字符 'a' 均应包含在 s 的子串中，因此没有符合条件的子字符串，返回空字符串。
```

**约束条件：**

- `m == s.length`
- `n == t.length`
- `1 <= m, n <= 10^5`
- `s` 和 `t` 由英文字母组成

**进阶：** 你能设计一个在 `O(m+n)` 时间内解决此问题的算法吗？

## 题目分析

**算法思路：** 变长滑动窗口 + 字符频率统计。使用两个哈希表（或数组）：`need` 记录 `t` 中每种字符需要的数量，`have` 记录当前窗口中每种字符的数量。

维护 `matched` 变量表示已满足条件的字符种类数。当 `matched == len(need)` 时，窗口包含了所有需要的字符，此时尝试收缩左边界以得到更短的子串。

**时间复杂度：** O(m + n)，每个字符最多被加入和移除各一次。

**空间复杂度：** O(字符集大小)，对于 ASCII 为 O(128)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/33-minimum-window-substring-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="最小覆盖子串 - 交互演示">
</iframe>

## Go 代码实现

```go
// minWindow 找到 s 中包含 t 所有字符的最小子串
// 变长滑动窗口 + 字符频率统计
func minWindow(s string, t string) string {
    if len(s) < len(t) {
        return ""
    }

    // need 记录 t 中每种字符需要的数量
    need := make(map[byte]int)
    for i := 0; i < len(t); i++ {
        need[t[i]]++
    }
    needCount := len(need) // 不同字符的种类数

    // have 记录当前窗口中每种字符的数量
    have := make(map[byte]int)
    matched := 0 // 已满足条件的字符种类数

    // left 窗口左边界，minStart 最短子串起始位置，minLen 最短子串长度
    left := 0
    minStart := 0
    minLen := len(s) + 1

    // right 扩展窗口右边界
    for right := 0; right < len(s); right++ {
        ch := s[right]

        // 如果当前字符是需要的
        if need[ch] > 0 {
            have[ch]++
            // 该字符数量刚好满足要求
            if have[ch] == need[ch] {
                matched++
            }
        }

        // 当窗口包含了所有需要的字符，尝试收缩左边界
        for matched == needCount {
            // 更新最短子串
            curLen := right - left + 1
            if curLen < minLen {
                minLen = curLen
                minStart = left
            }

            // 移除左边界字符
            leftCh := s[left]
            if need[leftCh] > 0 {
                // 如果移除后不再满足条件
                if have[leftCh] == need[leftCh] {
                    matched--
                }
                have[leftCh]--
            }
            left++
        }
    }

    if minLen == len(s)+1 {
        return ""
    }
    return s[minStart : minStart+minLen]
}
```
