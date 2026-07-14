# 20. 最长公共前缀

## 题目描述

编写一个函数来查找字符串数组中的最长公共前缀。

如果不存在公共前缀，返回空字符串 `""`。

**示例 1：**

```
输入：strs = ["flower","flow","flight"]
输出："fl"
```

**示例 2：**

```
输入：strs = ["dog","racecar","car"]
输出：""
解释：输入不存在公共前缀。
```

**约束条件：**

- `1 <= strs.length <= 200`
- `0 <= strs[i].length <= 200`
- `strs[i]` 仅由小写英文字母组成

## 题目分析

**算法思路：** 纵向扫描法。以第一个字符串为基准，逐个字符与其余所有字符串在相同位置的字符比较。如果某个位置不匹配，或者某个字符串长度不够，则返回当前已匹配的前缀。

**时间复杂度：** O(S)，S 是所有字符串的字符总数。最坏情况是所有字符串相同。

**空间复杂度：** O(1)。

## Go 代码实现

```go
// longestCommonPrefix 查找字符串数组中的最长公共前缀
// 使用纵向扫描，逐字符比较
func longestCommonPrefix(strs []string) string {
    if len(strs) == 0 {
        return ""
    }

    // 以第一个字符串为基准
    first := strs[0]
    // 遍历第一个字符串的每个字符
    for i := 0; i < len(first); i++ {
        ch := first[i]
        // 与其余每个字符串的同一位置比较
        for j := 1; j < len(strs); j++ {
            // 如果超出长度或字符不匹配，返回当前前缀
            if i >= len(strs[j]) || strs[j][i] != ch {
                return first[:i]
            }
        }
    }

    // 第一个字符串全部匹配，它就是最长公共前缀
    return first
}
```
