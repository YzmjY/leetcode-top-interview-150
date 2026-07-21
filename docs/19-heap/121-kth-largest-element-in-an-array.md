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

本题有多种解法，这里介绍使用**小顶堆**的解法（时间复杂度 O(n log k)）。

**思路**：
1. 维护一个大小为 `k` 的小顶堆。
2. 遍历数组，将元素逐个推入堆中。
3. 当堆的大小超过 `k` 时，弹出堆顶（当前最小的元素）。
4. 遍历结束后，堆顶就是第 `k` 大的元素。

> 注：也可使用快速选择算法（Quick Select）实现 O(n) 平均时间复杂度，这里展示堆解法以配合本章主题。

### 复杂度分析

- **时间复杂度**：O(n log k)，每个元素最多进行一次堆操作（Push 或 Pop）。
- **空间复杂度**：O(k)，堆中最多存储 k 个元素。

### 关键点

- 使用**小顶堆**找第 `k` 大元素：堆中始终保持 `k` 个当前最大的元素。
- Go 中 `container/heap` 默认是小顶堆（Less 返回 `h[i] < h[j]`）。
- 如果使用大顶堆，则需将所有元素入堆后再弹出 k 次，空间复杂度为 O(n)。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/121-kth-largest-element-in-an-array-demo.html"
  style="width:100%; min-height:300px; border:none; border-radius:8px; background:transparent;"
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
