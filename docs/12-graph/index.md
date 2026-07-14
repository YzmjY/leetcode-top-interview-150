# 第12章：图 (Graph)

## 概述

图是一种非线性数据结构，由**顶点（Vertex）**和**边（Edge）**组成。图可以表示实体之间的复杂关系，广泛应用于社交网络、地图导航、网络拓扑等场景。

## 图的表示

### 邻接矩阵

使用二维数组 `adj[i][j]` 表示顶点 i 到顶点 j 是否存在边。

- 优点：可以在 O(1) 时间内判断两个顶点是否有边
- 缺点：空间复杂度 O(V^2)，稀疏图浪费空间

```go
// 邻接矩阵示例
adj := make([][]int, n)
for i := range adj {
    adj[i] = make([]int, n)
}
// adj[i][j] = 1 表示存在边 i -> j
```

### 邻接表

为每个顶点维护一个链表/切片，存储其所有邻居。

- 优点：空间复杂度 O(V+E)，适合稀疏图
- 缺点：判断两个顶点是否相连需要 O(degree) 时间

```go
// 邻接表示例
graph := make([][]int, n)
// graph[i] 中存储顶点 i 的所有邻居
graph[u] = append(graph[u], v)
```

## 图的遍历

### 深度优先搜索（DFS）

从起始顶点出发，沿着一条路径深入到底，再回溯探索其他分支。通常使用递归或显式栈实现。

```go
func dfs(graph [][]int, visited []bool, u int) {
    visited[u] = true
    for _, v := range graph[u] {
        if !visited[v] {
            dfs(graph, visited, v)
        }
    }
}
```

应用场景：连通分量计数、环检测、拓扑排序（逆向）

### 广度优先搜索（BFS）

从起始顶点出发，逐层向外扩展。使用队列实现。

```go
func bfs(graph [][]int, start int) {
    queue := []int{start}
    visited[start] = true
    for len(queue) > 0 {
        u := queue[0]
        queue = queue[1:]
        for _, v := range graph[u] {
            if !visited[v] {
                visited[v] = true
                queue = append(queue, v)
            }
        }
    }
}
```

应用场景：最短路径（无权图）、层次遍历

## 拓扑排序

对有向无环图（DAG）进行线性排序，使得每条有向边 u->v 中 u 都排在 v 之前。

两种实现方法：
1. **DFS 后序遍历+反转**：对图进行 DFS，将完成访问的顶点压入栈，最后反转栈即为拓扑序
2. **Kahn 算法（BFS 入度法）**：不断将入度为 0 的顶点加入队列，移除其出边，重复直到所有顶点被处理

```go
// Kahn 算法模板
func topologicalSort(n int, edges [][]int) []int {
    graph := make([][]int, n)
    indegree := make([]int, n)
    for _, e := range edges {
        graph[e[0]] = append(graph[e[0]], e[1])
        indegree[e[1]]++
    }
    queue := []int{}
    for i := 0; i < n; i++ {
        if indegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    result := []int{}
    for len(queue) > 0 {
        u := queue[0]
        queue = queue[1:]
        result = append(result, u)
        for _, v := range graph[u] {
            indegree[v]--
            if indegree[v] == 0 {
                queue = append(queue, v)
            }
        }
    }
    return result
}
```

## 并查集（Union-Find / DSU）

一种用于处理不相交集合合并与查询的数据结构。支持近乎 O(1) 的合并与查找操作。

核心操作：
- **Find(x)**：查找 x 所属集合的代表元素（路径压缩优化）
- **Union(x, y)**：合并 x 和 y 所在的集合（按秩合并优化）

```go
type UnionFind struct {
    parent []int
    rank   []int
}

func NewUnionFind(n int) *UnionFind {
    parent := make([]int, n)
    rank := make([]int, n)
    for i := range parent {
        parent[i] = i
    }
    return &UnionFind{parent, rank}
}

func (uf *UnionFind) Find(x int) int {
    if uf.parent[x] != x {
        uf.parent[x] = uf.Find(uf.parent[x]) // 路径压缩
    }
    return uf.parent[x]
}

func (uf *UnionFind) Union(x, y int) {
    px, py := uf.Find(x), uf.Find(y)
    if px == py {
        return
    }
    if uf.rank[px] < uf.rank[py] {
        uf.parent[px] = py
    } else if uf.rank[px] > uf.rank[py] {
        uf.parent[py] = px
    } else {
        uf.parent[py] = px
        uf.rank[px]++
    }
}
```

应用场景：连通分量、Kruskal 最小生成树、动态连通性判断

## 本章题目

| 题号 | 题目 | 核心知识点 |
|------|------|-----------|
| 89 | 岛屿数量 | DFS/BFS 遍历网格图 |
| 90 | 被围绕的区域 | 边界 DFS，逆向思维 |
| 91 | 克隆图 | 图的深拷贝，哈希表映射 |
| 92 | 除法求值 | 带权并查集 / Floyd-Warshall / BFS |
| 93 | 课程表 | 拓扑排序，环检测 |
| 94 | 课程表 II | 拓扑排序输出序列 |
