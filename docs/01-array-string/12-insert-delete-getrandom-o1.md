# 12. O(1) 时间插入、删除和获取随机元素

## 题目描述

实现 `RandomizedSet` 类：

- `RandomizedSet()` 初始化 `RandomizedSet` 对象
- `bool insert(int val)` 当元素 `val` 不存在时，向集合中插入该项，并返回 `true`；否则，返回 `false`。
- `bool remove(int val)` 当元素 `val` 存在时，从集合中移除该项，并返回 `true`；否则，返回 `false`。
- `int getRandom()` 随机返回现有集合中的一项（测试用例保证调用此方法时集合中至少存在一个元素）。每个元素应该有 **相同的概率** 被返回。

你必须实现类的所有函数，并满足每个函数的 **平均** 时间复杂度为 O(1)。

**示例：**

```
输入
["RandomizedSet", "insert", "remove", "insert", "getRandom", "remove", "insert", "getRandom"]
[[], [1], [2], [2], [], [1], [2], []]
输出
[null, true, false, true, 2, true, false, 2]

解释
RandomizedSet randomizedSet = new RandomizedSet();
randomizedSet.insert(1); // 向集合中插入 1。返回 true 表示 1 被成功地插入。
randomizedSet.remove(2); // 返回 false，表示集合中不存在 2。
randomizedSet.insert(2); // 向集合中插入 2。返回 true。集合现在包含 [1,2]。
randomizedSet.getRandom(); // getRandom 应随机返回 1 或 2。
randomizedSet.remove(1); // 从集合中移除 1，返回 true。集合现在包含 [2]。
randomizedSet.insert(2); // 2 已在集合中，所以返回 false。
randomizedSet.getRandom(); // 由于 2 是集合中唯一的数字，getRandom 总是返回 2。
```

**约束条件：**

- `-2^31 <= val <= 2^31 - 1`
- 最多调用 `insert`、`remove` 和 `getRandom` 函数 `2 * 10^5` 次
- 在调用 `getRandom` 时，数据结构中至少存在一个元素

## 题目分析

**算法思路：** 使用哈希表 + 动态数组的组合。哈希表提供 O(1) 的查找，动态数组提供 O(1) 的随机访问。

- **insert**：将元素追加到数组末尾，并在哈希表中记录 `val -> index`
- **remove**：为了 O(1) 删除数组中间的元素，将数组最后一个元素移动到被删除元素的位置（覆盖），然后更新哈希表中的索引，最后删除数组末尾和哈希表条目
- **getRandom**：利用 `math/rand` 生成随机索引，从数组中返回对应元素

**时间复杂度：** 所有操作均为 O(1) 平均时间复杂度。

**空间复杂度：** O(n)，存储所有元素。

## Go 代码实现

```go
package main

import "math/rand"

// RandomizedSet 使用哈希表 + 动态数组实现 O(1) 的插入、删除和随机获取
type RandomizedSet struct {
    // nums 存储所有元素的值
    nums []int
    // valToIdx 记录每个值在 nums 中的索引，用于 O(1) 查找和删除
    valToIdx map[int]int
}

// Constructor 初始化 RandomizedSet
func Constructor() RandomizedSet {
    return RandomizedSet{
        nums:     make([]int, 0),
        valToIdx: make(map[int]int),
    }
}

// Insert 插入元素 val，如果已存在返回 false，否则返回 true
func (this *RandomizedSet) Insert(val int) bool {
    if _, exists := this.valToIdx[val]; exists {
        return false
    }
    // 追加到数组末尾，记录索引
    this.valToIdx[val] = len(this.nums)
    this.nums = append(this.nums, val)
    return true
}

// Remove 删除元素 val，如果不存在返回 false，否则返回 true
func (this *RandomizedSet) Remove(val int) bool {
    idx, exists := this.valToIdx[val]
    if !exists {
        return false
    }

    // 获取数组最后一个元素
    lastIdx := len(this.nums) - 1
    lastVal := this.nums[lastIdx]

    // 将最后一个元素移动到要删除元素的位置（覆盖）
    this.nums[idx] = lastVal
    this.valToIdx[lastVal] = idx

    // 删除数组末尾元素和哈希表中的条目
    this.nums = this.nums[:lastIdx]
    delete(this.valToIdx, val)

    return true
}

// GetRandom 随机返回集合中的一个元素，每个元素等概率
func (this *RandomizedSet) GetRandom() int {
    randomIdx := rand.Intn(len(this.nums))
    return this.nums[randomIdx]
}
```
