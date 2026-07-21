# 25. 验证回文串

## 题目描述

如果在将所有大写字符转换为小写字符、并移除所有非字母数字字符之后，短语正着读和反着读都一样，则可以认为该短语是一个 **回文串**。

字母和数字都属于字母数字字符。

给你一个字符串 `s`，如果它是 **回文串**，返回 `true`；否则，返回 `false`。

**示例 1：**

```
输入: s = "A man, a plan, a canal: Panama"
输出：true
解释："amanaplanacanalpanama" 是回文串。
```

**示例 2：**

```
输入：s = "race a car"
输出：false
解释："raceacar" 不是回文串。
```

**示例 3：**

```
输入：s = " "
输出：true
解释：在移除非字母数字字符之后，s 是一个空字符串 ""。
由于空字符串正着反着读都一样，所以是回文串。
```

**约束条件：**

- `1 <= s.length <= 2 * 10^5`
- `s` 仅由可打印的 ASCII 字符组成

## 题目分析

**算法思路：** 使用对撞双指针。`left` 指针从开头向右移动，`right` 指针从末尾向左移动。遇到非字母数字字符则跳过。每次比较两个指针指向的字符（统一转为小写），如果不相等则不是回文串。

**时间复杂度：** O(n)，每个字符最多被访问一次。

**空间复杂度：** O(1)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/25-valid-palindrome-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="验证回文串 - 交互演示">
</iframe>

## Go 代码实现

```go
import "unicode"

// isPalindrome 判断字符串是否为回文串（忽略大小写和非字母数字字符）
// 使用对撞双指针
func isPalindrome(s string) bool {
    // 转换为 rune 数组以正确处理 Unicode 字符
    runes := []rune(s)
    left, right := 0, len(runes)-1

    for left < right {
        // 左指针跳过非字母数字字符
        for left < right && !isAlphanumeric(runes[left]) {
            left++
        }
        // 右指针跳过非字母数字字符
        for left < right && !isAlphanumeric(runes[right]) {
            right--
        }

        // 比较字符（转为小写）
        if unicode.ToLower(runes[left]) != unicode.ToLower(runes[right]) {
            return false
        }

        left++
        right--
    }

    return true
}

// isAlphanumeric 判断字符是否为字母或数字
func isAlphanumeric(ch rune) bool {
    return unicode.IsLetter(ch) || unicode.IsDigit(ch)
}
```
