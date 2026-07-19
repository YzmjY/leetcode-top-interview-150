# 26. 判断子序列

## 题目描述

给定字符串 `s` 和 `t`，判断 `s` 是否为 `t` 的子序列。

字符串的一个子序列是原始字符串删除一些（也可以不删除）字符而不改变剩余字符相对位置形成的新字符串。（例如，`"ace"` 是 `"abcde"` 的一个子序列，而 `"aec"` 不是）。

**示例 1：**

```
输入：s = "abc", t = "ahbgdc"
输出：true
```

**示例 2：**

```
输入：s = "axc", t = "ahbgdc"
输出：false
```

**约束条件：**

- `0 <= s.length <= 100`
- `0 <= t.length <= 10^4`
- 两个字符串都只由小写字符组成。

**进阶：** 如果有大量输入的 S，称作 S1, S2, ..., Sk 其中 k >= 10亿，你需要依次检查它们是否为 T 的子序列。在这种情况下，你会怎样改变代码？

## 题目分析

**算法思路：** 使用同向双指针。指针 `i` 指向 `s` 的当前匹配位置，指针 `j` 遍历 `t`。当 `s[i] == t[j]` 时，`i` 后移。当 `j` 遍历完 `t` 或 `i` 遍历完 `s` 时结束。最终如果 `i == len(s)`，说明 `s` 的所有字符都在 `t` 中按顺序找到了。

**时间复杂度：** O(n)，n 为 t 的长度。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/26-is-subsequence-demo.html"
  style="width:100%; height:460px; border:none; border-radius:8px; background:transparent;"
  title="判断子序列 - 交互演示">
</iframe>

## Go 代码实现

```go
// isSubsequence 判断 s 是否为 t 的子序列
// 使用同向双指针
func isSubsequence(s string, t string) bool {
    // i 指向 s 中待匹配的字符
    i := 0
    // j 遍历 t
    for j := 0; j < len(t) && i < len(s); j++ {
        // 找到匹配字符，s 的指针后移
        if s[i] == t[j] {
            i++
        }
        // 注意：即使不匹配，j 也会在循环中自增
    }
    // s 的所有字符都被匹配到，说明是子序列
    return i == len(s)
}
```
