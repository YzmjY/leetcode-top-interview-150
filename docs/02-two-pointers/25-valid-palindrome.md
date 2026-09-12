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

**算法思路：** 先看朴素做法：把所有字母数字字符筛出来、统一转成小写，再判断整理后的串是否回文。这样要多一份 O(n) 空间，而且得多扫一遍。关键观察是——回文只要求「对称位置上的字母数字字符相等」，并不需要真的把字符搬出来。于是用两个指针从两端向中间对撞：遇到非字母数字字符就跳过，只比较两侧第一对字母数字字符，一旦不等即可结束。

**算法步骤：**

1. 把 `s` 转成 `[]rune`，`left = 0`，`right = len(runes) - 1`。
2. 当 `left < right` 时重复：
   - `left` 向右跳过所有非字母数字字符；
   - `right` 向左跳过所有非字母数字字符；
   - 比较两个字符（用 `unicode.ToLower` 统一大小写），不同则返回 `false`；
   - 相同则 `left++`、`right--`，继续下一对。
3. 循环正常结束说明没有发现不匹配，返回 `true`。

**不变量：** 每轮循环开始时，`[0, left)` 与 `(right, n-1]` 中的字母数字字符已经两两配对且相等；循环体只处理当前这一对。

**为什么正确：**

- 比较的是两侧第一对字母数字字符，恰好对应「移除非字母数字字符后」对称位置上的字符，跳过其余字符不改变相对顺序；
- 若某对字符不相等，则整理后的串在对称位置上也不等，一定不是回文，返回 `false` 不会漏解；
- 若指针相遇或交错（`left >= right`）仍未出错，说明所有对称位置都相等，按定义应为回文。

**时间复杂度：** O(n)。`left` 单调增、`right` 单调减，两者移动总次数不超过 n，每个字符最多被访问一次。

**空间复杂度：** O(n)。主要开销来自 `[]rune(s)` 这份字符副本，其余只有常数个变量。（题目约束 `s` 仅含可打印 ASCII，若改用字节下标比较可以省掉副本、做到 O(1) 额外空间；这里保留 rune 写法是为了对含多字节字符的输入同样正确。）

**易错点：**

- 内层跳过的循环条件必须同时写 `left < right`，否则当 `s` 全是非字母数字字符（如 `".,"`）时指针会越界。
- 判断「字母数字」要用 `unicode.IsLetter` 或 `unicode.IsDigit`，不要只写 `'a' <= ch && ch <= 'z'` 而漏掉大写字母和数字。
- 空串或整理后为空（如 `" "`）应为 `true`：代码中 `right = -1`，循环不执行，自然返回 `true`。
- `len(s)` 是字节数，`[]rune(s)` 的长度是字符数，两者不能混用。


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
