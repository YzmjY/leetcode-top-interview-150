# 94. 课程表 II

## 题目描述

现在你总共有 `numCourses` 门课需要选，记为 `0` 到 `numCourses - 1`。

给你一个数组 `prerequisites`，其中 `prerequisites[i] = [ai, bi]`，表示在选修课程 `ai` 前必须先选修 `bi`。

返回你为了学完所有课程所安排的学习顺序。可能会有多个正确的顺序，你只需要返回任意一种就可以了。如果不可能完成所有课程，返回一个空数组。

**示例 1：**

```
输入：numCourses = 2, prerequisites = [[1,0]]
输出：[0,1]
解释：总共有 2 门课程。要学习课程 1，你需要先完成课程 0。因此，正确的课程顺序为 [0,1]。
```

**示例 2：**

```
输入：numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
输出：[0,1,2,3] 或 [0,2,1,3]
解释：总共有 4 门课程。一个正确的课程顺序是 [0,1,2,3]。
      另一个正确的排序是 [0,2,1,3]。
```

**示例 3：**

```
输入：numCourses = 1, prerequisites = []
输出：[0]
```

**约束条件：**

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= numCourses * (numCourses - 1)`
- `prerequisites[i].length == 2`
- `0 <= ai, bi < numCourses`
- `ai != bi`
- 所有 `[ai, bi]` 互不相同

## 题目分析

本题是“课程表 I”的升级版：不仅要判断能否学完，还要**输出一个合法的学习顺序**（拓扑序）。约定与前题一致：`prerequisites[i] = [ai, bi]` 表示「学 ai 前必须先学 bi」，即边 **bi → ai**。有解的条件仍然是图中无环；无环时所有拓扑序都是合法答案，题目接受任意一种。

**算法思路（Kahn 算法）：**

1. 构建邻接表 `graph`（`graph[bi]` 存 `ai`，即 bi 的所有后继）和入度数组 `indegree`（`indegree[ai]++`）。
2. 把所有入度为 0 的课程入队（没有先修课，可以立刻学）。
3. BFS：每次弹出队首课程，**把它追加到结果数组** `result`，然后把它所有后继的入度减 1，入度降为 0 的入队。
4. 结束后若 `len(result) == numCourses`，返回 `result`；否则说明有环（部分课程永远无法解锁），返回空数组。

**算法思路（DFS 后序遍历）：**

1. 用三色标记（0 未访问、1 访问中、2 已完成）对所有未访问节点启动 DFS。
2. 递归处理一个节点时，先遍历它的**所有后继**；等所有后继都处理完，再把这个节点追加到 `result` —— 即在**后序位置**加入。
3. 后序序列是**逆拓扑序**（先修课会排在后修课后面），因此最后把 `result` 整体反转即为答案。
4. 过程中若某个后继处于「访问中」（灰色）状态，说明有环，直接返回空数组，并丢弃已经部分填充的 `result`。

**为什么正确：**

**Kahn 算法**：需要证明「出队顺序满足所有先修约束」。对任意一条边 `bi → ai`，`ai` 只有在 `bi` 出队之后才会因为入度归零而入队，也就是说 `ai` 一定在 `bi` **之后**出队；因此结果中 `bi` 排在 `ai` 前面，恰好满足「学 ai 前先学 bi」。又因为 `len(result) == numCourses` 时所有课程都被排入，结果是一个完整的合法顺序。反之若有环，环上的节点入度永远不会归零（每个节点的入边都来自环内），结果长度必然小于 `numCourses`，此时返回空数组也正确。

**DFS 后序**：对任意边 `bi → ai`（ai 是 bi 的后继），DFS 从 bi 出发时会先递归进入 ai；ai 的后序加入时刻一定早于 bi，所以在 `result` 中 ai 排在 bi 之前。反转之后 bi 排在 ai 之前，满足先修约束。由于每个节点恰好入列一次、每条边恰好比较一次，排出的序列包含全部 `numCourses` 门课（有环时提前返回空数组），因此是一个合法拓扑序。

**时间复杂度：** O(V + E)，每个节点入队/出栈一次，每条边处理一次（Kahn 的入度松弛、DFS 的递归访问各一次）。

**空间复杂度：** O(V + E)，邻接表占 O(V + E)，入度数组、颜色数组、结果数组和队列/递归栈各占 O(V)。

**易错点 / 边界情况：**

- **边方向别写反**：`graph[bi]` 里放 `ai`，`indegree[ai]++`。写反会得到反向的顺序（后修课排前面）。
- **有环时要丢弃部分结果**：Kahn 必须用 `len(result) == numCourses` 判定成功后再返回，不能在循环里直接返回；DFS 检测到环后返回的是**空数组**，不能把已填充的部分结果返回。
- **DFS 必须反转后序序列**：直接返回 `result` 得到的是逆拓扑序，是本题最常见的错误。
- 后序加入的位置在「递归完所有后继之后」，若写在进入节点时（前序），顺序就错了。
- 入队顺序决定了具体输出。代码从 0 到 `numCourses-1` 依次把入度为 0 的课程入队，因此示例 2 得到 `[0,1,2,3]`（题目也接受 `[0,2,1,3]`）。
- **自环** `[0,0]`、两课互环等都要返回空数组；`numCourses = 1` 且无先修课时返回 `[0]`。
- 无先修课时结果就是 `[0,1,...,numCourses-1]`。
- 有多个连通分量时，DFS 法要在最外层遍历所有未访问节点，否则会漏掉部分课程。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/94-course-schedule-ii-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="课程表 II - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

// findOrder 使用 Kahn 算法返回拓扑排序结果
func findOrder(numCourses int, prerequisites [][]int) []int {
    // 构建邻接表与入度数组
    graph := make([][]int, numCourses)
    indegree := make([]int, numCourses)
    for _, p := range prerequisites {
        ai, bi := p[0], p[1] // bi -> ai
        graph[bi] = append(graph[bi], ai)
        indegree[ai]++
    }

    // 入度为 0 的课程入队
    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if indegree[i] == 0 {
            queue = append(queue, i)
        }
    }

    result := make([]int, 0, numCourses)
    for len(queue) > 0 {
        course := queue[0]
        queue = queue[1:]
        result = append(result, course)
        for _, next := range graph[course] {
            indegree[next]--
            if indegree[next] == 0 {
                queue = append(queue, next)
            }
        }
    }

    if len(result) == numCourses {
        return result
    }
    return []int{}
}

// findOrderDFS 使用 DFS 后序遍历返回拓扑排序结果
func findOrderDFS(numCourses int, prerequisites [][]int) []int {
    graph := make([][]int, numCourses)
    for _, p := range prerequisites {
        ai, bi := p[0], p[1]
        graph[bi] = append(graph[bi], ai)
    }

    // 0: 未访问, 1: 访问中, 2: 已完成
    state := make([]int, numCourses)
    result := make([]int, 0, numCourses)

    var dfs func(course int) bool
    dfs = func(course int) bool {
        if state[course] == 1 {
            return false // 发现环
        }
        if state[course] == 2 {
            return true
        }
        state[course] = 1
        for _, next := range graph[course] {
            if !dfs(next) {
                return false
            }
        }
        state[course] = 2
        result = append(result, course) // 后序位置加入
        return true
    }

    for i := 0; i < numCourses; i++ {
        if state[i] == 0 {
            if !dfs(i) {
                return []int{}
            }
        }
    }

    // DFS 后序遍历得到的是逆拓扑序，需要反转
    for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
        result[i], result[j] = result[j], result[i]
    }
    return result
}

func main() {
    fmt.Println(findOrder(4, [][]int{{1, 0}, {2, 0}, {3, 1}, {3, 2}}))
    // 输出: [0 1 2 3] 或 [0 2 1 3]
    fmt.Println(findOrderDFS(4, [][]int{{1, 0}, {2, 0}, {3, 1}, {3, 2}}))
}
```
