# 39. 赎金信

## 题目描述

给你两个字符串：`ransomNote` 和 `magazine`，判断 `ransomNote` 能不能由 `magazine` 里面的字符构成。

如果可以，返回 `true`；否则返回 `false`。

`magazine` 中的每个字符只能在 `ransomNote` 中使用一次。

**示例 1：**

```
输入：ransomNote = "a", magazine = "b"
输出：false
```

**示例 2：**

```
输入：ransomNote = "aa", magazine = "ab"
输出：false
```

**示例 3：**

```
输入：ransomNote = "aa", magazine = "aab"
输出：true
```

**约束条件：**

- `1 <= ransomNote.length, magazine.length <= 10^5`
- `ransomNote` 和 `magazine` 由小写英文字母组成

## 题目分析

### 算法思路

本题的本质是判断 `magazine` 中每个字符的出现次数是否都大于等于 `ransomNote` 中对应字符的出现次数。

由于两个字符串只包含小写英文字母（共 26 个），可以使用一个长度为 26 的整型数组作为哈希表，统计 `magazine` 中每个字符的频次，然后遍历 `ransomNote`，每遇到一个字符就将对应的频次减 1。如果某个字符的频次被减为负数，说明 `magazine` 中该字符不够用，返回 `false`。

这是一种典型的"字符频率统计"问题，使用数组而非 `map` 可以提升效率，因为数组的下标计算是 O(1) 且没有哈希碰撞的额外开销。

### 算法步骤

1. 建立长度为 26 的计数数组 `cnt`，下标由字符减 `'a'` 得到。
2. 遍历 `magazine`，对每个字符执行 `cnt[c-'a']++`，得到每种字符的可用数量。
3. 遍历 `ransomNote`，对每个字符执行 `cnt[c-'a']--`；一旦某次减完后为负数，说明该字符的需求量超过了供给量，立即返回 `false`。
4. 两次遍历都结束仍未出现负数，返回 `true`。

### 为什么正确

「`magazine` 中每个字符只能用一次」等价于：对每个字符 `c`，`magazine` 中 `c` 的个数必须不少于 `ransomNote` 中 `c` 的个数。遍历完 `magazine` 后，`cnt` 恰好是各字符的可用数量；遍历 `ransomNote` 相当于逐个「取用」字符，负数意味着某字符被取用的次数超过了可用量，此时无论怎样分配字符都无法构成，返回 `false` 正确。反之，若从不出现负数，说明每种字符都够用，由于字符之间互不干扰，直接按顺序取用即可构成 `ransomNote`，返回 `true` 也正确。

### 复杂度分析

- **时间复杂度**：O(n + m)，其中 n 是 `ransomNote` 的长度，m 是 `magazine` 的长度。需要分别遍历两个字符串各一次。
- **空间复杂度**：O(1)，只使用了一个固定大小（26）的数组。

### 易错点 / 边界情况

- 判断必须放在减完之后，且判据是 `cnt[idx] < 0`；写成 `cnt[idx] == 0` 会把「刚好用完」误判为失败。
- `ransomNote` 比 `magazine` 长时一定返回 `false`，但无需特判，计数过程自然会出现负数。
- 题目保证只含小写字母，因此 `c - 'a'` 落在 `0-25`；若输入含其它字符会越界 panic。
- 空串虽是约束之外的情况，代码也能正确处理：空 `ransomNote` 返回 `true`，`magazine` 为空而非空 `ransomNote` 返回 `false`。
- 用数组而不是 `map[byte]int`；数组下标运算是 O(1) 且没有哈希开销，在 26 个字母的固定字符集下更优。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/39-ransom-note-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="赎金信 - 交互演示">
</iframe>

## Go 代码实现

```go
func canConstruct(ransomNote string, magazine string) bool {
    // 只有小写字母，用一个长度为 26 的数组记录 magazine 中每个字符的频次
    cnt := [26]int{}

    // 统计 magazine 中每个字符的出现次数
    for i := 0; i < len(magazine); i++ {
        cnt[magazine[i]-'a']++
    }

    // 遍历 ransomNote，消耗 magazine 中的字符
    for i := 0; i < len(ransomNote); i++ {
        idx := ransomNote[i] - 'a'
        cnt[idx]--
        // 如果某个字符不够用了，返回 false
        if cnt[idx] < 0 {
            return false
        }
    }

    return true
}
```
