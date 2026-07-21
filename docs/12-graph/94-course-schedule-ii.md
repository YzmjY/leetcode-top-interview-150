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

本题是"课程表 I"的升级版，不仅需要判断是否能完成所有课程，还需要输出完成课程的拓扑顺序。同样可以使用 Kahn 算法或 DFS 实现。

**算法思路（Kahn 算法）：**

1. 构建邻接表和入度数组
2. 将所有入度为 0 的课程入队
3. BFS 过程中，每次弹出的课程追加到结果数组
4. 如果结果数组长度等于 numCourses，返回结果；否则说明有环，返回空数组

**算法思路（DFS 后序遍历）：**

1. 对所有未访问的节点进行 DFS
2. 当一个节点的所有后继都访问完成后，将该节点加入结果栈
3. 最后将栈反转即为拓扑排序结果
4. 过程中若发现环，返回空数组

**时间复杂度：** O(V + E)，每个节点和边处理一次。

**空间复杂度：** O(V + E)，邻接表、入度数组和结果数组。


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
