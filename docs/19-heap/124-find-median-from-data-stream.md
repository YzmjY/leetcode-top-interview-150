# 124. 数据流的中位数

## 题目描述

**中位数**是有序整数列表中的中间值。如果列表的大小是偶数，则没有中间值，此时中位数是两个中间值的平均值。

- 例如 `arr = [2,3,4]` 的中位数是 `3`。
- 例如 `arr = [2,3]` 的中位数是 `(2 + 3) / 2 = 2.5`。

实现 `MedianFinder` 类：

- `MedianFinder()` 初始化 `MedianFinder` 对象。
- `void addNum(int num)` 将数据流中的整数 `num` 添加到数据结构中。
- `double findMedian()` 返回到目前为止所有元素的中位数。与实际答案的误差在 `10^-5` 以内的答案将被接受。

### 示例 1

```
输入：
["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]
[[], [1], [2], [], [3], []]
输出：
[null, null, null, 1.5, null, 2.0]

解释：
MedianFinder medianFinder = new MedianFinder();
medianFinder.addNum(1);    // arr = [1]
medianFinder.addNum(2);    // arr = [1, 2]
medianFinder.findMedian(); // 返回 1.5 ((1 + 2) / 2)
medianFinder.addNum(3);    // arr = [1, 2, 3]
medianFinder.findMedian(); // 返回 2.0
```

### 约束条件

- `-10^5 <= num <= 10^5`
- 在调用 `findMedian` 之前，数据结构中至少有一个元素。
- 最多 `5 * 10^4` 次调用会针对 `addNum` 和 `findMedian`。

## 题目分析

### 算法思路

本题使用**双堆法**维护数据流的中位数：

- **大顶堆 (left / maxHeap)**：存储较小的一半元素，堆顶是这一半的最大值。
- **小顶堆 (right / minHeap)**：存储较大的一半元素，堆顶是这一半的最小值。

**约束条件**：
- `left` 的大小要么等于 `right`，要么比 `right` 大 1。
- `left` 中的所有元素 <= `right` 中的所有元素。

**插入元素 `num`**：
1. 先将 `num` 插入 `left`（大顶堆）。
2. 如果不满足"left 的所有元素 <= right 的所有元素"，则将 `left` 堆顶移到 `right`。
3. 如果不满足"left 大小 == right 大小 或 left 比 right 大 1"，则调整两个堆的大小。

**查找中位数**：
- 如果 `left` 比 `right` 大 1：中位数为 `left` 的堆顶。
- 如果两堆大小相等：中位数为 `left` 堆顶和 `right` 堆顶的平均值。

### 复杂度分析

- **添加元素 (addNum)**：O(log n)，堆的 Push 和 Pop 操作。
- **查找中位数 (findMedian)**：O(1)，直接访问堆顶。
- **空间复杂度**：O(n)，存储所有元素。

### 关键点

- Go 没有内置的大顶堆，需要自定义 Less 函数（`h[i] > h[j]`）。
- 插入时先插入一侧，再根据平衡条件调整。
- 堆的平衡保证了中位数总在堆顶附近。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/124-find-median-from-data-stream-demo.html"
  style="width:100%; height:480px; border:none; border-radius:8px; background:transparent;"
  title="数据流的中位数 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import (
    "container/heap"
    "fmt"
)

// MaxHeap 大顶堆
type MaxHeap []int

func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i] > h[j] } // 大顶堆
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MaxHeap) Push(x any) { *h = append(*h, x.(int)) }

func (h *MaxHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func (h MaxHeap) Top() int { return h[0] }

// MinHeap 小顶堆
type MinHeap []int

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] } // 小顶堆
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *MinHeap) Push(x any) { *h = append(*h, x.(int)) }

func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func (h MinHeap) Top() int { return h[0] }

// MedianFinder 数据结构
type MedianFinder struct {
    left  *MaxHeap // 较小一半（大顶堆）
    right *MinHeap // 较大一半（小顶堆）
}

func Constructor() MedianFinder {
    left := &MaxHeap{}
    right := &MinHeap{}
    heap.Init(left)
    heap.Init(right)
    return MedianFinder{left, right}
}

func (mf *MedianFinder) AddNum(num int) {
    // 先插入大顶堆（较小的一半）
    heap.Push(mf.left, num)

    // 确保 left 的所有元素 <= right 的所有元素
    if mf.left.Len() > 0 && mf.right.Len() > 0 && mf.left.Top() > mf.right.Top() {
        heap.Push(mf.right, heap.Pop(mf.left))
    }

    // 平衡大小：left 的大小最多比 right 大 1
    if mf.left.Len() > mf.right.Len()+1 {
        heap.Push(mf.right, heap.Pop(mf.left))
    }
    if mf.right.Len() > mf.left.Len() {
        heap.Push(mf.left, heap.Pop(mf.right))
    }
}

func (mf *MedianFinder) FindMedian() float64 {
    if mf.left.Len() > mf.right.Len() {
        return float64(mf.left.Top())
    }
    return float64(mf.left.Top()+mf.right.Top()) / 2.0
}

func main() {
    mf := Constructor()
    mf.AddNum(1)
    fmt.Printf("添加 1 后中位数: %.1f\n", mf.FindMedian()) // 1.0
    mf.AddNum(2)
    fmt.Printf("添加 2 后中位数: %.1f\n", mf.FindMedian()) // 1.5
    mf.AddNum(3)
    fmt.Printf("添加 3 后中位数: %.1f\n", mf.FindMedian()) // 2.0
    mf.AddNum(4)
    fmt.Printf("添加 4 后中位数: %.1f\n", mf.FindMedian()) // 2.5
    mf.AddNum(5)
    fmt.Printf("添加 5 后中位数: %.1f\n", mf.FindMedian()) // 3.0
}
```
