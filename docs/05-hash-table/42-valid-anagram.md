# 42. 有效的字母异位词

## 题目描述

给定两个字符串 `s` 和 `t`，编写一个函数来判断 `t` 是否是 `s` 的字母异位词。

**注意**：若 `s` 和 `t` 中每个字符出现的次数都相同，则称 `s` 和 `t` 互为字母异位词。

**示例 1：**

```
输入：s = "anagram", t = "nagaram"
输出：true
```

**示例 2：**

```
输入：s = "rat", t = "car"
输出：false
```

**约束条件：**

- `1 <= s.length, t.length <= 5 * 10^4`
- `s` 和 `t` 仅包含小写字母

**进阶**：如果输入字符串包含 Unicode 字符怎么办？你能否调整你的解法来应对这种情况？

## 题目分析

### 算法思路

字母异位词的核心要求是两个字符串中每个字母的出现频次完全相同。

**方法一：数组计数（适用于小写字母）**

由于只包含 26 个小写字母，使用长度为 26 的整型数组作为计数器。遍历 `s` 时频次加 1，遍历 `t` 时频次减 1。遍历结束后，数组中所有元素都应为 0。

**方法二：排序法**

将两个字符串排序后比较是否相等。时间复杂度为 O(n log n)，不如计数法。

**进阶题解（Unicode 字符）**：

如果输入包含 Unicode 字符（如中文），则不能使用固定大小的数组。应使用 `map[rune]int` 来统计字符频次。思路相同，只是数据结构不同。

### 复杂度分析

- **时间复杂度**：O(n)，其中 n 是字符串长度。需要遍历两个字符串各一次。
- **空间复杂度**：O(1)，使用固定大小数组（26）。若使用 map 处理 Unicode，空间为 O(k)，k 为不同字符数。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/42-valid-anagram-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="有效的字母异位词 - 交互演示">
</iframe>

## Go 代码实现

```go
func isAnagram(s string, t string) bool {
    // 长度不同一定不是异位词
    if len(s) != len(t) {
        return false
    }

    // 只有小写字母，用长度为 26 的数组
    cnt := [26]int{}

    // s 中字符频次 +1，t 中字符频次 -1
    for i := 0; i < len(s); i++ {
        cnt[s[i]-'a']++
        cnt[t[i]-'a']--
    }

    // 检查所有频次是否都为 0
    for _, v := range cnt {
        if v != 0 {
            return false
        }
    }

    return true
}
```
