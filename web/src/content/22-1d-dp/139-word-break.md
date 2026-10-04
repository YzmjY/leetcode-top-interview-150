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

**朴素想法**：枚举所有可能的切分方式（在每个字符间隙决定切不切），共 2^(n-1) 种，n ≤ 300 时不可行。但切分问题有明显的重叠子问题：前缀 `s[0:i]` 能否被拼出，只取决于更短的、形式相同的子问题，适合 DP。

**方法：一维 DP（分割枚举）**

- **状态定义**：`dp[i]` = 前缀 `s[0:i]`（长度为 i）能否被字典中的单词拼接。
- **状态转移**：考虑最后切出的那个单词。设它的起点是 j（0 ≤ j < i），则 `s[j:i]` 是最后一个单词，它前面的部分必须是可拼的，即 `dp[j] == true`，并且 `s[j:i]` 必须在字典中。只要存在一个这样的 j，就有 `dp[i] = true`。
- **边界条件**：`dp[0] = true`，空串不需要任何单词，是递推的起点。

**为什么正确**：任何能拼出 `s[0:i]` 的方案，去掉最后一个单词后剩下的部分恰好是某个更短前缀 `s[0:j]` 的合法拼法，因此这个 j 一定在枚举范围内，转移是完备的；反之，若存在 j 满足条件，把 `s[0:j]` 的合法拼法接上单词 `s[j:i]` 就得到 `s[0:i]` 的合法拼法，转移是可靠的。所以 dp 值恰好等价于「可拼」。

**优化**：把 `wordDict` 放进哈希集合，单词查找平均 O(1)，避免每个子串都扫描一遍字典。

### 复杂度分析

- **时间复杂度**：O(n²·L)，其中 n = |s|，L 是子串的长度（L ≤ 20）。状态枚举是 O(n²) 个 (i, j) 对，每个子串 `s[j:i]` 的哈希计算/比较代价为 O(L)。可以进一步只枚举 `j ≥ i - L`（比最大单词还长的子串不可能命中字典），把复杂度降到 O(n·L²)。
- **空间复杂度**：O(n + M)，dp 数组 O(n)，哈希集合存放所有字典单词共 M 个字符。

### 关键点

- 「枚举最后一段」是分割型问题的标准套路，与「单词拆分 II」共享同一套状态定义。
- 内层枚举 j 时一旦找到可行的 j 就可以 `break`，不必继续。
- `s[j:i]` 的切片是左闭右开，j = i 不合法，所以 j 从 0 枚举到 i-1。
- 更快的实现是 Trie（字典树）或从每个位置做前向匹配，但本解已足够通过本题。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/139-word-break-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
