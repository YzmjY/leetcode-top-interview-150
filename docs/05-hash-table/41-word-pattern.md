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

### 复杂度分析

- **时间复杂度**：O(n + m)，其中 n 是 `pattern` 的长度，m 是 `s` 的长度。分割字符串和遍历都是线性的。
- **空间复杂度**：O(n + m)，存储单词数组和两个哈希表。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/41-word-pattern-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
