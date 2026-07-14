# 第18章：二分查找

## 概述

二分查找（Binary Search）是一种在**有序数组**中查找目标值的高效算法。其核心思想是每次将搜索区间缩小一半，时间复杂度为 O(log n)。

## 标准二分模板

### 模板一：查找精确值（左闭右闭区间 `[left, right]`）

```go
func binarySearch(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2  // 防止溢出
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return -1
}
```

### 模板二：查找左边界

寻找第一个 **大于等于** target 的位置：

```go
func lowerBound(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left
}
```

### 模板三：查找右边界

寻找最后一个 **小于等于** target 的位置：

```go
func upperBound(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] <= target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left - 1
}
```

## 关键细节

1. **区间定义**：明确使用 `[left, right]`（左闭右闭）还是 `[left, right)`（左闭右开）区间。
2. **mid 计算**：使用 `left + (right-left)/2` 而不是 `(left+right)/2`，防止整数溢出。
3. **循环条件**：`left <= right`（闭区间）vs `left < right`（开区间）。
4. **边界收缩**：确保每次迭代区间严格缩小，避免死循环。

## 二分查找的变体场景

| 场景 | 方法 | 关键点 |
|------|------|--------|
| 精确查找 | 模板一 | 找到直接返回 |
| 查找插入位置 | 模板二（lowerBound） | 第一个 >= target 的位置 |
| 查找左边界 | 模板二 | 条件为 `nums[mid] < target` |
| 查找右边界 | 模板三 | 条件为 `nums[mid] <= target` |
| 旋转数组查找 | 判断有序区间 | 哪半边有序就在哪半边判断 |
| 峰值查找 | 比较相邻元素 | 向更大的方向收缩 |
| 二维矩阵查找 | 两次二分 / 坐标映射 | 将一维索引映射到二维坐标 |

## 本章题目

| 题号 | 题目 | 难度 | 核心技巧 |
|------|------|------|----------|
| 114 | 搜索插入位置 | 简单 | lowerBound 模板 |
| 115 | 搜索二维矩阵 | 中等 | 二维到一维坐标映射 |
| 116 | 寻找峰值 | 中等 | 二分逼近峰值 |
| 117 | 搜索旋转排序数组 | 中等 | 判断有序区间 |
| 118 | 在排序数组中查找元素的第一个和最后一个位置 | 中等 | 左边界 + 右边界 |
| 119 | 寻找旋转排序数组中的最小值 | 中等 | 旋转数组的二分变体 |
| 120 | 寻找两个正序数组的中位数 | 困难 | 二分划分 + 边界处理 |
