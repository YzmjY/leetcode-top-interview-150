# 41. 单词规律

## 题目描述

给定一种规律 `pattern` 和一个字符串 `s`，判断 `s` 是否遵循相同的规律。

这里的 **遵循** 指完全匹配，例如，`pattern` 里的每个字母和字符串 `s` 中的每个非空单词之间存在着双向连接的映射规律。

**示例 1：**

```
输入：pattern = "abba", s = "dog cat cat dog"
输出：true
```

**示例 2：**

```
输入：pattern = "abba", s = "dog cat cat fish"
输出：false
```

**示例 3：**

```
输入：pattern = "aaaa", s = "dog cat cat dog"
输出：false
```

**约束条件：**

- `1 <= pattern.length <= 300`
- `pattern` 只包含小写英文字母
- `1 <= s.length <= 3000`
- `s` 只包含小写英文字母和空格 `' '`
- `s` **不包含**任何前导或尾随空格
- `s` 中的每个单词都由单个空格分隔

## 题目分析

### 算法思路

本题与"同构字符串"本质相同，区别在于将字符串中的字符映射替换为 `pattern` 中的字符与单词之间的映射。

核心思路仍然是 **双向映射**：
1. 将 `s` 按空格分割成单词数组。
2. 首先检查单词数量是否与 `pattern` 长度相等，不等则直接返回 `false`。
3. 使用两个哈希表分别记录 `pattern[i] -> word` 和 `word -> pattern[i]` 的映射。
4. 遍历检查现有映射是否一致，不一致则返回 `false`。

### 算法步骤

1. 用 `strings.Split(s, " ")` 把 `s` 切成单词数组 `words`。
2. 若 `len(pattern) != len(words)`，说明无法一一对应，直接返回 `false`。
3. 建立 `p2w map[byte]string` 与 `w2p map[string]byte`。
4. 同步遍历 `i` 从 `0` 到 `len(pattern)-1`：
   - 若 `p2w` 中已有 `pattern[i]` 且其值不是 `words[i]`，返回 `false`；
   - 若 `w2p` 中已有 `words[i]` 且其值不是 `pattern[i]`，返回 `false`；
   - 否则写入两个方向的映射。
5. 遍历结束返回 `true`。

### 为什么正确

题目要求 `pattern` 中每个字母与 `s` 中每个单词之间是「双向连接」的一一对应。`p2w` 保证每个 pattern 字符只对应一个单词（函数性），`w2p` 保证每个单词只对应一个 pattern 字符（单射性）。长度检查排除了一对一在数量上就不可能的情形。遍历中任何一次冲突都意味着双射不存在；反之若从不冲突，已确认的前缀映射可以补齐为完整双射，故返回 `true` 正确。可以把它看成「把单词整体当成字符」的同构字符串问题。

### 复杂度分析

- **时间复杂度**：O(n + m)，其中 n 是 `pattern` 的长度，m 是 `s` 的长度。分割字符串和遍历都是线性的（哈希表操作按字符串长度计摊销）。
- **空间复杂度**：O(n + m)，存储单词数组和两个哈希表。

### 易错点 / 边界情况

- 必须先比较 `len(pattern)` 与 `len(words)`，否则后续按下标访问会错配甚至越界。
- 必须按单个空格 `strings.Split(s, " ")` 切分；题目保证单词之间只有单个空格、且无前导/尾随空格，用 `strings.Fields` 虽然更宽容但也同样正确。
- 两个方向的映射都要检查：只查一个方向会把 `"ab"` 与 `"dog dog"` 误判为 `true`。
- 同一 pattern 字符必须始终对应同一单词，不同 pattern 字符必须对应不同单词。
- 单词可能重复出现，用 `w2p` 是为了捕捉「不同字符映射到同一单词」的冲突。
- 单词作为 map 的键会参与哈希，整体复杂度仍是线性，但常数比定长数组大。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/41-word-pattern-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="单词规律 - 交互演示">
</iframe>

## Go 代码实现

```go
import "strings"

func wordPattern(pattern string, s string) bool {
    // 将 s 按空格分割成单词数组
    words := strings.Split(s, " ")
    // 长度不相等一定不匹配
    if len(pattern) != len(words) {
        return false
    }

    // pattern 字符 -> 单词 的映射
    p2w := make(map[byte]string)
    // 单词 -> pattern 字符 的映射
    w2p := make(map[string]byte)

    for i := 0; i < len(pattern); i++ {
        p := pattern[i]
        w := words[i]

        // 检查 pattern -> word 的映射是否一致
        if v, ok := p2w[p]; ok && v != w {
            return false
        }
        // 检查 word -> pattern 的映射是否一致
        if v, ok := w2p[w]; ok && v != p {
            return false
        }

        // 建立双向映射
        p2w[p] = w
        w2p[w] = p
    }

    return true
}
```
