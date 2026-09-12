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

### 算法思路

**核心思路**：每个数字对应一个字符集合，最终答案是从每个数字的集合中**各选一个字符**、按原顺序拼成的字符串（笛卡尔积）。因为第 `i` 位的选择只影响第 `i+1` 位之后的分支，天然适合按位回溯。

**算法步骤：**

1. 建立数字到字母串的映射表（2→`abc`，…，9→`wxyz`）。
2. 分配一个长度等于 `digits` 的定长缓冲区 `path`，用下标 `index` 表示当前正在决定第几位。
3. `backtrack(index)`：
   - `index == len(digits)` 时说明每一位都已确定，把 `path` 转成字符串收集，返回；
   - 否则取出 `digits[index]` 对应的字母串 `letters`，对其中每个字母写 `path[index] = letters[i]`，再递归 `backtrack(index+1)`。
4. 输入为空串时直接返回空切片。

**关于「撤销选择」**：`path` 是定长数组，第 `i` 位在第 `i` 层的循环里被反复覆盖，递归返回后不需要显式撤销——下一次循环会写入新值；收集结果时用 `string(path)` 生成新字符串，与 `path` 不共享底层存储。

### 为什么正确

- **枚举完备**：第 `i` 位的所有可能取值都在 `letters` 中被逐个尝试（数学归纳：第 0 位枚举完整，且当第 `i` 位取定后，第 `i+1..` 位由递归枚举完整），因此所有组合都被生成。
- **无重复**：每个组合由「每个下标各选一个字母」唯一确定，而递归过程中每个下标恰好被赋值一次，不同的赋值序列必然对应不同的字符串，不会重复。
- **长度约束**：只有 `index` 走到 `len(digits)` 才收集，所以每个结果的长度都恰好等于输入长度。

### 复杂度分析

- **时间复杂度：** O(3^N × 4^M)，N 为对应 3 个字母的数字个数（2、3、4、5、6、8），M 为对应 4 个字母的数字个数（7、9）。每个叶子节点对应一个结果，生成字符串还需 O(len(digits)) 的拷贝，因此严格地说是 O(结果数 × len(digits))；`digits` 最长只有 4，实际规模极小。
- **空间复杂度：** O(len(digits))，即递归栈深度与定长缓冲区（不算存放答案所需的空间）。

### 易错点 / 边界情况

- **空输入必须返回空切片而不是 nil**：`digits = ""` 时如果忘记提前返回，会收集出一个空字符串 `[""]`，与期望的 `[]` 不符；Go 里 `[]string{}` 与 `nil` 在 `reflect.DeepEqual` 下不同，LeetCode 判题按 `[]` 比较。
- **缓冲区写法**：使用 `make([]byte, len(digits))` + 下标赋值时，收集结果必须 `string(path)` 复制一份；写成 `append` 收集切片会因共享底层数组而互相污染。
- **映射表可以用数组替代 map**：用 `[10]string` 按数字下标访问更快，但要注意 `'0'`、`'1'` 不产生字母。
- **结果顺序**：本题允许任意顺序，但代码输出顺序由 `letters` 的字符顺序决定，示例中的顺序与之一致。
- **`digits` 只含 `'2'`~`'9'`**，不必处理 `'0'`/`'1'`；若扩展支持，需要在映射表中留空。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/101-letter-combinations-of-a-phone-number-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
