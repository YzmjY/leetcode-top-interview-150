# 91. 克隆图

## 题目描述

给你无向**[连通](https://baike.baidu.com/item/连通图/6460995?fr=aladdin)**图中一个节点的引用，请你返回该图的**[深拷贝](https://baike.baidu.com/item/深拷贝/22785317?fr=aladdin)**（克隆）。

图中的每个节点都包含它的值 `val`（`int`）和其邻居的列表（`list[Node]`）。

```
type Node struct {
    Val       int
    Neighbors []*Node
}
```

**示例 1：**

```
输入：adjList = [[2,4],[1,3],[2,4],[1,3]]
输出：[[2,4],[1,3],[2,4],[1,3]]
解释：图中有 4 个节点。
节点 1 的值是 1，它有两个邻居：节点 2 和 4 。
节点 2 的值是 2，它有两个邻居：节点 1 和 3 。
节点 3 的值是 3，它有两个邻居：节点 2 和 4 。
节点 4 的值是 4，它有两个邻居：节点 1 和 3 。
```

**示例 2：**

```
输入：adjList = [[]]
输出：[[]]
解释：输入包含一个空列表。该图仅仅只有一个值为 1 的节点，它没有任何邻居。
```

**约束条件：**

- 图中的节点数在范围 `[0, 100]` 内
- `1 <= Node.val <= 100`
- `Node.val` 的值各不相同，每个节点的值 `Node.val` 各不相同
- 无向图是一个简单图，这意味着图中没有重复的边，也没有自环

## 题目分析

本题的核心是对图进行深拷贝。由于图可能存在环，需要用一个哈希表记录已经克隆过的节点，避免重复创建和无限递归。

**算法思路（DFS）：**

1. 使用哈希表 `visited` 存储已克隆的节点（原节点 -> 克隆节点映射）
2. 从给定节点开始 DFS：
   - 如果当前节点已克隆，直接返回克隆节点
   - 否则创建新节点，加入哈希表
   - 递归克隆所有邻居，并添加到新节点的邻居列表中
3. 返回克隆的起始节点

**BFS 同样可行：** 使用队列逐层克隆，每次取出节点，克隆其所有邻居。

**时间复杂度：** O(N + E)，N 为节点数，E 为边数，每个节点和边只被访问一次。

**空间复杂度：** O(N)，哈希表存储所有节点的映射。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/91-clone-graph-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
  title="克隆图 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// Node 图的节点定义
type Node struct {
    Val       int
    Neighbors []*Node
}

// cloneGraph 克隆图（DFS 实现）
func cloneGraph(node *Node) *Node {
    if node == nil {
        return nil
    }
    visited := make(map[*Node]*Node)

    var dfs func(n *Node) *Node
    dfs = func(n *Node) *Node {
        if clone, ok := visited[n]; ok {
            return clone
        }
        clone := &Node{Val: n.Val}
        visited[n] = clone
        for _, neighbor := range n.Neighbors {
            clone.Neighbors = append(clone.Neighbors, dfs(neighbor))
        }
        return clone
    }

    return dfs(node)
}

// cloneGraphBFS 克隆图（BFS 实现）
func cloneGraphBFS(node *Node) *Node {
    if node == nil {
        return nil
    }
    visited := make(map[*Node]*Node)
    queue := []*Node{node}
    visited[node] = &Node{Val: node.Val}

    for len(queue) > 0 {
        cur := queue[0]
        queue = queue[1:]
        for _, neighbor := range cur.Neighbors {
            if _, ok := visited[neighbor]; !ok {
                visited[neighbor] = &Node{Val: neighbor.Val}
                queue = append(queue, neighbor)
            }
            visited[cur].Neighbors = append(visited[cur].Neighbors, visited[neighbor])
        }
    }
    return visited[node]
}

func main() {
    // 构建测试图: 1 -- 2
    //              |    |
    //              4 -- 3
    n1 := &Node{Val: 1}
    n2 := &Node{Val: 2}
    n3 := &Node{Val: 3}
    n4 := &Node{Val: 4}
    n1.Neighbors = []*Node{n2, n4}
    n2.Neighbors = []*Node{n1, n3}
    n3.Neighbors = []*Node{n2, n4}
    n4.Neighbors = []*Node{n1, n3}

    clone := cloneGraph(n1)
    fmt.Printf("Clone root value: %d, neighbors count: %d\n", clone.Val, len(clone.Neighbors))
}
```
