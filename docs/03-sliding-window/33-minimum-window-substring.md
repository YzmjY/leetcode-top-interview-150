# 33. 最小覆盖子串

## 题目描述

给你一个字符串 `s`、一个字符串 `t`。返回 `s` 中涵盖 `t` 所有字符的最小子串。如果 `s` 中不存在涵盖 `t` 所有字符的子串，则返回空字符串 `""`。

**注意：**

- 对于 `t` 中重复字符，我们寻找的子字符串中该字符数量必须不少于 `t` 中该字符数量。
- 如果 `s` 中存在这样的子串，我们保证它是唯一的答案。

**示例 1：**

```
输入：s = "ADOBECODEBANC", t = "ABC"
输出："BANC"
解释：最小覆盖子串 "BANC" 包含来自字符串 t 的 'A'、'B' 和 'C'。
```

**示例 2：**

```
输入：s = "a", t = "a"
输出："a"
解释：整个字符串 s 是最小覆盖子串。
```

**示例 3：**

```
输入: s = "a", t = "aa"
输出: ""
解释: t 中两个字符 'a' 均应包含在 s 的子串中，因此没有符合条件的子字符串，返回空字符串。
```

**约束条件：**

- `m == s.length`
- `n == t.length`
- `1 <= m, n <= 10^5`
- `s` 和 `t` 由英文字母组成

**进阶：** 你能设计一个在 `O(m+n)` 时间内解决此问题的算法吗？

## 题目分析

**算法思路：** 需要包含 `t` 中所有字符（含重复次数）的连续子串。朴素做法是枚举左右端点再检查是否覆盖，约 O(m²·n)。改用变长滑动窗口：右边界不断扩展，直到窗口刚刚覆盖 `t`；一旦覆盖，就尝试收缩左边界，看能否得到更短的合法窗口。为了能 O(1) 判断「是否覆盖」，用两张计数表 `need`（`t` 中每个字符需要的数量）和 `have`（当前窗口中各字符的数量），再用 `matched` 记录「数量已经满足要求的字符种类数」。

**算法步骤：**

1. 统计 `need`：`t` 中每个字符的出现次数，`needCount = len(need)` 为不同字符种类数。
2. `left = 0`，`have = {}`，`matched = 0`，`minStart = 0`，`minLen = len(s) + 1`。
3. `right` 从 0 到 `m-1`：把 `s[right]` 记入 `have`（只对 `need` 中存在的字符计数）；若某字符的 `have` 刚好等于 `need`，则 `matched++`。
4. 当 `matched == needCount`（窗口已覆盖 `t`）时循环：
   - 用 `right - left + 1` 更新 `minLen` / `minStart`；
   - 尝试移除 `s[left]`：若它是需要的字符且移除前 `have == need`，说明移除后不再满足，`matched--`；然后 `have--`，`left++`。
5. 结束后若 `minLen` 未被更新，返回 `""`，否则返回 `s[minStart : minStart+minLen]`。

**不变量：** `matched` 始终等于「`have[c] >= need[c]` 的字符种类数」。因为对需要的字符，`have` 从 `need-1` 增到 `need` 时 `matched++`（之后继续增加不再重复计数）；从 `need` 减到 `need-1` 时 `matched--`，正好对应它从「满足」变为「不满足」。因此 `matched == needCount` 等价于窗口覆盖了 `t`。

**为什么正确：**

- 收缩循环对每个 `right` 找到的是**以 `right` 结尾的最短覆盖子串**：只要 `matched == needCount` 就一直尝试左移，最后一个被记录的窗口就是不能再缩的那个。
- 任何覆盖子串都以某个位置结尾，枚举所有 `right` 就检查了所有候选，取长度最小者即为全局最优（题目还保证答案唯一）。
- `left` 只增不减，窗口在扩展与收缩中滑动，不会漏掉任何可能的起点组合。

**时间复杂度：** O(m + n)。`right` 走 m 步，`left` 也最多走 m 步，每个字符被加入、移出各一次；建 `need` 表用 O(n)。

**空间复杂度：** O(字符集大小)。两张哈希表各存不同字符数；题目限定英文字母，最多 52 个键，即常数级空间。

**易错点：**

- 判断覆盖要按「字符数量」而不是「字符种类」，`t` 中的重复字符必须被足量覆盖（示例 3 `s="a", t="aa"` 应返回 `""`）。
- `matched` 的两处判断时点不同：加入是**先 `have++` 再判断**是否等于 `need`；移除是**先判断** `have == need` 再 `have--`，写反会使 `matched` 出错。
- `minLen` 用 `len(s)+1` 作哨兵，返回前要判断是否更新过，否则无解时会返回错误切片。
- `len(s) < len(t)` 时可直接返回 `""`（代码已处理）。
- 用 `map[byte]int` 是按字节处理；题目限定英文字母（ASCII），足够，字符集更大时可换数组加速。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/33-minimum-window-substring-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="最小覆盖子串 - 交互演示">
</iframe>

## Go 代码实现

```go
// minWindow 找到 s 中包含 t 所有字符的最小子串
// 变长滑动窗口 + 字符频率统计
func minWindow(s string, t string) string {
    if len(s) < len(t) {
        return ""
    }

    // need 记录 t 中每种字符需要的数量
    need := make(map[byte]int)
    for i := 0; i < len(t); i++ {
        need[t[i]]++
    }
    needCount := len(need) // 不同字符的种类数

    // have 记录当前窗口中每种字符的数量
    have := make(map[byte]int)
    matched := 0 // 已满足条件的字符种类数

    // left 窗口左边界，minStart 最短子串起始位置，minLen 最短子串长度
    left := 0
    minStart := 0
    minLen := len(s) + 1

    // right 扩展窗口右边界
    for right := 0; right < len(s); right++ {
        ch := s[right]

        // 如果当前字符是需要的
        if need[ch] > 0 {
            have[ch]++
            // 该字符数量刚好满足要求
            if have[ch] == need[ch] {
                matched++
            }
        }

        // 当窗口包含了所有需要的字符，尝试收缩左边界
        for matched == needCount {
            // 更新最短子串
            curLen := right - left + 1
            if curLen < minLen {
                minLen = curLen
                minStart = left
            }

            // 移除左边界字符
            leftCh := s[left]
            if need[leftCh] > 0 {
                // 如果移除后不再满足条件
                if have[leftCh] == need[leftCh] {
                    matched--
                }
                have[leftCh]--
            }
            left++
        }
    }

    if minLen == len(s)+1 {
        return ""
    }
    return s[minStart : minStart+minLen]
}
```
