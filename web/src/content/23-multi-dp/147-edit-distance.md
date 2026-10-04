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

**关键观察。** 设 `dp[i][j]` 表示把 word1 的前 `i` 个字符变成 word2 的前 `j` 个字符所需的最少操作数。
只看两个前缀的**最后一个字符** `word1[i-1]` 与 `word2[j-1]`，就足以决定转移：

- **两者相等**：最优做法一定不会去动它们，直接把这两个字符配对，问题缩小为 `dp[i-1][j-1]`。
  （删除+插入这对字符至少要 2 步，比不操作更差；替换更是多余。）
- **两者不等**：最后一步必然是三种操作之一：
  - **替换**：把 `word1[i-1]` 改成 `word2[j-1]`，花费 1 步，之后两个前缀各缩短一个 → `dp[i-1][j-1] + 1`；
  - **删除**：删掉 `word1[i-1]`，word2 的前缀不变 → `dp[i-1][j] + 1`；
  - **插入**：在 word1 中插入 `word2[j-1]`，word1 前缀不变、word2 缩短一个 → `dp[i][j-1] + 1`。

  取三者最小值。

- **状态转移**：

  ```
  word1[i-1] == word2[j-1] :  dp[i][j] = dp[i-1][j-1]
  否则                      :  dp[i][j] = min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) + 1
  ```

- **边界条件**：`dp[0][j] = j`（空串变成 `j` 个字符只能插入 `j` 次）；`dp[i][0] = i`（`i` 个字符变成空串只能删除 `i` 次）。
- **答案**：`dp[m][n]`，`m = len(word1)`、`n = len(word2)`。

**为什么正确（最后一步分类 + 归纳）。** 对 `i + j` 归纳。任何把 word1 前 `i` 个变成 word2 前 `j` 个的操作序列，
考虑它把 `word1[i-1]` 和 `word2[j-1]` 处理成了什么：要么这对字符被配对（相等时不做操作，
不等时用一次替换把前者变成后者），要么 `word1[i-1]` 被删除，要么 `word2[j-1]` 是在某一步插入进来的
（对应 `dp[i][j-1]`）。这三种情形覆盖了所有可能，且剩下的部分是规模更小的同类问题，
由归纳假设其代价分别取到最优，因此取最小值即得最优解。归纳基础 `i == 0` 或 `j == 0` 由边界给出。

**空间优化（一维滚动 + `prev` 变量，代码实现）。** 计算 `dp[i][j]` 需要三个值：
`dp[i-1][j-1]`（左上）、`dp[i-1][j]`（上）、`dp[i][j-1]`（左）。用长度 `n+1` 的一维数组 `dp` 滚动时：

- 覆盖前的 `dp[j]` 是上一行的 `dp[i-1][j]`（上）；
- `dp[j-1]` 已被本行更新为 `dp[i][j-1]`（左）；
- 左上角 `dp[i-1][j-1]` 会被覆盖掉，所以用一个额外变量 `prev` 携带它。

具体做法（对应代码）：

1. 每开始新的一行 `i`，先 `prev = dp[0]`（此时 `dp[0]` 还是 `dp[i-1][0]`），再把 `dp[0] = i`；
2. 内层循环里先用 `temp := dp[j]` 记住旧的 `dp[i-1][j]`，据此算出新的 `dp[j]`；
3. 循环末尾 `prev = temp`，供下一个 `j` 当作自己的左上角。

### 复杂度分析

- **时间复杂度**：O(m·n)。共 `(m+1)(n+1)` 个状态，每个状态 O(1) 次比较。m, n ≤ 500 时约 2.5×10⁵ 个状态，非常轻松。
- **空间复杂度**：O(n)，一维滚动数组（若让 n 取较短串，可做到 O(min(m, n))）；使用完整二维表则为 O(m·n)。
  返回的编辑距离 ≤ max(m, n) ≤ 500，`int` 足够。

### 关键点

- 三种操作与 DP 表方向一一对应：**替换 = 左上**、**删除 = 上**、**插入 = 左**，写转移时不要错位。
- 字符相等时要直接取 `dp[i-1][j-1]`，不能也套用 `min(三种) + 1`——那样会得到偏大的结果。
- 边界 `dp[0][j] = j`、`dp[i][0] = i` 必须显式初始化，否则后续全部错误。
- 一维滚动时 `prev` 的更新时机是易错点：必须在**计算 `dp[j]` 之前**取出旧的 `dp[j]` 存到 `temp`，
  计算完成后再 `prev = temp`。
- 空串是合法输入（长度可以为 0）：`word1` 为空时答案是 `len(word2)`，反之为 `len(word1)`。
- 本题即 Levenshtein 距离，与「交错字符串」同属双序列 DP，状态都是 `(i, j)` 表示两串前缀。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/147-edit-distance-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
