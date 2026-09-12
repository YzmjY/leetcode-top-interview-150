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

**算法思路：** 需要「不含重复字符的连续子串」，用变长滑动窗口维护一个始终无重复的区间 `[left, right]`。暴力枚举每个起点再往后扫描是 O(n²)；关键观察是当右指针加入的字符与窗口内某字符重复时，只需要把左边界移到「重复字符上一次出现位置的下一个位置」，窗口就重新变得无重复，不必从每个起点重来。为此用一个哈希表 `charIndex` 记录每个字符**在当前已扫描前缀中最后一次出现的位置**。

**算法步骤：**

1. `charIndex` 为空 map，`left = 0`，`maxLen = 0`。
2. `right` 从 0 到 `n-1`：
   - 取当前字符 `ch = s[right]`；
   - 若 `charIndex` 中有 `ch` 且其记录的位置 `lastPos >= left`（说明该字符确实还在**当前窗口**内），则令 `left = lastPos + 1`；
   - 更新 `charIndex[ch] = right`；
   - 用 `right - left + 1` 更新 `maxLen`。
3. 返回 `maxLen`。

**不变量：** 每轮循环结束时，窗口 `[left, right]` 内没有重复字符。

**为什么正确：**

- **窗口的维护（贪心）**：加入 `s[right]` 前，若它上次出现在 `lastPos >= left`，则 `[left, right]` 会因该字符重复而非法。所有以 `right` 结尾且合法的窗口，左端点必须大于 `lastPos`；取最小的合法左端点 `lastPos + 1` 才能得到以 `right` 结尾的最长合法窗口，所以把 `left` 设为 `lastPos + 1` 是最优的。
- **`lastPos >= left` 这个判断不可省**：`charIndex` 保存的是整个前缀的最后位置，可能落在窗口左侧之外（例如 `"abba"` 处理到最后一个 `a` 时，`a` 的记录停在 0，早已被 `left` 抛弃）。若不判断就直接 `left = lastPos + 1`，会把左边界向左**回退**，破坏窗口无重复的不变量。
- **正确性归纳**：假设上一轮窗口无重复。本轮若 `ch` 不在窗口内，窗口仍无重复；若在窗口内，把左边界推到上次出现位置之后，窗口内不再有 `ch`，其余字符本来就不重复。于是每轮记录的 `right - left + 1` 都是合法的无重复子串长度；而每轮取的是以 `right` 结尾的最长合法窗口，遍历所有右端点即得全局最长。

**时间复杂度：** O(n)。`right` 单向走 n 步，`left` 全程也只增不减；哈希操作均摊 O(1)，每个字符最多被访问常数次。

**空间复杂度：** O(min(n, 字符集大小))。map 中最多存字符集内所有不同字符；本题 `s` 由英文字母、数字、符号和空格组成（ASCII），故最多 128 个键，即 O(128)。

**易错点：**

- 忘记 `lastPos >= left` 判断是最常见的错误，`"abba"`、`"dvdf"` 这类用例会暴露出来。
- `left` 只能右移不能左移，所以要么用「记录位置 + 判断是否在窗口内」，要么写成 `left = max(left, lastPos+1)`。
- 空字符串返回 0，代码中 `maxLen` 初值 0 已覆盖。
- `s[right]` 取的是字节；题目限定英文字母、数字、符号和空格（ASCII），按字节处理没问题，若输入含多字节字符需改成 rune。
- 更新 `maxLen` 要在移动 `left` 之后，否则可能把已经非法的窗口长度计入。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/31-longest-substring-without-repeating-characters-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
