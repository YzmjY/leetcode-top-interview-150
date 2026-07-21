# 40. 同构字符串

## 题目描述

给定两个字符串 `s` 和 `t`，判断它们是否是同构的。

如果 `s` 中的字符可以按某种映射关系替换得到 `t`，那么这两个字符串是同构的。

每个出现的字符都应当映射到另一个字符，同时不改变字符的顺序。不同字符不能映射到同一个字符上，相同字符只能映射到同一个字符上，字符可以映射到自己本身。

**示例 1：**

```
输入：s = "egg", t = "add"
输出：true
```

**示例 2：**

```
输入：s = "foo", t = "bar"
输出：false
```

**示例 3：**

```
输入：s = "paper", t = "title"
输出：true
```

**约束条件：**

- `1 <= s.length <= 5 * 10^4`
- `t.length == s.length`
- `s` 和 `t` 由任意有效的 ASCII 字符组成

## 题目分析

### 算法思路

同构字符串要求建立 **双向的一一映射**，即：

1. `s` 中的每个字符只能映射到 `t` 中的一个固定字符。
2. `t` 中的每个字符也只能被 `s` 中的一个固定字符映射。

因此需要两张哈希表（或两个数组，因为 ASCII 共 128 个字符）分别记录两个方向的映射关系。

遍历字符串 `s` 和 `t` 的每个位置：
- 如果 `s[i]` 已经映射到了某个字符，检查它是否等于 `t[i]`，不等于则返回 `false`。
- 如果 `t[i]` 已经映射到了某个字符，检查它是否等于 `s[i]`，不等于则返回 `false`。
- 如果都没有映射过，则建立双向映射。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 是字符串长度。只需要遍历一次。
- **空间复杂度**：O(1)，使用两个固定大小（128）的数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/40-isomorphic-strings-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="同构字符串 - 交互演示">
</iframe>

## Go 代码实现

```go
func isIsomorphic(s string, t string) bool {
    // s -> t 的映射
    s2t := [128]byte{}
    // t -> s 的映射
    t2s := [128]byte{}

    for i := 0; i < len(s); i++ {
        sc, tc := s[i], t[i]

        // 检查 s[i] -> t[i] 的映射是否一致
        if s2t[sc] != 0 && s2t[sc] != tc {
            return false
        }
        // 检查 t[i] -> s[i] 的映射是否一致
        if t2s[tc] != 0 && t2s[tc] != sc {
            return false
        }

        // 建立双向映射
        s2t[sc] = tc
        t2s[tc] = sc
    }

    return true
}
```
