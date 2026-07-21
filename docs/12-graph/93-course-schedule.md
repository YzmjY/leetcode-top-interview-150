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

本题本质是判断有向图是否存在环——即能否进行拓扑排序。如果图中存在环，则无法完成所有课程；如果图是 DAG，则可以完成。

**方法一：Kahn 算法（BFS + 入度表）**

1. 构建邻接表 `graph` 和入度数组 `indegree`
2. 将所有入度为 0 的课程加入队列
3. BFS 遍历：每次取出队首课程，将其所有后继课程的入度减 1，若变为 0 则入队
4. 统计访问过的课程数，若等于 `numCourses` 则无环

**方法二：DFS 三色标记法**

- `0`（白色）：未访问
- `1`（灰色）：正在访问（在当前递归栈中）
- `2`（黑色）：已完成访问

如果在 DFS 过程中遇到灰色节点，说明存在环。

**时间复杂度：** O(V + E)，每个节点和边都只被处理一次。

**空间复杂度：** O(V + E)，存储邻接表和入度/颜色数组。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/93-course-schedule-demo.html"
  style="width:100%; height:580px; border:none; border-radius:8px; background:transparent;"
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
