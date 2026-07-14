# 第13章：图的广度优先搜索 (Graph BFS)

## 概述

广度优先搜索（BFS）是图遍历的基本算法之一，它从起始节点出发，逐层向外扩展访问。BFS 的核心特征在于**按距离分层**，因此它在无权图中天然适用于求解最短路径问题。

## BFS 基本模板

```go
func bfs(start State) int {
    queue := []State{start}
    visited := make(map[State]bool)
    visited[start] = true
    step := 0

    for len(queue) > 0 {
        size := len(queue) // 当前层的节点数
        for i := 0; i < size; i++ {
            cur := queue[0]
            queue = queue[1:]

            if isTarget(cur) {
                return step
            }

            for _, next := range getNeighbors(cur) {
                if !visited[next] {
                    visited[next] = true
                    queue = append(queue, next)
                }
            }
        }
        step++ // 层数+1
    }
    return -1
}
```

## BFS 在特殊图结构中的应用

### 网格图 BFS

在网格图中，BFS 常用于：
- 迷宫最短路径
- 岛屿面积计算
- 蛇梯棋（将棋盘映射为线性序列）

```go
dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
queue := [][2]int{{startX, startY}}
visited[startX][startY] = true
```

### 状态转换图 BFS

某些问题中，"图"的节点不是显式给出的，而是抽象状态。状态之间的转换规则定义了"边"。

典型场景：
- 单词接龙：每个单词是一个节点，只差一个字母的单词之间有边
- 最小基因变化：每个基因序列是一个节点，一次突变对应一条边

## BFS 的关键优化

1. **双向 BFS**：同时从起点和终点进行 BFS，当两个搜索相遇时结束。可将搜索空间从 O(b^d) 降至 O(b^(d/2))
2. **A* / 启发式搜索**：使用优先队列，每次扩展预估代价最小的节点
3. **状态压缩**：用整数/位掩码表示状态，减少内存占用
4. **visited 集合优化**：用数组替代 map，或将已访问节点直接标记在输入数据上

## 本章题目

| 题号 | 题目 | 核心知识点 |
|------|------|-----------|
| 95 | 蛇梯棋 | 网格图到线性序列的映射，BFS 最短路径 |
| 96 | 最小基因变化 | 状态转换 BFS，双向 BFS |
| 97 | 单词接龙 | 状态转换 BFS，双向 BFS，模式匹配优化 |
