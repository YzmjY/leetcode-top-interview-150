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

**朴素想法**：把 `m * n` 个数对全算出来再排序取前 `k` 个，时间是 O(mn log(mn))，在 `m, n` 达到 `10^5` 时完全不可行。

**关键观察**：把 `nums1` 的每个元素看作一行，第 `i` 行的数对是 `(nums1[i], nums2[0]), (nums1[i], nums2[1]), ...`。由于 `nums2` 非递减，**每一行内部的和是非递减的**。于是这 `m` 行就是 `m` 条有序序列，问题转化为「从 `m` 条有序序列中归并取出前 `k` 小」，与合并 K 个有序链表是同一个套路：

- 链表 0：`[nums1[0]+nums2[0], nums1[0]+nums2[1], ..., nums1[0]+nums2[n-1]]`
- 链表 1：`[nums1[1]+nums2[0], nums1[1]+nums2[1], ..., nums1[1]+nums2[n-1]]`
- ...

**算法步骤**：

1. 小顶堆的元素记为 `(sum, i, j)`，表示数对 `(nums1[i], nums2[j])` 及其和，堆按 `sum` 比较。
2. 初始化：把每一行的第一个元素 `(nums1[i]+nums2[0], i, 0)` 入堆。由于只需要前 `k` 个数对，每行最多贡献 `k` 个，故只需把 `i < k` 的行入堆（即入堆前 `min(m, k)` 行，理由见下）。
3. 循环至多 `k` 轮，直到堆空或已收集 `k` 个数对：
   - 弹出堆顶 `(sum, i, j)`，把 `(nums1[i], nums2[j])` 加入答案；
   - 若 `j+1 < n`，把**同一行**的下一个候选 `(nums1[i]+nums2[j+1], i, j+1)` 入堆；否则该行已取完，不再补。

**为什么正确（多路归并）**：把每条有序行看作一个队列，指针 `j` 指向该行尚未取出的最小元素；堆中恰好存放每条行当前的候选。归并的经典性质是：**全局尚未取出的最小元素，一定等于各行候选中的最小者**——因为任意未取元素都属于某一行，而它不小于该行当前指针所指的候选。所以每次弹出堆顶就是当前全局最小；取走后把该行的下一个元素补入堆，堆又恢复「每行一个候选」的状态。由归纳法，前 `k` 次弹出恰好是全部数对中按和升序排列的前 `k` 个。

**为什么初始只入堆前 `min(m, k)` 行**：设 `k < m`。对任意 `i >= k`，前 `k` 行的首元素 `nums1[t]+nums2[0]`（`t = 0..k-1`）都满足 `nums1[t] <= nums1[i]`，因此已经存在 `k` 个数对的和不超过 `nums1[i]+nums2[0]`，第 `i` 行绝不可能进入前 `k` 小。这个剪枝同时把堆的初始规模压到 O(k)。

### 复杂度分析

- **时间复杂度**：O(k log m')，其中 `m' = min(k, len(nums1))`。堆的规模始终不超过 `m'`（每弹出一个至多补进一个），共进行至多 `k` 轮、每轮 O(log m')。
- **空间复杂度**：O(m')，堆中最多存储 `m'` 个元素；答案本身占 O(k)。

### 关键点

- 利用 `nums2` 的有序性，每条「链表」内部天然有序——这是能把二维问题降成多路归并的关键。
- 堆元素必须带上 `(i, j)`；只存和无法知道该行的下一个候选是谁。
- 弹出后补入的是**同一行**的下一列：`i` 不变、`j+1`，不要错改成下一行的首元素（`i+1, 0`），那会漏掉本行后续元素。
- 题目示例 3（`nums1=[1,2], nums2=[3], k=3`，此时 `m*n = 2 < k`）说明**实现必须容忍 `k > m*n`**：答案只会返回 `m*n` 个，靠「堆空」自然结束；不能假设一定返回 `k` 个。注意这条例外与约束中 `k <= nums1.length * nums2.length` 是矛盾的（原题自带），实现按「尽量返回、不足则少返回」处理即可。
- 元素可能为负，不能用 0 等哨兵值表示「未初始化」。
- 题目允许相同和的数对以任意顺序返回，但本实现天然从和小的往和大的输出。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/123-find-k-pairs-with-smallest-sums-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="查找和最小的 K 对数字 - 交互演示">
</iframe>

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
