# 第19章：堆

## 概述

堆（Heap）是一种特殊的完全二叉树结构，满足堆性质：每个节点的值都大于等于（大顶堆）或小于等于（小顶堆）其子节点的值。堆在 Go 标准库中通过 `container/heap` 接口提供。

## Go 中 container/heap 接口的使用

### 接口定义

`container/heap` 要求实现 `heap.Interface`，它组合了 `sort.Interface` 和两个额外方法：

```go
type Interface interface {
    sort.Interface
    Push(x any) // 添加元素
    Pop() any   // 移除并返回最后一个元素
}
```

其中 `sort.Interface` 需要实现：

```go
type Interface interface {
    Len() int
    Less(i, j int) bool
    Swap(i, j int)
}
```

### 标准模板

```go
// 定义堆类型
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] } // 小顶堆
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *IntHeap) Push(x any) {
    *h = append(*h, x.(int))
}

func (h *IntHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}
```

### 常用操作

| 操作 | 方法 | 说明 |
|------|------|------|
| 初始化 | `heap.Init(&h)` | 将切片转换为堆结构 O(n) |
| 推入 | `heap.Push(&h, x)` | 插入元素 O(log n) |
| 弹出 | `heap.Pop(&h)` | 移除并返回堆顶 O(log n) |
| 查看堆顶 | `h[0]` | 直接访问第一个元素 O(1) |
| 更新 | `h[i] = x; heap.Fix(&h, i)` | 更新指定位置元素 O(log n) |

### 大顶堆 vs 小顶堆

- **小顶堆**：`Less` 返回 `h[i] < h[j]`，堆顶是最小元素。
- **大顶堆**：`Less` 返回 `h[i] > h[j]`，堆顶是最大元素。

## 堆的典型应用场景

1. **Top K 问题**：维护大小为 K 的堆，快速获取前 K 大/小的元素。
2. **优先队列**：支持动态插入和获取优先级最高的元素。
3. **多路归并**：合并 K 个有序链表/数组。
4. **数据流中位数**：使用两个堆（大顶堆 + 小顶堆）维护数据流的中位数。
5. **Dijkstra 最短路径**：优先队列优化。

## 本章题目

| 题号 | 题目 | 难度 | 核心技巧 |
|------|------|------|----------|
| 121 | 数组中的第K个最大元素 | 中等 | 小顶堆维护 Top K |
| 122 | IPO | 困难 | 贪心 + 大顶堆 |
| 123 | 查找和最小的 K 对数字 | 中等 | 多路归并 + 小顶堆 |
| 124 | 数据流的中位数 | 困难 | 双堆（大顶堆 + 小顶堆） |
