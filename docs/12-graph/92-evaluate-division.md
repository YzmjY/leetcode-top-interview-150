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

本题本质上是**加权有向图上的路径查询**问题。把每个变量看成图中的一个节点，等式 `a/b = v` 就对应两条有向边：`a -> b` 的权重为 `v`，`b -> a` 的权重为 `1/v`。那么查询 `a/c` 就等价于求从 a 到 c 的路径上所有边权的**乘积**：路径 `a -> x -> c` 给出 `(a/x) * (x/c) = a/c`。如果两个变量之间不存在路径（不在同一连通分量），或者查询里出现了从未在任何等式中出现过的变量，答案就是 `-1.0`。

**方法一：Floyd-Warshall（预计算所有点对）**

变量总数最多 40 个，规模很小。把比值填进二维矩阵 `m[i][j]`（无边时置 `-1.0`，对角线置 1.0），用 Floyd 三重循环以 `m[i][j] = m[i][k] * m[k][j]` 松弛，预计算出任意两点间的比值（多个路径时比值必然一致，因为等式的传递关系是确定的）。查询 O(1) 查表。代价是 O(V^3) 预处理。

**方法二：带权并查集（代码采用的实现）**

用并查集维护连通性，同时给每个节点存一个权值 `weight[x]`，含义是：

> 在 `find(x)` 完成路径压缩之后，`weight[x] = x / 根节点` 的比值

- **`find(x)`（带路径压缩）**：递归找到根，把 `parent[x]` 直接指向根，同时把权重乘上旧父节点的权重：
  ```
  origin := parent[x]
  parent[x] = find(parent[x])
  weight[x] *= weight[origin]
  ```
  因为 `x/原父 = weight[x]`（旧值），`原父/根 = weight[origin]`（压缩后已更新），两者相乘就是 `x/根`。

- **`union(x, y, val)`**：已知 `x / y = val`。先求出两个根 `rootX = find(x)`、`rootY = find(y)`（此后 `weight[x] = x/rootX`、`weight[y] = y/rootY`）。若两根不同，令 `parent[rootX] = rootY`，则需要确定 `rootX / rootY`。由

  ```
  x/rootY = (x/y) * (y/rootY) = val * weight[y]
  rootX/rootY = (x/rootY) / (x/rootX) = val * weight[y] / weight[x]
  ```

  这正是代码里的 `weight[rootX] = val * weight[y] / weight[x]`。

- **查询 `a/b`**：若任一变量不存在，或 `find(a) != find(b)`（不同连通分量），返回 `-1.0`；否则 `find` 之后 `weight[a] = a/根`、`weight[b] = b/根`，两者相除得到 `a/b`。

**为什么正确：**

带权并查集的核心不变量是：**在执行完 `find(x)` 之后，`weight[x]` 恒等于「节点 x 的值 / x 所在集合的根的值」**，且同一集合内的任意两个变量之间都存在确定的比值。

- 初始时每个节点自成一个集合，`parent[x] = x`、`weight[x] = 1`，不变量成立。
- `find` 的路径压缩保持不变量：如上推导，新 `weight[x] = (x/旧父) * (旧父/根) = x/根`。
- `union` 的赋值保持不变量：父指针改接后，新根 `rootY` 下的每个节点到根的比值都能由「到旧根的比值 × 新根的比值」推出，而 `rootX/rootY` 的取值正是按已知等式解出来的（上面的推导），所以原有等式仍然成立、新等式也成立。
- 由归纳，构建完所有等式后，同集合内任意两点 a、b 有 `weight[a]/weight[b] = (a/根)/(b/根) = a/b`，查询结果正确；不同集合之间没有任何等式把它们联系起来，确实无法确定比值，返回 `-1.0` 也正确。

**复杂度分析：** 并查集方法的时间复杂度 O((N + Q) · α(N))（N 为变量数、Q 为查询数，α 是反阿克曼函数，实际可看作常数）；空间 O(N)。Floyd 方法时间 O(V³) + O(1) 查询，空间 O(V²)。本题 N、Q 均不超过 40，两种方法都绰绰有余。

**易错点 / 边界情况：**

- **查询里的变量可能不存在**。必须用 `idxA, okA := id[q[0]]` 这种带 `ok` 的写法；只做 `id[q[0]]` 会把未出现的变量当成 0 号节点，返回错误答案。
- **`a/a`**：a 已知时答案为 1.0（`weight[a]/weight[a]`）；a 未知时仍是 -1.0。
- **浮点误差**：结果用 `float64` 累乘，路径越长误差越大；题目允许 1e-5 的误差，不要用 `==` 比较浮点结果。
- **`union` 里必须先 `find` 再改 `parent`**：要先用压缩后的权重写出公式，再动父指针，顺序颠倒会用到过期的权重。
- **路径压缩时先保存 `origin := parent[x]`**，再调用 `find(parent[x])`；调用后 `weight[origin]` 会被更新为 `origin/根`，正好是要乘上去的那一项。
- 代码没做按秩/按大小合并，最坏树高可能较大，但配合路径压缩仍然是近乎常数；若追求严格界可加 `rank`。
- 多个等式可能来自不同连通分量，也可能出现「两条路径给出相同比值」的情况（题目保证一致），不必处理矛盾。
- `values[i] > 0`，所以不会出现除以 0。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/92-evaluate-division-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
