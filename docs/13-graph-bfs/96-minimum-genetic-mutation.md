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

### 算法思路

**核心思路**：把每个基因序列看成一个节点，若两个序列恰好相差一个字符就在它们之间连一条边。一次基因变化就是沿一条边走一步，于是「最少变化次数」= 无权图上 `start` 到 `end` 的最短路径长度，用 BFS 求解。

**基础 BFS：**

1. 把 `bank` 中所有基因放进哈希集合 `bankSet`，便于 O(1) 判断某个基因是否合法；`end` 不在集合中时直接返回 -1。
2. `start` 入队并标记已访问（`start` 本身不需要在基因库中）。
3. 每层取出当前队列里的所有基因：对当前基因的 8 个位置，每个位置换成另外 3 个碱基，得到至多 8 × 3 = 24 个候选基因。
4. 候选基因若在 `bankSet` 中且未被访问过，则标记并入队。
5. 出队时若等于 `end`，返回当前步数；队列排空仍未到达则返回 -1。

**双向 BFS 优化：**

同时从 `start` 和 `end` 两侧扩展，每轮选择**规模较小**的一侧扩展一层，一旦某个新基因出现在对面集合里就说明两侧「接上了」。
这样两棵搜索树的深度各减半，实际搜索空间从 O(b^d) 降到 O(b^(d/2))。注意双向 BFS 需要显式处理 `start == end` 的退化情况：此时答案恒为 0，但两个集合从第一轮起就包含同一个基因，双方都找不到「落在对面集合里的新基因」，循环正常结束时会返回 -1。

### 为什么正确

- **建模正确**：一次基因变化恰好改变一个字符，所以「只差一个字符」正是图上的相邻关系，序列变化过程与图中的路径一一对应。
- **BFS 求最短路**：BFS 逐层扩展，第 `d` 层恰好是从 `start` 走 `d` 步可到达的基因集合（对层数归纳）。因此第一次遇到 `end` 的层数就是最短变化次数。
- **合法性由 `bankSet` 保证**：只有出现在基因库中的中间序列才允许入队，这与题面「只有基因库中的基因序列才是有效的」一致；`start` 例外，它允许不在库中。
- **双向 BFS 的相遇判据**：设起点一侧已扩展 `a` 层、终点一侧已扩展 `b` 层，则一个待扩展集合位于「距 `start` 恰好 `a` 步」处，另一个位于「距 `end` 恰好 `b` 步」处，而 `steps` 恰好等于已扩展的层数 `a + b`（每扩展一层加一，初值 0）。从「距 `end` 为 `b` 步」的集合再走一步得到新基因 `w`，则 `w` 距 `end` 为 `b+1` 步；若 `w` 恰好落在「距 `start` 为 `a` 步」的集合里，就存在序列 `start →(a 步)→ w →(b+1 步)→ end`，共 `a + b + 1 = steps + 1` 次变化，所以相遇时返回 `steps + 1` 是正确的。由于每轮只扩展一层且优先扩展较小的一侧，首次相遇仍对应全局最短。

### 复杂度分析

- **时间复杂度：** 基础 BFS 为 O(N × L × 4)，其中 N 为 `bank` 大小（≤ 10），L = 8 是基因长度，每个位置尝试 3 个新字符。双向 BFS 的渐进复杂度相同，但每轮只扩展较小集合，实际扩展的状态数远小于基础 BFS。
- **空间复杂度：** O(N)，`visited` 集合与队列/集合最多保存 N+1 个基因，每个基因长 8。

### 易错点 / 边界情况

- **`end` 不在基因库中必须直接返回 -1**：即使 `start` 与 `end` 只差一位也不能算作有效变化。
- **`start` 不在基因库中是合法的**，不要因为 `bankSet[start] == false` 就提前返回。
- **`start == end` 要返回 0**（在 `end` 已在基因库中的前提下）：基础 BFS 靠「首次出队即比较」自然得到 0，但双向 BFS 两个集合一开始就是同一个基因，会一路扩展到底并返回 -1，必须在建 `beginSet`/`endSet` 之前显式判断（本仓库代码已在双向实现中补上这一分支）。
- **修改字符时要恢复原位**：`curBytes[j] = original` 不能漏，否则同一个基因的后续位置会被污染，生成错误的候选串。
- **步数语义是「边数」**：一次变化算一步，正好对应 BFS 的层数；不要写成「经过的序列个数」。
- **基因库很大时**：N 很小（≤ 10），逐位置枚举 24 个候选即可；如果换成「两两比较 bank 元素是否只差一位」的朴素建图，复杂度会退化为 O(N² × L)，也是可行的但没必要。
- **双向 BFS 的访问标记要集中管理**：`visited` 初始就包含 `start` 和 `end`，防止两侧把对方已经走过的点重新入队导致重复扩展。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/96-minimum-genetic-mutation-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
    // start 与 end 相同，无需任何变化（双向 BFS 的两个集合初始即重合，必须单独处理）
    if start == end {
        return 0
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
