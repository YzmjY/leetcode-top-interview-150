# 146. 交错字符串 (Interleaving String)

## 题目描述

给定三个字符串 `s1`、`s2`、`s3`，请你帮忙验证 `s3` 是否是由 `s1` 和 `s2` **交错** 组成的。

两个字符串 `s` 和 `t` **交错** 的定义与过程如下，其中每个字符串会被分割成若干 **非空** 子字符串：

- `s = s1 + s2 + ... + sn`
- `t = t1 + t2 + ... + tm`
- `|n - m| <= 1`
- 交错 是 `s1 + t1 + s2 + t2 + s3 + t3 + ...` 或者 `t1 + s1 + t2 + s2 + t3 + s3 + ...`

**注意：** a + b 意味着字符串 a 和 b 连接。

**示例 1：**

```
输入：s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
输出：true
```

**示例 2：**

```
输入：s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
输出：false
```

**示例 3：**

```
输入：s1 = "", s2 = "", s3 = ""
输出：true
```

**约束条件：**

- `0 <= s1.length, s2.length <= 100`
- `0 <= s3.length <= 200`
- `s1`、`s2` 和 `s3` 都由小写英文字母组成

**进阶：** 您能否仅使用 O(s2.length) 额外的内存空间来解决它？

## 题目分析

### 算法思路

**方法：二维 DP（双序列 DP）**

- **状态定义**：`dp[i][j]` = s1 的前 i 个字符与 s2 的前 j 个字符能否交错组成 s3 的前 i+j 个字符。
- **状态转移**：
  - 如果 `s1[i-1] == s3[i+j-1]`：`dp[i][j] = dp[i][j] || dp[i-1][j]`（匹配 s1 的字符）
  - 如果 `s2[j-1] == s3[i+j-1]`：`dp[i][j] = dp[i][j] || dp[i][j-1]`（匹配 s2 的字符）
- **边界条件**：`dp[0][0] = true`（空字符串可以交错组成空字符串）。
- **答案**：`dp[len(s1)][len(s2)]`

**空间优化**：可以用一维数组滚动更新，空间复杂度降至 O(n)。

### 复杂度分析

- **时间复杂度**：O(m * n)，其中 m = len(s1)，n = len(s2)。
- **空间复杂度**：O(n)，使用一维数组。

### 关键点

- 首先检查长度：必须满足 `len(s1) + len(s2) == len(s3)`。
- 状态转移中，当前字符可以来自 s1 或 s2（像两条路径交错进行）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/146-interleaving-string-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="交错字符串 (Interleaving String) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func isInterleave(s1 string, s2 string, s3 string) bool {
    m, n, t := len(s1), len(s2), len(s3)

    // 长度必须匹配
    if m+n != t {
        return false
    }

    // dp[j] 表示 s1 的前 i 个字符与 s2 的前 j 个字符能否组成 s3 的前 i+j 个字符
    dp := make([]bool, n+1)

    for i := 0; i <= m; i++ {
        for j := 0; j <= n; j++ {
            if i == 0 && j == 0 {
                dp[j] = true
            } else if i == 0 {
                // 只用 s2 匹配
                dp[j] = dp[j-1] && s2[j-1] == s3[j-1]
            } else if j == 0 {
                // 只用 s1 匹配
                dp[j] = dp[j] && s1[i-1] == s3[i-1]
            } else {
                dp[j] = (dp[j] && s1[i-1] == s3[i+j-1]) ||
                        (dp[j-1] && s2[j-1] == s3[i+j-1])
            }
        }
    }

    return dp[n]
}
```
