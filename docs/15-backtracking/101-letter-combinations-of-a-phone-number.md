# 101. 电话号码的字母组合

## 题目描述

给定一个仅包含数字 `2-9` 的字符串，返回所有它能表示的字母组合。答案可以按**任意顺序**返回。

给出数字到字母的映射如下（与电话按键相同）。注意 1 不对应任何字母。

```
2: "abc"
3: "def"
4: "ghi"
5: "jkl"
6: "mno"
7: "pqrs"
8: "tuv"
9: "wxyz"
```

**示例 1：**

```
输入：digits = "23"
输出：["ad","ae","af","bd","be","bf","cd","ce","cf"]
```

**示例 2：**

```
输入：digits = ""
输出：[]
```

**示例 3：**

```
输入：digits = "2"
输出：["a","b","c"]
```

**约束条件：**

- `0 <= digits.length <= 4`
- `digits[i]` 是范围 `['2', '9']` 的一个数字

## 题目分析

本题是多集合组合问题。每个数字对应一个字符集合，需要从每个集合中各选一个字符组成最终字符串。

**算法思路（回溯）：**

1. 建立数字到字母的映射表
2. 从第一个数字开始，递归地对每个数字的每个字母做选择
3. 当路径长度等于 digits 长度时，收集结果

由于 digits 最长只有 4，回溯空间非常小。

**时间复杂度：** O(3^N * 4^M)，N 为对应 3 个字母的数字个数（2,3,4,5,6,8），M 为对应 4 个字母的数字个数（7,9）。

**空间复杂度：** O(N)，递归栈深度。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/101-letter-combinations-of-a-phone-number-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
  title="电话号码的字母组合 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// letterCombinations 电话号码的字母组合
func letterCombinations(digits string) []string {
    if len(digits) == 0 {
        return []string{}
    }

    phoneMap := map[byte]string{
        '2': "abc",
        '3': "def",
        '4': "ghi",
        '5': "jkl",
        '6': "mno",
        '7': "pqrs",
        '8': "tuv",
        '9': "wxyz",
    }

    result := []string{}
    path := make([]byte, len(digits))

    var backtrack func(index int)
    backtrack = func(index int) {
        if index == len(digits) {
            result = append(result, string(path))
            return
        }
        letters := phoneMap[digits[index]]
        for i := 0; i < len(letters); i++ {
            path[index] = letters[i]
            backtrack(index + 1)
            // path 是定长数组，通过 index 覆盖，无需显式撤销
        }
    }

    backtrack(0)
    return result
}

func main() {
    fmt.Println(letterCombinations("23")) // ["ad","ae","af","bd","be","bf","cd","ce","cf"]
    fmt.Println(letterCombinations(""))   // []
    fmt.Println(letterCombinations("2"))  // ["a","b","c"]
}
```
