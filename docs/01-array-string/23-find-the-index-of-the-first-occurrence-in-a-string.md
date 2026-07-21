# 23. 找出字符串中第一个匹配项的下标

## 题目描述

给你两个字符串 `haystack` 和 `needle`，请你在 `haystack` 字符串中找出 `needle` 字符串的第一个匹配项的下标（下标从 0 开始）。如果 `needle` 不是 `haystack` 的一部分，则返回 `-1`。

**示例 1：**

```
输入：haystack = "sadbutsad", needle = "sad"
输出：0
解释："sad" 在下标 0 和 6 处匹配。第一个匹配项的下标是 0，所以返回 0。
```

**示例 2：**

```
输入：haystack = "leetcode", needle = "leeto"
输出：-1
解释："leeto" 没有在 "leetcode" 中出现，所以返回 -1。
```

**约束条件：**

- `1 <= haystack.length, needle.length <= 10^4`
- `haystack` 和 `needle` 仅由小写英文字符组成

## 题目分析

**算法思路：** 使用 KMP（Knuth-Morris-Pratt）算法。KMP 的核心是利用匹配失败后的信息（next 数组），避免暴力匹配中的回溯，将时间复杂度从 O(m*n) 降到 O(m+n)。

1. **构建 next 数组（最长相等前后缀）**：对于模式串 `needle`，`next[i]` 表示 `needle[0:i]` 子串中前缀和后缀的最长相等长度。
2. **匹配过程**：遍历文本串 `haystack`，当字符不匹配时，根据 next 数组跳过一些字符，避免从头开始匹配。

**时间复杂度：** O(m + n)，其中 m 为 haystack 长度，n 为 needle 长度。

**空间复杂度：** O(n)，存储 next 数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/23-find-the-index-of-the-first-occurrence-in-a-string-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="找出字符串中第一个匹配项的下标 - 交互演示">
</iframe>

## Go 代码实现

```go
// strStr 使用 KMP 算法在 haystack 中查找 needle 的第一个匹配位置
func strStr(haystack string, needle string) int {
    n, m := len(haystack), len(needle)
    if m == 0 {
        return 0
    }
    if n < m {
        return -1
    }

    // 1. 构建 next 数组（前缀表）
    // next[i] 表示 needle[0:i] 中最长相等前后缀的长度
    next := make([]int, m)
    // j 指向前缀的末尾位置（也是当前最长相等前后缀的长度）
    j := 0
    for i := 1; i < m; i++ {
        // 当字符不匹配时，根据已计算出的 next 值回退
        for j > 0 && needle[i] != needle[j] {
            j = next[j-1]
        }
        // 匹配成功，前后缀长度加 1
        if needle[i] == needle[j] {
            j++
        }
        next[i] = j
    }

    // 2. 使用 next 数组进行匹配
    j = 0 // j 指向 needle 的当前匹配位置
    for i := 0; i < n; i++ {
        // 字符不匹配时，根据 next 数组回退
        for j > 0 && haystack[i] != needle[j] {
            j = next[j-1]
        }
        // 匹配成功，needle 指针后移
        if haystack[i] == needle[j] {
            j++
        }
        // 完全匹配 needle
        if j == m {
            return i - m + 1
        }
    }

    return -1
}
```
