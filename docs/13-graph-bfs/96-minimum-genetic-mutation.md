# 96. 最小基因变化

## 题目描述

基因序列可以表示为一条由 8 个字符组成的字符串，其中每个字符都是 `'A'`、`'C'`、`'G'` 和 `'T'` 之一。

假设我们需要调查从基因序列 `start` 变为 `end` 所发生的基因变化。一次基因变化就意味着这个基因序列中的一个字符发生了变化。

例如，`"AACCGGTT" --> "AACCGGTA"` 就是一次基因变化。

另有一个基因库 `bank` 记录了所有有效的基因变化，只有基因库中的基因序列才是有效的。

请你找出并返回使 `start` 变化为 `end` 所需的最少变化次数。如果无法完成此基因变化，返回 `-1`。

**示例 1：**

```
输入：start = "AACCGGTT", end = "AACCGGTA", bank = ["AACCGGTA"]
输出：1
```

**示例 2：**

```
输入：start = "AACCGGTT", end = "AAACGGTA",
     bank = ["AACCGGTA","AACCGCTA","AAACGGTA"]
输出：2
```

**示例 3：**

```
输入：start = "AAAAACCC", end = "AACCCCCC",
     bank = ["AAAACCCC","AAACCCCC","AACCCCCC"]
输出：3
```

**约束条件：**

- `start.length == 8`
- `end.length == 8`
- `0 <= bank.length <= 10`
- `bank[i].length == 8`
- `start`、`end` 和 `bank[i]` 仅由 `['A', 'C', 'G', 'T']` 组成

## 题目分析

本题将基因序列视为图中的节点，如果两个序列相差恰好一个字符，则它们之间存在一条边。目标是从 `start` 到 `end` 的最短路径长度，使用 BFS 解决。

**基础 BFS 思路：**

1. 将 `bank` 中所有基因放入哈希集合，便于快速判断合法性
2. 从 `start` 开始 BFS，对当前基因的每个位置尝试 4 种可能的字符变化
3. 如果变化后的基因在 bank 中且未被访问过，则加入队列
4. 到达 `end` 时返回步数

**双向 BFS 优化：**

同时从 `start` 和 `end` 出发，每次选择较小的集合进行扩展，当两个搜索相遇时结束。搜索范围减半。

**时间复杂度：** O(N * L * 4)，N 为 bank 大小，L 为基因长度（8）。双向 BFS 可将实际搜索量减半。

**空间复杂度：** O(N)，visited 集合和队列。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/96-minimum-genetic-mutation-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="最小基因变化 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// minMutation 基础 BFS 解法
func minMutation(start string, end string, bank []string) int {
    bankSet := make(map[string]bool)
    for _, g := range bank {
        bankSet[g] = true
    }
    if !bankSet[end] {
        return -1
    }

    genes := []byte{'A', 'C', 'G', 'T'}
    visited := make(map[string]bool)
    queue := []string{start}
    visited[start] = true
    steps := 0

    for len(queue) > 0 {
        size := len(queue)
        for i := 0; i < size; i++ {
            cur := queue[0]
            queue = queue[1:]

            if cur == end {
                return steps
            }

            // 尝试每个位置上的每种变化
            curBytes := []byte(cur)
            for j := 0; j < 8; j++ {
                original := curBytes[j]
                for _, g := range genes {
                    if g == original {
                        continue
                    }
                    curBytes[j] = g
                    next := string(curBytes)
                    if bankSet[next] && !visited[next] {
                        visited[next] = true
                        queue = append(queue, next)
                    }
                }
                curBytes[j] = original // 恢复
            }
        }
        steps++
    }
    return -1
}

// minMutationBidirectional 双向 BFS 优化
func minMutationBidirectional(start string, end string, bank []string) int {
    bankSet := make(map[string]bool)
    for _, g := range bank {
        bankSet[g] = true
    }
    if !bankSet[end] {
        return -1
    }

    genes := []byte{'A', 'C', 'G', 'T'}
    beginSet := map[string]bool{start: true}
    endSet := map[string]bool{end: true}
    visited := map[string]bool{start: true, end: true}
    steps := 0

    for len(beginSet) > 0 && len(endSet) > 0 {
        // 始终扩展较小的集合
        if len(beginSet) > len(endSet) {
            beginSet, endSet = endSet, beginSet
        }

        nextSet := make(map[string]bool)
        for cur := range beginSet {
            curBytes := []byte(cur)
            for j := 0; j < 8; j++ {
                original := curBytes[j]
                for _, g := range genes {
                    if g == original {
                        continue
                    }
                    curBytes[j] = g
                    next := string(curBytes)
                    if endSet[next] {
                        return steps + 1
                    }
                    if bankSet[next] && !visited[next] {
                        visited[next] = true
                        nextSet[next] = true
                    }
                }
                curBytes[j] = original
            }
        }
        beginSet = nextSet
        steps++
    }
    return -1
}

func main() {
    bank := []string{"AACCGGTA", "AACCGCTA", "AAACGGTA"}
    fmt.Println(minMutation("AACCGGTT", "AAACGGTA", bank))              // 2
    fmt.Println(minMutationBidirectional("AACCGGTT", "AAACGGTA", bank)) // 2
}
```
