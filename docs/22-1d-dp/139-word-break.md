# 139. 单词拆分 (Word Break)

## 题目描述

给你一个字符串 `s` 和一个字符串列表 `wordDict` 作为字典。如果可以利用字典中出现的一个或多个单词拼接出 `s` 则返回 `true`。

**注意：** 不要求字典中出现的单词全部都使用，并且字典中的单词可以重复使用。

**示例 1：**

```
输入: s = "leetcode", wordDict = ["leet","code"]
输出: true
解释: 返回 true 因为 "leetcode" 可以由 "leet" 和 "code" 拼接成。
```

**示例 2：**

```
输入: s = "applepenapple", wordDict = ["apple","pen"]
输出: true
解释: 返回 true 因为 "applepenapple" 可以由 "apple" "pen" "apple" 拼接成。
     注意，你可以重复使用字典中的单词。
```

**示例 3：**

```
输入: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
输出: false
```

**约束条件：**

- `1 <= s.length <= 300`
- `1 <= wordDict.length <= 1000`
- `1 <= wordDict[i].length <= 20`
- `s` 和 `wordDict[i]` 仅有小写英文字母组成
- `wordDict` 中的所有字符串 **互不相同**

## 题目分析

### 算法思路

**方法：一维 DP（分割枚举）**

- **状态定义**：`dp[i]` = 字符串 s 的前 i 个字符（s[0:i]）能否被字典中的单词拼接。
- **状态转移**：对于位置 i，枚举所有可能的分割点 j（j < i），如果 `dp[j]` 为 true 且 `s[j:i]` 在字典中，则 `dp[i] = true`。
- **边界条件**：`dp[0] = true`（空字符串可以被拼接）。

**优化**：将 wordDict 放入哈希集合，实现 O(1) 的单词查找。

### 复杂度分析

- **时间复杂度**：O(n^2 * L)，其中 n 是字符串长度，L 是子串比较的平均长度。最坏 O(n^3)。
- **空间复杂度**：O(n + m)，其中 m 是字典中所有单词的总长度（哈希集合）。

### 关键点

- 枚举分割点是这类"分割问题"的标准做法。
- 可以用 Trie 树进一步优化查找效率。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/139-word-break-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="单词拆分 (Word Break) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func wordBreak(s string, wordDict []string) bool {
    // 将字典放入哈希集合
    wordSet := make(map[string]bool)
    for _, word := range wordDict {
        wordSet[word] = true
    }

    n := len(s)
    dp := make([]bool, n+1)
    dp[0] = true // 空字符串可被拼接

    for i := 1; i <= n; i++ {
        for j := 0; j < i; j++ {
            if dp[j] && wordSet[s[j:i]] {
                dp[i] = true
                break
            }
        }
    }

    return dp[n]
}
```
