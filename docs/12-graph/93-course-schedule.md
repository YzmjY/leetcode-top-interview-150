# 93. 课程表

## 题目描述

你这个学期必须选修 `numCourses` 门课程，记为 `0` 到 `numCourses - 1`。

在选修某些课程之前需要一些先修课程。先修课程按数组 `prerequisites` 给出，其中 `prerequisites[i] = [ai, bi]`，表示如果要学习课程 `ai`，则必须先学习课程 `bi`。

例如，先修课程对 `[0, 1]` 表示：想要学习课程 `0`，你需要先完成课程 `1`。

请你判断是否可能完成所有课程的学习？如果可以，返回 `true`；否则，返回 `false`。

**示例 1：**

```
输入：numCourses = 2, prerequisites = [[1,0]]
输出：true
解释：总共有 2 门课程。学习课程 1 之前，你需要完成课程 0。这是可能的。
```

**示例 2：**

```
输入：numCourses = 2, prerequisites = [[1,0],[0,1]]
输出：false
解释：总共有 2 门课程。学习课程 1 之前，你需要先完成课程 0；
      并且学习课程 0 之前，你还应先完成课程 1。这是不可能的。
```

**约束条件：**

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= ai, bi < numCourses`
- `prerequisites[i]` 中的所有课程对互不相同

## 题目分析

本题本质是**判断有向图是否存在环**，等价于判断能否进行拓扑排序。把课程看作节点、先修关系看作有向边：`prerequisites[i] = [ai, bi]` 表示「学 ai 前必须先学 bi」，即边 **bi → ai**（先修课指向后修课）。图是 DAG ⟺ 存在拓扑序 ⟺ 能按先修关系学完全部课程；图中有环 ⟺ 环上的课程互为先修，永远无法开始。

**方法一：Kahn 算法（BFS + 入度表）**

1. 构建邻接表 `graph`（`graph[bi]` 里放 `ai`，即 bi 的所有后继）和入度数组 `indegree`（`indegree[ai]++`）。
2. 把所有入度为 0 的课程入队——它们没有任何先修课，可以立刻学。
3. BFS：每次取出队首课程 `course`，`visited++`，然后把它所有后继的入度减 1（相当于「完成了一门先修课」）；某个后继入度降为 0 时就可以学了，入队。
4. 统计出队课程数 `visited`，`visited == numCourses` 返回 true，否则返回 false。

**方法二：DFS 三色标记法**

- `0`（白色）：尚未访问；
- `1`（灰色）：正在访问，还在当前递归栈上；
- `2`（黑色）：已完成访问，且它的所有后继都已处理完毕。

从每个未访问的节点出发 DFS，进入时置 1，递归所有后继，返回前置 2。若在递归过程中遇到**灰色**节点，说明有一条边指回了当前递归栈中的节点，即存在环。

**为什么正确：**

**Kahn 算法**：把「出队」理解为「把这门课排进学习顺序」。

- 若 `visited == numCourses`，说明所有课程都能被排出，出队顺序本身就是一个拓扑序，故无环。
- 反之若 `visited < numCourses`，设 R 为剩余未出队的课程集合。每个 R 中节点的入度此时都 > 0（否则早就入队了），而它的入边不可能来自已出队的节点（已出队节点的后继入度都减过了，若因此变 0 就会入队）。所以 R 中每个节点都至少有一条来自 R 内部的入边。在有限有向图中，若子图 R 中每个节点都有入边，则 R 中必存在有向环：从任一节点沿入边一直往回走，节点数有限，必然重复访问某个节点，形成环。故存在环。

**DFS 三色法**：

- 若 DFS 中从 u 出发遇到灰色节点 v，则 v 在递归栈上，即存在一条 v → ... → u 的路径，加上 u → v 这条边，构成有向环。
- 反之，若图中存在环 `v0 → v1 → ... → vk → v0`，当 DFS 首次进入环上某个节点时（此时环上节点都还不是黑色），它会沿环前进；在走到闭合的那条边上时，边的终点仍在递归栈中（灰色），于是被检测到。若环在更早被标记为黑色，说明该节点已被完全处理，但其后继仍在处理中——这与「黑色节点的所有后继都已处理完」矛盾。因此环必然会被发现。

**时间复杂度：** O(V + E)，每个节点入队/入栈一次，每条边恰好被松弛一次。

**空间复杂度：** O(V + E)，邻接表占 O(V + E)，入度数组 / 颜色数组占 O(V)（DFS 还有 O(V) 的递归栈深度）。

**易错点 / 边界情况：**

- **边方向别写反**：`[ai, bi]` 是「bi 是 ai 的先修课」，所以邻接表里是 `graph[bi] = append(graph[bi], ai)`、`indegree[ai]++`；反了会把可以完成的课判成有环。
- **统计量要和课程总数比较**：Kahn 里是 `visited == numCourses`，不能与 `len(prerequisites)` 比。
- **自环**：`[0, 0]` 表示课程 0 需要先修课程 0，是环，应返回 false；代码天然能检测到。
- **多个连通分量**：DFS 法必须在最外层对所有未访问节点都启动一次 DFS，不能只从 0 号课程出发。
- **DFS 中状态的置位时机**：递归前置 1（灰色）、返回前才置 2（黑色）；写成「进入就置 2」会漏掉环。
- 无先修课时（`prerequisites` 为空）直接返回 true；`numCourses = 1` 且无先修课也是 true。
- 课程数最多 2000、边最多 5000，递归深度最多 2000，Go 能承受；换语言时注意栈深度。
- 两个方法结果应当一致，可以用一个方法验证另一个。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/93-course-schedule-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="课程表 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// canFinish 使用 Kahn 算法（BFS + 入度）判断是否能完成所有课程
func canFinish(numCourses int, prerequisites [][]int) bool {
    // 构建邻接表与入度数组
    graph := make([][]int, numCourses)
    indegree := make([]int, numCourses)
    for _, p := range prerequisites {
        ai, bi := p[0], p[1] // 要学 ai 必须先学 bi，即 bi -> ai
        graph[bi] = append(graph[bi], ai)
        indegree[ai]++
    }

    // 将所有入度为 0 的课程入队
    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if indegree[i] == 0 {
            queue = append(queue, i)
        }
    }

    // BFS 拓扑排序
    visited := 0
    for len(queue) > 0 {
        course := queue[0]
        queue = queue[1:]
        visited++
        for _, next := range graph[course] {
            indegree[next]--
            if indegree[next] == 0 {
                queue = append(queue, next)
            }
        }
    }

    return visited == numCourses
}

// canFinishDFS 使用 DFS 三色标记法判断是否有环
func canFinishDFS(numCourses int, prerequisites [][]int) bool {
    graph := make([][]int, numCourses)
    for _, p := range prerequisites {
        ai, bi := p[0], p[1]
        graph[bi] = append(graph[bi], ai)
    }

    // 0: 未访问, 1: 访问中, 2: 已完成
    state := make([]int, numCourses)

    var dfs func(course int) bool
    dfs = func(course int) bool {
        if state[course] == 1 {
            return false // 发现环
        }
        if state[course] == 2 {
            return true // 已经处理过
        }
        state[course] = 1 // 标记为访问中
        for _, next := range graph[course] {
            if !dfs(next) {
                return false
            }
        }
        state[course] = 2 // 标记为已完成
        return true
    }

    for i := 0; i < numCourses; i++ {
        if state[i] == 0 {
            if !dfs(i) {
                return false
            }
        }
    }
    return true
}

func main() {
    fmt.Println(canFinish(2, [][]int{{1, 0}}))           // true
    fmt.Println(canFinish(2, [][]int{{1, 0}, {0, 1}}))   // false
    fmt.Println(canFinishDFS(2, [][]int{{1, 0}}))        // true
}
```
