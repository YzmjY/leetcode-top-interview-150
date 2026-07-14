# 123. 查找和最小的 K 对数字

## 题目描述

给定两个以**非递减顺序**排列的整数数组 `nums1` 和 `nums2`，以及一个整数 `k`。

定义一对值 `(u, v)`，其中第一个元素来自 `nums1`，第二个元素来自 `nums2`。

请找到和最小的 `k` 个数对 `(u1, v1), (u2, v2), ..., (uk, vk)`。

### 示例 1

```
输入: nums1 = [1,7,11], nums2 = [2,4,6], k = 3
输出: [[1,2],[1,4],[1,6]]
解释: 返回序列中的前 3 对数：
     [1,2],[1,4],[1,6],[7,2],[7,4],[11,2],[7,6],[11,4],[11,6]
```

### 示例 2

```
输入: nums1 = [1,1,2], nums2 = [1,2,3], k = 2
输出: [[1,1],[1,1]]
```

### 示例 3

```
输入: nums1 = [1,2], nums2 = [3], k = 3
输出: [[1,3],[2,3]]
```

### 约束条件

- `1 <= nums1.length, nums2.length <= 10^5`
- `-10^9 <= nums1[i], nums2[i] <= 10^9`
- `nums1` 和 `nums2` 均为**升序排列**
- `1 <= k <= 10^4`
- `k <= nums1.length * nums2.length`

## 题目分析

### 算法思路

本题是**多路归并**问题。将 `nums1` 的每个元素与 `nums2` 的所有元素配对，可以看作 `m` 条有序链表：

- 链表 0：`[nums1[0]+nums2[0], nums1[0]+nums2[1], ..., nums1[0]+nums2[n-1]]`
- 链表 1：`[nums1[1]+nums2[0], nums1[1]+nums2[1], ..., nums1[1]+nums2[n-1]]`
- ...

由于 `nums2` 有序，每条链表内部也是有序的。问题转化为：从这 `m` 条有序链表中取出和最小的前 `k` 个元素。

**算法步骤**：

1. 使用小顶堆，堆中元素为 `(sum, i, j)`，其中 `i` 是 `nums1` 的索引，`j` 是 `nums2` 的索引。
2. 初始将所有 `(nums1[i]+nums2[0], i, 0)` 入堆（每条链表的第一个元素）。
3. 重复 k 次（或堆为空）：
   - 弹出堆顶 `(sum, i, j)`，记录答案 `(nums1[i], nums2[j])`。
   - 如果 `j+1 < len(nums2)`，将 `(nums1[i]+nums2[j+1], i, j+1)` 入堆（该链表的下一个元素）。

### 复杂度分析

- **时间复杂度**：O(k log m)，其中 m = min(k, len(nums1))，堆的大小不超过 m。
- **空间复杂度**：O(m)，堆中最多存储 m 个元素。

### 关键点

- 利用 `nums2` 的有序性，每条"链表"内部天然有序。
- 多路归并的思路与合并 K 个有序链表一致。
- 初始只需将每个 `(i, 0)` 入堆即可。

## Go 代码实现

```go
package main

import (
    "container/heap"
    "fmt"
)

// Item 堆元素：和、nums1 索引、nums2 索引
type Item struct {
    sum int
    i   int // nums1 索引
    j   int // nums2 索引
}

// MinHeap 小顶堆
type MinHeap []Item

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i].sum < h[j].sum }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MinHeap) Push(x any) {
    *h = append(*h, x.(Item))
}

func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func kSmallestPairs(nums1 []int, nums2 []int, k int) [][]int {
    m, n := len(nums1), len(nums2)
    if m == 0 || n == 0 {
        return nil
    }

    h := &MinHeap{}
    heap.Init(h)

    // 初始：将每个 nums1[i] 与 nums2[0] 的组合入堆
    for i := 0; i < m && i < k; i++ {
        heap.Push(h, Item{nums1[i] + nums2[0], i, 0})
    }

    result := make([][]int, 0, k)
    for h.Len() > 0 && len(result) < k {
        item := heap.Pop(h).(Item)
        result = append(result, []int{nums1[item.i], nums2[item.j]})

        // 将该链表的下一个元素入堆
        if item.j+1 < n {
            heap.Push(h, Item{nums1[item.i] + nums2[item.j+1], item.i, item.j + 1})
        }
    }

    return result
}

func main() {
    testCases := []struct {
        nums1, nums2 []int
        k            int
    }{
        {[]int{1, 7, 11}, []int{2, 4, 6}, 3},
        {[]int{1, 1, 2}, []int{1, 2, 3}, 2},
        {[]int{1, 2}, []int{3}, 3},
    }

    for _, tc := range testCases {
        fmt.Printf("nums1 = %v, nums2 = %v, k = %d, pairs = %v\n",
            tc.nums1, tc.nums2, tc.k,
            kSmallestPairs(tc.nums1, tc.nums2, tc.k))
    }
}
```
