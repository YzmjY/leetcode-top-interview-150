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

**朴素想法**：用一个有序数组，每次 `addNum` 二分找到位置后插入。插入本身要搬移元素 O(n)，最多 `5*10^4` 次调用就是 O(n²)，不可取。

**关键观察**：求中位数其实只关心两个端点——「较小那一半的最大值」和「较大那一半的最小值」。于是把元素对半分到两个堆里，各自只需要看堆顶：

- **大顶堆 `left`**：存较小的一半，堆顶是这一半的最大值；
- **小顶堆 `right`**：存较大的一半，堆顶是这一半的最小值。

插入 O(log n)，取中位数 O(1)。

**需要维护的两条不变量**：

1. **分离性**：`left` 中所有元素 <= `right` 中所有元素；
2. **平衡性**：`left.size == right.size` 或 `left.size == right.size + 1`（允许左半多一个，这样奇数个元素时中位数正好在 `left` 堆顶）。

**插入 `num` 的步骤**（与代码一致）：

1. 无条件把 `num` 压入 `left`。插入前平衡性至多被破坏成 `left = right + 2`，分离性可能被破坏。
2. 若 `left` 与 `right` 都非空且 `left.Top() > right.Top()`，把 `left` 堆顶移到 `right`——修复分离性。
3. 若 `left.size > right.size + 1`，把 `left` 堆顶移到 `right`——修复「左过多」。
4. 若 `right.size > left.size`，把 `right` 堆顶移到 `left`——修复「右过多」。

**查找中位数**：

- 若 `left.size == right.size + 1`：元素总数为奇数，中位数就是 `left` 堆顶；
- 若两堆大小相等：元素总数为偶数，中位数是 `left` 堆顶与 `right` 堆顶的平均值。

**为什么正确**：在两条不变量成立的前提下，设总数为 `n`。若 `n` 为奇数，由平衡性 `left.size = (n+1)/2`、`right.size = (n-1)/2`，由分离性可知 `left` 恰好是整个数据集最小的 `(n+1)/2` 个元素，其堆顶就是其中最大者，即升序排列的第 `(n+1)/2` 个元素（中位数）；若 `n` 为偶数，两堆各占一半，中位数正是「左半最大值 + 右半最小值」再除以 2。

下面说明插入的三步确实能把两条不变量重新修复。设插入前 `(L, R)` 满足 `L ∈ {R, R+1}`，插入后为 `(L+1, R)`，于是 `left` 至多比 `right` 多 2 个元素，且至多有一个元素「站错了边」。第 2 步最多搬一次即可恢复分离性：搬走的 `left` 堆顶正是 `left` 中大于 `right` 堆顶的那个越界元素，搬完后 `left` 中剩余元素都 <= 新 `right` 的堆顶。第 3、4 步再各自检查一次平衡性，因为此时 `|L+1 - R| <= 2`，至多再搬一次就能把差值压回 0 或 1。因此插入结束后两条不变量同时成立。

### 复杂度分析

- **添加元素 (`addNum`)**：O(log n)，每次最多执行常数次 Push/Pop，每次 O(log n)。
- **查找中位数 (`findMedian`)**：O(1)，只访问两个堆顶。
- **空间复杂度**：O(n)，两个堆合计存储所有元素。

### 关键点

- Go 没有内置的大顶堆，需要自定义 `Less`：小顶堆写 `h[i] < h[j]`，大顶堆写 `h[i] > h[j]`。
- 插入时「先无条件压入 `left`，再用三条规则修正」，比「先比较再决定插入哪一边」更不容易漏掉相等或极端情况。
- 允许重复元素，`Top()` 的比较用 `>`（而不是 `>=`）即可；相等时放在哪边都不破坏不变量。
- 偶数个元素求平均时必须先转 `float64` 再除，写成 `float64((a+b)/2)` 会因整数除法丢掉小数部分。
- 题面保证调用 `findMedian` 时至少有一个元素，因此不必处理两堆同时为空的情况。
- `heap.Pop` 的语义是：先把堆顶与末尾元素交换，再把末尾元素交给用户的 `Pop()`。因此自定义 `Pop()` 里必须 `x := old[n-1]` 并 `*h = old[:n-1]`，不能写成 `old[0]`。
- 平衡条件不能反向：如果让 `right` 比 `left` 多，奇数个元素时中位数就不在堆顶附近了。
- 第 2 步（分离性修正）与第 3、4 步（平衡性修正）不能只保留一个：只做平衡会在数据交错时把元素放错半边，只做分离则两堆大小会失衡。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/124-find-median-from-data-stream-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
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
