# 第15章：回溯 (Backtracking)

## 概述

回溯算法是一种通过探索所有可能的候选解来找出所有解的算法。如果候选解被确认不是一个解（或者至少不是最后一个解），回溯算法会通过在上一步进行一些变化**撤销**该候选解，即**回溯**，并尝试另一种可能性。

回溯的本质是**深度优先搜索 + 状态重置**。

## 回溯算法通用模板

```go
func backtrack(路径, 选择列表) {
    if 满足结束条件 {
        收集结果
        return
    }

    for 选择 in 选择列表 {
        做选择
        backtrack(路径, 新的选择列表)
        撤销选择  // 回溯的精髓
    }
}
```

### 核心三要素

1. **选择（Choose）**：在当前状态下，从可选集合中选择一个元素加入路径
2. **递归（Recurse）**：基于新的路径状态继续搜索
3. **撤销（Undo）**：恢复到选择之前的状态，以便尝试其他选项

## 常见问题类型与模板

### 1. 组合问题（Combinations）

从 N 个数中选 K 个，不考虑顺序。

```go
func combine(n int, k int) [][]int {
    result := [][]int{}
    path := []int{}

    var backtrack func(start int)
    backtrack = func(start int) {
        if len(path) == k {
            tmp := make([]int, k)
            copy(tmp, path)
            result = append(result, tmp)
            return
        }
        // 剪枝：剩余元素不足以填满 k 个时提前返回
        for i := start; i <= n-(k-len(path))+1; i++ {
            path = append(path, i)
            backtrack(i + 1)  // 组合：下一层从 i+1 开始
            path = path[:len(path)-1]
        }
    }
    backtrack(1)
    return result
}
```

### 2. 排列问题（Permutations）

N 个元素的全排列，考虑顺序，使用 visited 数组。

```go
func permute(nums []int) [][]int {
    result := [][]int{}
    path := []int{}
    used := make([]bool, len(nums))

    var backtrack func()
    backtrack = func() {
        if len(path) == len(nums) {
            tmp := make([]int, len(path))
            copy(tmp, path)
            result = append(result, tmp)
            return
        }
        for i := 0; i < len(nums); i++ {
            if used[i] {
                continue
            }
            used[i] = true
            path = append(path, nums[i])
            backtrack()
            path = path[:len(path)-1]
            used[i] = false
        }
    }
    backtrack()
    return result
}
```

### 3. 子集问题（Subsets）

收集所有可能的子集。

```go
func subsets(nums []int) [][]int {
    result := [][]int{}
    path := []int{}

    var backtrack func(start int)
    backtrack = func(start int) {
        // 每个节点都是一个有效子集
        tmp := make([]int, len(path))
        copy(tmp, path)
        result = append(result, tmp)

        for i := start; i < len(nums); i++ {
            path = append(path, nums[i])
            backtrack(i + 1)
            path = path[:len(path)-1]
        }
    }
    backtrack(0)
    return result
}
```

## 剪枝策略

剪枝是回溯算法优化的核心手段，可以大幅减少无效搜索。

### 常见剪枝技巧

1. **可行性剪枝**：当前路径不可能产生有效解时提前返回
   - 例：组合总和问题中，当前和已超过目标值
   
2. **最优性剪枝**：当前路径不可能优于已知最优解时返回
   
3. **排序后剪枝**：对输入排序后，可以基于顺序规律剪枝
   - 例：组合总和 II 中跳过重复元素

4. **对称性剪枝**：利用对称性避免重复搜索
   - 例：N 皇后问题中，利用左右对角线对称

5. **记忆化剪枝**：缓存已计算过的状态

## 回溯 vs 动态规划

| 维度 | 回溯 | 动态规划 |
|------|------|---------|
| 目标 | 求所有解 | 求最优解 |
| 方式 | 穷举 + 剪枝 | 状态转移 |
| 重叠子问题 | 可能有，但每个都遍历 | 利用重叠，只算一次 |
| 典型问题 | 组合、排列、N皇后 | 背包、LCS、编辑距离 |

## 本章题目

| 题号 | 题目 | 核心知识点 |
|------|------|-----------|
| 101 | 电话号码的字母组合 | 多集合组合，回溯基础 |
| 102 | 组合 | 组合模板，剪枝 |
| 103 | 全排列 | 排列模板，visited 数组 |
| 104 | 组合总和 | 可重复选择的组合，剪枝 |
| 105 | N 皇后 II | 约束满足，对角线判重 |
| 106 | 括号生成 | 括号合法性约束，剪枝 |
| 107 | 单词搜索 | 网格回溯，原地标记 |
