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

**算法思路：** 题目要求三种操作都是平均 O(1)。哈希表查找是 O(1)，但无法「等概率随机取元素」；动态数组支持 O(1) 按下标随机访问，却在中间删除时是 O(n)。于是把两者结合：数组负责顺序存放元素并支持随机访问，哈希表 `valToIdx` 记录「值 → 数组下标」负责 O(1) 查找。难点只剩删除：要删中间元素又想保持 O(1)，就用「把数组最后一个元素搬到被删位置、再缩短数组」的办法，同时同步更新哈希表。因为 `insert` 会拒绝重复值，集合中元素两两不同，哈希表与数组严格一一对应，这种「搬移覆盖」不会产生歧义。

**算法步骤：**

- **Insert(val)：** 若 `valToIdx` 中已有 `val` 则返回 `false`；否则令 `valToIdx[val] = len(nums)`，把 `val` 追加到数组末尾，返回 `true`。
- **Remove(val)：** 若 `val` 不存在返回 `false`；否则取出 `idx = valToIdx[val]`、`lastIdx = len(nums)-1`、`lastVal = nums[lastIdx]`。执行 `nums[idx] = lastVal` 并把 `valToIdx[lastVal] = idx`（若 `idx == lastIdx` 这一步是自赋值，无害），再 `nums = nums[:lastIdx]` 丢弃末尾元素、`delete(valToIdx, val)`，返回 `true`。
- **GetRandom()：** 返回 `nums[rand.Intn(len(nums))]`。数组没有空洞且元素互不相同，所以每个元素被选中的概率都是 `1/len(nums)`。

**为什么正确：** 三种操作都保持不变量「对 `valToIdx` 中的每个键 `v` 都有 `nums[valToIdx[v]] == v`，且 `len(valToIdx) == len(nums)`」。`Insert` 只在末尾追加并记录下标，不变量显然成立；`Remove` 中被改动的只有被删元素所在的位置——末尾元素 `lastVal` 被搬到 `idx` 后，哈希表中它的下标同步改为 `idx`，而末尾元素随后被切除。正因不变量始终成立，`Remove` 通过 `valToIdx` 拿到的下标永远是最新位置，`GetRandom` 取出的每个值也都还在集合中，且分布均匀。

**时间复杂度：** 三种操作均为平均 O(1)。哈希表的插入/查找/删除平均 O(1)，数组的末尾追加与切片截断 O(1)（`append` 偶尔扩容，均摊后仍是 O(1)）。

**空间复杂度：** O(n)，数组与哈希表各存一份元素。

**易错点：**

- `Remove` 中更新哈希表的顺序不能反：必须先把 `valToIdx[lastVal]` 改成 `idx`，最后才 `delete(valToIdx, val)`。若先删 `val`，当被删的正好是末尾元素（`val == lastVal`）时，刚写好的映射又会被删掉。
- 不能漏掉「把末尾元素搬到 `idx`」这一步：否则被删的 `val` 会留在数组里（哈希表却已没有它的记录），而 `lastVal` 又被截断丢弃，数组与哈希表不再一致。
- 切片截断要写成 `nums = nums[:lastIdx]`：`lastIdx` 是删除前的最后一个下标，截断后长度减一。
- 边界：集合只剩一个元素时删除（`idx == lastIdx == 0`）必须能把集合变空；删除不存在的值返回 `false` 且集合不变；重复插入返回 `false` 且集合不变。
- `GetRandom` 依赖 `len(nums) > 0`，题目保证调用时集合非空；若为空会触发 `rand.Intn(0)` panic。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/12-insert-delete-getrandom-o1-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="O(1) 时间插入、删除和获取随机元素 - 交互演示">
</iframe>

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
