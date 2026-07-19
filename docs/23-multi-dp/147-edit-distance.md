# 147. 编辑距离 (Edit Distance)

## 题目描述

给你两个单词 `word1` 和 `word2`，请返回将 `word1` 转换成 `word2` 所使用的最少操作数。

你可以对一个单词进行如下三种操作：

- 插入一个字符
- 删除一个字符
- 替换一个字符

**示例 1：**

```
输入：word1 = "horse", word2 = "ros"
输出：3
解释：
horse -> rorse (将 'h' 替换为 'r')
rorse -> rose (删除 'r')
rose -> ros (删除 'e')
```

**示例 2：**

```
输入：word1 = "intention", word2 = "execution"
输出：5
解释：
intention -> inention (删除 't')
inention -> enention (将 'i' 替换为 'e')
enention -> exention (将 'n' 替换为 'x')
exention -> exection (将 'n' 替换为 'c')
exection -> execution (插入 'u')
```

**约束条件：**

- `0 <= word1.length, word2.length <= 500`
- `word1` 和 `word2` 由小写英文字母组成

## 题目分析

### 算法思路

**方法：二维 DP（经典双序列 DP，Levenshtein 距离）**

- **状态定义**：`dp[i][j]` = word1 的前 i 个字符转换为 word2 的前 j 个字符所需的最少操作数。
- **状态转移**：
  - 如果 `word1[i-1] == word2[j-1]`：`dp[i][j] = dp[i-1][j-1]`（无需操作）
  - 否则，取三种操作的最小值加一：
    - **替换**：`dp[i-1][j-1] + 1`
    - **删除**（从 word1 删除）：`dp[i-1][j] + 1`
    - **插入**（向 word1 插入）：`dp[i][j-1] + 1`
- **边界条件**：
  - `dp[0][j] = j`（空字符串到 word2 的前 j 个字符需要插入 j 次）
  - `dp[i][0] = i`（word1 的前 i 个字符到空字符串需要删除 i 次）

**空间优化**：可以只用一维数组，但需要额外变量保存左上角的值。

### 复杂度分析

- **时间复杂度**：O(m * n)
- **空间复杂度**：O(n)（一维数组优化）

### 关键点

- 编辑距离是 NLP 中字符串相似度的经典算法。
- 三种操作（替换、插入、删除）在 DP 表中分别对应三个方向。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/147-edit-distance-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="编辑距离 (Edit Distance) - 交互演示">
</iframe>

## Go 代码实现

```go
package main

func minDistance(word1 string, word2 string) int {
    m, n := len(word1), len(word2)

    // dp[j] 表示当前行 word1 前缀到 word2 前 j 个字符的编辑距离
    dp := make([]int, n+1)

    // 初始化：空字符串 -> word2 的前 j 个字符
    for j := 0; j <= n; j++ {
        dp[j] = j
    }

    for i := 1; i <= m; i++ {
        // prev 保存 dp[i-1][j-1]
        prev := dp[0]
        // dp[0] 更新为当前行首：word1 前 i 个 -> 空字符串
        dp[0] = i

        for j := 1; j <= n; j++ {
            temp := dp[j] // 保存旧的 dp[j]（即 dp[i-1][j]）

            if word1[i-1] == word2[j-1] {
                dp[j] = prev // 字符相等，不需要操作
            } else {
                // 取三种操作的最小值
                dp[j] = min(prev, min(dp[j], dp[j-1])) + 1
            }

            prev = temp // 更新 prev 为下一个位置的 dp[i-1][j-1]
        }
    }

    return dp[n]
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```
