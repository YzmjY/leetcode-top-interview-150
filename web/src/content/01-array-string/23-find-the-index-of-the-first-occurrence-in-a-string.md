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

**算法思路：** 使用 KMP（Knuth-Morris-Pratt）算法。暴力匹配在失配时会把主串指针回退到本次匹配起点的下一位、模式串指针归零，最坏 O(m*n)；KMP 的核心观察是：**已经匹配成功的那段文本的后缀，如果恰好是模式串的前缀，这些字符就不需要重新比较**。用一个 `next` 数组记录模式串自身这种"前后缀重合"的信息，失配时只移动模式串指针，主串指针永不回退，复杂度降到 O(m+n)。

1. **构建 next 数组（前缀表）**：对于模式串 `needle`，`next[i]` 表示子串 `needle[0..i]`（**包含下标 i**）中"最长相等真前后缀"的长度，即满足 `needle[0:k] == needle[i-k+1:i+1]` 的最大 `k`（`k ≤ i`）。例如 `needle = "abab"` 时 `next = [0,0,1,2]`。
2. **匹配过程**：用 `j` 表示"当前已匹配上的模式串前缀长度"。扫描文本时若 `haystack[i] == needle[j]` 则 `j++`；失配且 `j > 0` 时令 `j = next[j-1]` 继续尝试（可能连续回退）。当 `j == m` 时匹配完成，返回起点 `i - m + 1`。

**算法步骤：**

1. 若 `m == 0` 返回 0；若 `n < m` 返回 -1。
2. 构建 `next`：令 `j = 0`；对 `i = 1..m-1`：当 `j > 0 && needle[i] != needle[j]` 时 `j = next[j-1]`；若 `needle[i] == needle[j]` 则 `j++`；最后 `next[i] = j`。
3. 匹配：令 `j = 0`；对 `i = 0..n-1`：当 `j > 0 && haystack[i] != needle[j]` 时 `j = next[j-1]`；若 `haystack[i] == needle[j]` 则 `j++`；若此时 `j == m`，返回 `i-m+1`。
4. 扫描结束仍未匹配，返回 -1。

**为什么正确：**

匹配循环的核心不变量：每轮开始时，`j` 等于"以 `haystack[i-1]` 结尾、同时是 `needle` 前缀的最长子串长度"，即 `haystack[i-j .. i-1] == needle[0 .. j-1]`，且所有更长的候选都已排除。

- 若 `haystack[i] == needle[j]`，已匹配前缀可以延长一位，不变量对下一轮继续成立。
- 若失配，任何仍以 `haystack[i-1]` 结尾的可行前缀必须是已匹配段 `needle[0..j-1]` 的真后缀，同时又是 `needle` 的前缀。`next[j-1]` 正是其中**最长**的一个，所以把 `j` 回退到它不会漏掉任何潜在匹配；比它更短的候选都在先前步骤中已被排除，无需再试。
- 因此主串指针 `i` 不需要回退。所有起点都被穷尽后若 `j` 始终未达到 m，说明不存在匹配。

`next` 数组的构建是对 `needle` 自身套用同一套"求当前匹配前缀长度"的逻辑（把模式串同时当作模式串和文本串），其正确性由同一个不变量保证。

**时间复杂度：** O(m + n)。构建 `next` 是 O(m)；匹配阶段 `i` 单调递增，`j` 每次至多加 1，而回退只会让 `j` 减小，故总比较/回退次数与 `j` 的总增量同阶，为 O(n)。均摊后整体线性。

**空间复杂度：** O(m)，存储长度为 m 的 `next` 数组。

**易错点 / 边界情况：**

- `m == 0` 必须在访问 `needle[j]` 之前处理（本题约束 m ≥ 1，但按通用接口约定应返回 0）。
- `n < m` 可直接返回 -1，省去后续处理；否则匹配循环中 `needle[j]` 也有越界风险。
- 回退要用 `for` 而不是 `if`，一次失配可能需要连续回退多次（如模式 `"aaaaab"` 匹配长串 `"aaaa…"`）。
- 回退取值是 `next[j-1]`（下标 `j-1` 处的最长前后缀长度），不是 `next[j]`：后者与当前已匹配长度不对应，且当 `j == m` 时会越界。
- `next[i]` 描述的是 `needle[0..i]`（含下标 `i`）的真前后缀，不要误解成 `needle[0:i]`（不含 `i`）。
- 失配回退后仍需把当前文本字符与 `needle[j]` 重新比较，代码通过随后的 `if` 分支完成，不能漏。
- 边界用例：`needle` 出现在末尾、`needle == haystack`、模式长度为 1、全相同字符、大量重复前缀的串。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/23-find-the-index-of-the-first-occurrence-in-a-string-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
    // next[i] 表示 needle[0..i]（含下标 i）中最长相等真前后缀的长度
    next := make([]int, m)
    // j 表示当前最长相等前后缀的长度，也是下一个待比较的前缀位置
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
