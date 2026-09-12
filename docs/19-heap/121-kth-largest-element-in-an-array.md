# 121. 数组中的第K个最大元素

## 题目描述

给定整数数组 `nums` 和整数 `k`，请返回数组中第 `k` 个最大的元素。

请注意，你需要找的是数组排序后的第 `k` 个最大的元素，而不是第 `k` 个不同的元素。

你必须设计并实现时间复杂度为 O(n) 的算法解决此问题。

### 示例 1

```
输入: [3,2,1,5,6,4], k = 2
输出: 5
```

### 示例 2

```
输入: [3,2,3,1,2,4,5,5,6], k = 4
输出: 4
```

### 约束条件

- `1 <= k <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## 题目分析

### 算法思路

**朴素想法**：把整个数组升序排序，取下标 `n - k` 的元素即为第 `k` 大。时间是 O(n log n)，不满足题面要求的 O(n)。

**观察**：我们并不需要知道全部元素的顺序，只需要知道「当前最大的 `k` 个元素」。于是可以只维护一个大小为 `k` 的小顶堆——堆顶是这 `k` 个元素中最小的一个，也就是这一组「候选前 k 大」里最弱的那个，一旦有新元素比它大，就把它挤出去。

**算法步骤**：

1. 创建一个空的小顶堆 `h`。
2. 从左到右遍历 `nums` 的每个元素 `num`：先把 `num` 压入堆；如果此时堆的大小超过 `k`，就弹出堆顶（堆中最小的元素）。
3. 遍历结束后，堆里恰好是数组中最大的 `k` 个元素，堆顶是其中最小的那个，也就是整个数组升序排列后的第 `k` 大元素，返回 `(*h)[0]`。

**为什么正确（循环不变量）**：设遍历到某一时刻已处理的元素集合为 `S`，维护不变量「**堆中存放的是 `S` 中最大的 `min(k, |S|)` 个元素**」。

- 初始 `S` 为空，堆为空，不变量成立。
- 处理 `num` 时，令 `S' = S ∪ {num}`。若 `|S| < k`，`S'` 中最大的 `min(k, |S'|) = |S|+1` 个元素就是原来的全部再加上新元素，全部入堆即满足。
- 若 `|S| >= k`，由归纳假设堆中是 `S` 中最大的 `k` 个，再加上新元素 `num`，堆中就是 `S'` 中最大的 `k+1` 个元素；弹出堆顶（其中最小的一个）后，剩下的正好是 `S'` 中最大的 `k` 个，不变量保持。

遍历结束时 `S = nums`，由于 `k <= n`，堆中就是数组中最大的 `k` 个元素，堆顶是其中最小者，即升序排列后的第 `k` 大元素。

**关于题面要求的 O(n)**：上述堆解法的复杂度是 O(n log k)，严格来说**并不满足题面「时间复杂度为 O(n)」的要求**（当 `k` 接近 `n` 时就是 O(n log n)）。如果面试官追问，应当改用**快速选择（Quick Select）**：

1. 目标是升序排列中下标 `target = n - k` 的元素。
2. 借用快速排序的 `partition`：随机选取基准 `pivot`，把当前区间划分为「小于 pivot」「等于 pivot」「大于 pivot」三段，并得到 pivot 在升序中的最终下标 `p`。
3. 若 `p == target`，直接返回 `nums[p]`；若 `p > target`，只在左半段继续；若 `p < target`，只在右半段继续。
4. 每次只递归（或迭代）一侧，长度期望减半，故期望时间复杂度 O(n)，空间 O(1)（改为迭代写法）。随机化基准可避免有序输入退化成 O(n²)；若要求最坏也是 O(n)，需用「中位数的中位数」选基准，实现复杂、常数大。

本节的代码给出堆解法以配合本章主题，它的最坏情况有保证，且逻辑更容易写对。

### 复杂度分析

- **时间复杂度**：O(n log k)。每个元素恰好入堆一次（O(log k)），另外至多出堆一次（O(log k)），因此每个元素最多贡献 2 次堆操作，总计 O(n log k)。注意「每个元素最多进行一次堆操作」的说法并不准确：元素入堆后若堆超限，还需要把它或别的元素弹出。
- **空间复杂度**：O(k)，堆中最多同时存 `k` 个元素。

### 关键点

- 使用**小顶堆**找第 `k` 大元素：堆中始终保持 `k` 个当前最大的元素。
- Go 的 `container/heap` 需要实现 `Len/Less/Swap/Push/Pop` 五个方法，其中 `Less` 决定堆序；`Less` 返回 `h[i] < h[j]` 得到的是小顶堆。
- 如果使用大顶堆，则必须先把全部 `n` 个元素入堆（空间 O(n)），再弹出 `k` 次，时间为 O(n + k log n)。
- 边界：`k == 1` 时堆中只剩最大值；`k == n` 时等价于求最小值，堆中会装下所有元素。
- 题目允许重复元素，处理方式与普通元素相同（第 `k` 大不是第 `k` 个不同元素）。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/121-kth-largest-element-in-an-array-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="数组中的第K个最大元素 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import (
    "container/heap"
    "fmt"
)

// MinHeap 小顶堆
type MinHeap []int

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MinHeap) Push(x any) {
    *h = append(*h, x.(int))
}

func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func findKthLargest(nums []int, k int) int {
    h := &MinHeap{}
    heap.Init(h)

    for _, num := range nums {
        heap.Push(h, num)
        // 保持堆大小为 k
        if h.Len() > k {
            heap.Pop(h)
        }
    }

    return (*h)[0]
}

func main() {
    testCases := []struct {
        nums []int
        k    int
    }{
        {[]int{3, 2, 1, 5, 6, 4}, 2},
        {[]int{3, 2, 3, 1, 2, 4, 5, 5, 6}, 4},
    }

    for _, tc := range testCases {
        fmt.Printf("nums = %v, k = %d, 第K大 = %d\n",
            tc.nums, tc.k, findKthLargest(tc.nums, tc.k))
    }
}
```
