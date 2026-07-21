# 145. 最长回文子串 (Longest Palindromic Substring)

## 题目描述

给你一个字符串 `s`，找到 `s` 中最长的回文子串。

如果字符串的反序与原始字符串相同，则该字符串称为回文字符串。

**示例 1：**

```
输入：s = "babad"
输出："bab"
解释："aba" 同样是符合题意的答案。
```

**示例 2：**

```
输入：s = "cbbd"
输出："bb"
```

**约束条件：**

- `1 <= s.length <= 1000`
- `s` 仅由数字和英文字母组成

## 题目分析

### 算法思路

**方法一：中心扩展法（推荐）**

遍历字符串的每个位置作为回文中心，向两边扩展。回文中心有两种情况：
- 奇数长度回文：以单个字符为中心。
- 偶数长度回文：以两个相邻字符为中心。

对每个中心，尽可能向两边扩展直到不再是回文，记录最长结果。

**方法二：二维 DP（区间 DP）**

- **状态定义**：`dp[i][j]` = `s[i:j+1]` 是否为回文子串。
- **状态转移**：`dp[i][j] = (s[i] == s[j]) && (j-i < 3 || dp[i+1][j-1])`
  - 即：两端字符相等，且内部子串也是回文。
- **遍历顺序**：按子串长度从小到大遍历（或从右向左遍历 i，从左向右遍历 j）。

### 复杂度分析

**中心扩展法：**
- 时间复杂度：O(n^2)，每个中心扩展 O(n)。
- 空间复杂度：O(1)。

**DP 方法：**
- 时间复杂度：O(n^2)
- 空间复杂度：O(n^2)

### 关键点

- 中心扩展法更实用，不需要额外空间。
- DP 方法更直观地展示区间 DP 的思想，但空间开销大。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/145-longest-palindromic-substring-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="最长回文子串 (Longest Palindromic Substring) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func longestPalindrome(s string) string {
    if len(s) < 2 {
        return s
    }

    start, maxLen := 0, 0

    for i := 0; i < len(s); i++ {
        // 奇数长度回文（单中心）
        l1, r1 := expandAroundCenter(s, i, i)
        // 偶数长度回文（双中心）
        l2, r2 := expandAroundCenter(s, i, i+1)

        if r1-l1 > maxLen {
            start, maxLen = l1, r1-l1
        }
        if r2-l2 > maxLen {
            start, maxLen = l2, r2-l2
        }
    }

    return s[start : start+maxLen+1]
}

// expandAroundCenter 从中心向两边扩展，返回回文子串的左右边界索引
func expandAroundCenter(s string, left, right int) (int, int) {
    for left >= 0 && right < len(s) && s[left] == s[right] {
        left--
        right++
    }
    // 退出循环时 left 和 right 多走了一步，回退
    return left + 1, right - 1
}
```
