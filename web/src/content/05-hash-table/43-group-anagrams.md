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

### 算法步骤

1. 建立哈希表 `groups map[string][]string`。
2. 遍历 `strs` 中的每个字符串 `s`：
   - 把 `s` 转成 `[]byte` 并原地排序，得到规范形式 `key`；
   - 执行 `groups[key] = append(groups[key], s)`（注意追加的是**原字符串**）。
3. 遍历哈希表，把所有 value 收集成 `[][]string` 返回。

### 为什么正确

两个字符串互为字母异位词，当且仅当它们各字符的出现次数完全相同，而当且仅当排序后的字节序列完全相同。排序把每个「多重集」映射到唯一的、有序的规范表示，因此同一组异位词得到相同的 key，不同组得到不同的 key，不会互相污染。哈希表按 key 聚合，正好把每个异位词类收集到一起；所有原始字符串都恰好被处理一次，所以输出是输入的一个划分，不丢不重。

### 复杂度分析

- **时间复杂度**：O(n * k * log k)，其中 n 是字符串数量，k 是字符串的最大长度。每个字符串排序需要 O(k log k)，哈希表插入与其后的遍历是线性的。
- **空间复杂度**：O(n * k)，哈希表与结果存储所有字符串的分组信息。

### 易错点 / 边界情况

- 加入分组的必须是**原字符串** `s`，不能把排序后的 `key` 存进去，否则输出内容全变了。
- 题目允许组与组之间、组内元素以任意顺序返回，判题时会做无序比较，不要在实现里依赖 map 的遍历顺序。
- 空串也是合法元素：空串排序后仍是 `""`，所有空串会归入同一组。
- 排序时先转 `[]byte` 再 `sort.Slice`/`sort.SliceStable`；若直接对字符串排序需要额外的字符切片转换，注意不要原地破坏原字符串（Go 的 `string` 不可变，本身也不会被破坏）。
- 用「字符频次计数拼成 key」也能达到 O(n * k) 的期望复杂度（k 为字符集大小），这里用排序写法更简洁。
- 输入为空（约束之外的情况）时返回空切片即可，代码能自然处理。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/43-group-anagrams-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
