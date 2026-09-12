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

「深拷贝」意味着新图中的**每个节点都是全新的对象**，且新图的邻接关系与原图完全一致——不能复用原图的任何节点指针。图与树的区别在于**可能存在环**：如果照着邻接表一路递归下去，会沿着环绕回来，既可能无限递归，也可能把同一个节点克隆出多份。因此除了递归本身，还必须解决两个问题：

1. **去重**：同一个原节点只能对应一个克隆节点。答案是用哈希表 `visited: map[*Node]*Node` 记住「原节点 -> 它的克隆」。
2. **成环**：把节点登记进哈希表之后，再递归它的邻居；这样环上的节点第二次被访问时直接命中哈希表，递归立即收敛。

**算法思路（DFS）：**

1. 维护哈希表 `visited`。
2. `dfs(n)`：
   - 若 `n` 已在 `visited` 中，直接返回它的克隆（保证同一个原节点只克隆一次）；
   - 否则新建 `clone := &Node{Val: n.Val}`，**先把 `visited[n] = clone` 登记好**；
   - 然后遍历 `n.Neighbors`，对每个邻居调用 `dfs`，把返回值追加到 `clone.Neighbors`；
   - 返回 `clone`。
3. 入口先处理 `node == nil`（空图）返回 `nil`，否则返回 `dfs(node)`。

**BFS 同样可行**：用一个队列保存「待处理的**原节点**」，出入队时以原节点为主体；入队前先把克隆登记进哈希表，出队后再把邻居逐个克隆并接到自己的邻居列表上：

- 起点 `node` 入队，同时 `visited[node] = &Node{Val: node.Val}`；
- 弹出 `cur`，对它的每个邻居 `nb`：若 `nb` 还没克隆，就创建克隆并让 `nb` 入队；无论是否新建，都把 `visited[nb]` 追加到 `visited[cur].Neighbors`。

**为什么正确：**

- **节点一一对应**：每个原节点只有「第一次被访问时」才会创建克隆并登记；后续任何访问（无论是从别的邻居还是从环上绕回来）都命中哈希表返回同一个克隆。因此 N 个原节点恰好产生 N 个新节点，且值相同。
- **邻接关系完整**：DFS 中，新建克隆后立即递归**全部**邻居并把结果填入 `clone.Neighbors`，所以原图里每条出边都有对应的新边；又因为无向图的每条边在双方邻接表中各出现一次，代码对每个方向的边都做了同样的操作，因此新图的邻接表和原图逐项一致。
- **终止性**：哈希表在递归邻居**之前**登记，因此环上的第二次访问必然命中并返回，不会无限递归。

**复杂度分析：** 时间复杂度 O(N + E)，N 为节点数、E 为边数（无向图邻接表中共 2E 条有向记录），每个节点只克隆一次、每条有向边只处理一次。空间复杂度 O(N)，哈希表 N 项，递归栈或队列最多 O(N)。

**易错点 / 边界情况：**

- **必须先登记、后递归**。写成「递归完邻居再写入哈希表」，在有环的图上会无限递归、栈溢出——这是本题最核心的易错点。
- **空图**：题目约束节点数在 `[0, 100]` 内，`node == nil` 要返回 `nil`（不能返回空节点 `&Node{}`）。
- **单节点无邻居**：返回一个 `Val` 正确、`Neighbors` 为空的**新**节点，不能直接把原节点返回；克隆的节点数应与原图一致。
- 必须真的**新建对象**：如果 `clone.Neighbors` 里混入了原图节点指针，就不是深拷贝了；可以在测试里断言两个图的节点指针集合不相交。
- BFS 版本要小心「在入队时创建并登记克隆」，若只在出队时才创建，同一个节点可能被多次入队。
- 哈希表的 key 用节点指针即可；虽然题目保证 `Node.val` 各不相同，但用指针语义更直接、也不依赖值的唯一性。
- 无向图中 `n1` 是 `n2` 的邻居，则 `n2` 也是 `n1` 的邻居，两边的邻居列表都要完整填充。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/91-clone-graph-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
