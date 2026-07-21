# 43. 字母异位词分组

## 题目描述

给你一个字符串数组，请你将 **字母异位词** 组合在一起。可以按任意顺序返回结果列表。

**字母异位词** 是由重新排列源单词的所有字母得到的一个新单词。

**示例 1：**

```
输入：strs = ["eat","tea","tan","ate","nat","bat"]
输出：[["bat"],["nat","tan"],["ate","eat","tea"]]
```

**示例 2：**

```
输入：strs = [""]
输出：[[""]]
```

**示例 3：**

```
输入：strs = ["a"]
输出：[["a"]]
```

**约束条件：**

- `1 <= strs.length <= 10^4`
- `0 <= strs[i].length <= 100`
- `strs[i]` 仅包含小写字母

## 题目分析

### 算法思路

字母异位词具有一个核心特征：当它们的字符按某一标准排序后，结果是相同的。例如，"eat"、"tea"、"ate" 排序后都是 "aet"。

因此可以使用哈希表进行分组：
- **键（Key）**：将每个单词按字母排序后得到的字符串（作为同一组异位词的标识）。
- **值（Value）**：属于该组的所有原始单词的列表。

遍历 `strs` 中的每个字符串：
1. 将其转为字符数组并排序。
2. 用排序后的字符串作为 key，将原字符串追加到对应的 value 列表中。

### 复杂度分析

- **时间复杂度**：O(n * k * log k)，其中 n 是字符串数量，k 是字符串的最大长度。每个字符串排序需要 O(k log k)。
- **空间复杂度**：O(n * k)，哈希表存储所有字符串的分组信息。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/43-group-anagrams-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="字母异位词分组 - 交互演示">
</iframe>

## Go 代码实现

```go
import "sort"

func groupAnagrams(strs []string) [][]string {
    // 哈希表：排序后的字符串 -> 原始字符串列表
    groups := make(map[string][]string)

    for _, s := range strs {
        // 将字符串转为字节数组并排序，得到"标准形式"的 key
        b := []byte(s)
        sort.Slice(b, func(i, j int) bool {
            return b[i] < b[j]
        })
        key := string(b)

        // 将原始字符串加入对应的分组
        groups[key] = append(groups[key], s)
    }

    // 将所有分组的 value 收集到结果中
    result := make([][]string, 0, len(groups))
    for _, v := range groups {
        result = append(result, v)
    }

    return result
}
```
