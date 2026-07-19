# 92. 除法求值

## 题目描述

给你一个变量对数组 `equations` 和一个实数值数组 `values` 作为已知条件，其中 `equations[i] = [Ai, Bi]` 和 `values[i]` 共同表示等式 `Ai / Bi = values[i]`。每个 `Ai` 或 `Bi` 是一个表示单个变量的字符串。

另有一些以数组 `queries` 表示的问题，其中 `queries[j] = [Cj, Dj]` 表示第 j 个问题，请你根据已知条件找出 `Cj / Dj = ?` 的结果作为答案。

返回所有问题的答案。如果存在某个无法确定的答案，则用 `-1.0` 替代这个答案。如果问题中出现了给定的已知条件中没有出现的字符串，也需要用 `-1.0` 替代这个答案。

**示例 1：**

```
输入：equations = [["a","b"],["b","c"]], values = [2.0,3.0],
     queries = [["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]]
输出：[6.0, 0.5, -1.0, 1.0, -1.0]
解释：a/b=2.0, b/c=3.0 => a/c=6.0, b/a=0.5, a/a=1.0
```

**示例 2：**

```
输入：equations = [["a","b"],["b","c"],["bc","cd"]], values = [1.5,2.5,5.0],
     queries = [["a","c"],["c","b"],["bc","cd"],["cd","bc"]]
输出：[3.75, 0.4, 5.0, 0.2]
```

**约束条件：**

- `1 <= equations.length <= 20`
- `equations[i].length == 2`
- `1 <= Ai.length, Bi.length <= 5`
- `values.length == equations.length`
- `0.0 < values[i] <= 20.0`
- `1 <= queries.length <= 20`
- `queries[i].length == 2`
- `1 <= Cj.length, Dj.length <= 5`
- `Ai, Bi, Cj, Dj` 由小写英文字母与数字组成

## 题目分析

本题本质上是加权有向图上的路径查询问题。每个变量是图中的一个节点，等式 `a/b = v` 可以抽象为两条有向边：`a->b` 权重为 `v`，`b->a` 权重为 `1/v`。

查询 `a/c` 等价于求图中从 a 到 c 的路径上边权乘积。

**方法一：Floyd-Warshall（预计算所有点对）**

由于题目数据规模很小（变量 <= 40 个），可以先构建邻接矩阵，然后用 Floyd 算法预计算所有点对之间的比值。查询只需 O(1) 查表。

**方法二：带权并查集（Union-Find with weights）**

并查集中维护每个节点到根节点的比值。`find(x)` 返回根节点并压缩路径时同时更新权重。

- 已知 `a/b = v`，设 `rootA = find(a)`, `rootB = find(b)`：
  - `weight[a] / weight[b] = v`（合并时更新）
- 查询 `a/b`：
  - 如果 a 和 b 不在同一集合，返回 -1.0
  - 否则返回 `weight[a] / weight[b]`

**时间复杂度：** O((N+Q) * alpha(N))，带权并查集。Floyd 方法 O(V^3)。

**空间复杂度：** O(N)，存储并查集和权重。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/92-evaluate-division-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="除法求值 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// calcEquation 使用带权并查集求解除法求值
func calcEquation(equations [][]string, values []float64, queries [][]string) []float64 {
    // 给每个变量分配 ID
    id := make(map[string]int)
    for _, eq := range equations {
        if _, ok := id[eq[0]]; !ok {
            id[eq[0]] = len(id)
        }
        if _, ok := id[eq[1]]; !ok {
            id[eq[1]] = len(id)
        }
    }

    n := len(id)
    parent := make([]int, n)
    weight := make([]float64, n)
    for i := 0; i < n; i++ {
        parent[i] = i
        weight[i] = 1.0
    }

    var find func(x int) int
    find = func(x int) int {
        if parent[x] != x {
            origin := parent[x]
            parent[x] = find(parent[x])
            weight[x] *= weight[origin] // 路径压缩时更新权重
        }
        return parent[x]
    }

    union := func(x, y int, val float64) {
        rootX, rootY := find(x), find(y)
        if rootX != rootY {
            parent[rootX] = rootY
            // weight[x] / weight[y] = val
            // => weight[rootX] = val * weight[y] / weight[x]
            weight[rootX] = val * weight[y] / weight[x]
        }
    }

    // 构建并查集
    for i, eq := range equations {
        union(id[eq[0]], id[eq[1]], values[i])
    }

    // 处理查询
    result := make([]float64, len(queries))
    for i, q := range queries {
        idxA, okA := id[q[0]]
        idxB, okB := id[q[1]]
        if !okA || !okB {
            result[i] = -1.0
            continue
        }
        rootA, rootB := find(idxA), find(idxB)
        if rootA != rootB {
            result[i] = -1.0
        } else {
            result[i] = weight[idxA] / weight[idxB]
        }
    }
    return result
}

func main() {
    equations := [][]string{{"a", "b"}, {"b", "c"}}
    values := []float64{2.0, 3.0}
    queries := [][]string{{"a", "c"}, {"b", "a"}, {"a", "e"}, {"a", "a"}, {"x", "x"}}
    fmt.Println(calcEquation(equations, values, queries))
    // 输出: [6 0.5 -1 1 -1]
}
```
