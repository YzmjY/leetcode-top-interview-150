# 第16章：分治 (Divide and Conquer)

## 概述

分治算法是一种将复杂问题分解为若干个规模较小的相同子问题，递归求解后再合并结果的算法范式。

## 分治三步法

```
Divide（分解）  ->  Conquer（解决）  ->  Combine（合并）
```

1. **分解（Divide）**：将原问题划分为若干个规模较小的子问题，子问题与原问题形式相同
2. **解决（Conquer）**：递归求解各个子问题。当子问题足够小时直接求解（递归基/base case）
3. **合并（Combine）**：将子问题的解合并为原问题的解

## 分治适用条件

1. 原问题可以分解为多个**相同形式**的子问题
2. 子问题之间**相互独立**（无重叠——如果有重叠则考虑动态规划）
3. 子问题的解可以**合并**为原问题的解
4. 存在**递归终止条件**（子问题规模足够小）

## 经典应用

### 归并排序（Merge Sort）

```go
func mergeSort(nums []int) []int {
    if len(nums) <= 1 {
        return nums
    }
    mid := len(nums) / 2
    left := mergeSort(nums[:mid])   // 分解 + 解决
    right := mergeSort(nums[mid:])
    return merge(left, right)        // 合并
}
```

时间复杂度：O(n log n)，空间复杂度：O(n)。

### 快速排序（Quick Sort）

```go
func quickSort(nums []int, lo, hi int) {
    if lo >= hi {
        return
    }
    pivot := partition(nums, lo, hi) // 分解
    quickSort(nums, lo, pivot-1)     // 解决
    quickSort(nums, pivot+1, hi)
}
```

### 二分查找（Binary Search）

```go
func binarySearch(nums []int, target int) int {
    lo, hi := 0, len(nums)-1
    for lo <= hi {
        mid := lo + (hi-lo)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            lo = mid + 1
        } else {
            hi = mid - 1
        }
    }
    return -1
}
```

## 分治 vs 动态规划

| 维度 | 分治 | 动态规划 |
|------|------|---------|
| 子问题关系 | 互相独立 | 有重叠 |
| 求解方向 | 自顶向下递归 | 自底向上递推（或记忆化递归） |
| 合并 | 需要合并子问题解 | 通过状态转移方程组合 |
| 典型问题 | 归并排序、快速排序、最近点对 | 背包、LCS、编辑距离 |

## 链表的归并排序

对于链表，分治合并的优势在于：
- 无需额外数组空间（归并两个已排序链表只需要 O(1) 额外空间）
- 链表天然支持 O(1) 的分割（快慢指针）

```go
func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }
    // 快慢指针找中点
    slow, fast := head, head.Next
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    mid := slow.Next
    slow.Next = nil // 断开链表
    // 递归排序两半 + 合并
    return merge(sortList(head), sortList(mid))
}
```

## 本章题目

| 题号 | 题目 | 核心知识点 |
|------|------|-----------|
| 108 | 将有序数组转换为二叉搜索树 | 递归构建平衡 BST |
| 109 | 排序链表 | 链表归并排序（快慢指针 + 合并） |
| 110 | 建立四叉树 | 递归区域划分 |
| 111 | 合并 K 个升序链表 | 分治合并（两两合并），优先队列 |
