# 31. 无重复字符的最长子串

## 题目描述

给定一个字符串 `s`，请你找出其中不含有重复字符的 **最长子串** 的长度。

**示例 1：**

```
输入: s = "abcabcbb"
输出: 3
解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。
```

**示例 2：**

```
输入: s = "bbbbb"
输出: 1
解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。
```

**示例 3：**

```
输入: s = "pwwkew"
输出: 3
解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
请注意，你的答案必须是子串的长度，"pwke" 是一个子序列，不是子串。
```

**约束条件：**

- `0 <= s.length <= 5 * 10^4`
- `s` 由英文字母、数字、符号和空格组成

## 题目分析

**算法思路：** 使用变长滑动窗口 + 哈希表。`window` 记录当前窗口中每个字符最后出现的位置。`left` 指针维护窗口左边界：

1. 扩展右边界 `right`
2. 如果 `s[right]` 已在窗口中，将 `left` 移动到重复字符上一次出现位置的下一个位置（但不能回退，所以用 `max`）
3. 更新 `s[right]` 在窗口中的最新位置
4. 更新最长长度

**时间复杂度：** O(n)，每个字符最多被访问两次。

**空间复杂度：** O(min(n, 字符集大小))。ASCII 字符集大小固定为 128，也可用数组优化。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/31-longest-substring-without-repeating-characters-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="无重复字符的最长子串 - 交互演示">
</iframe>

## Go 代码实现

```go
// lengthOfLongestSubstring 找出不含重复字符的最长子串的长度
// 使用变长滑动窗口 + 哈希表记录字符最后出现位置
func lengthOfLongestSubstring(s string) int {
    // charIndex 记录每个字符在字符串中最后出现的位置
    charIndex := make(map[byte]int)
    // maxLen 记录最长子串长度，left 为窗口左边界
    maxLen := 0
    left := 0

    for right := 0; right < len(s); right++ {
        ch := s[right]
        // 如果当前字符已经在窗口中出现过
        if lastPos, exists := charIndex[ch]; exists && lastPos >= left {
            // 将左边界移动到重复字符的下一个位置
            left = lastPos + 1
        }
        // 更新当前字符的最新位置
        charIndex[ch] = right
        // 计算当前窗口长度并更新最大值
        curLen := right - left + 1
        if curLen > maxLen {
            maxLen = curLen
        }
    }

    return maxLen
}
```
