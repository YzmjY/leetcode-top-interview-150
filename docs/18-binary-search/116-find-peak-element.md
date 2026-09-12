# 116. 寻找峰值

## 题目描述

峰值元素是指其值严格大于左右相邻值的元素。

给你一个整数数组 `nums`，找到峰值元素并返回其索引。数组可能包含多个峰值，在这种情况下，返回**任何一个峰值**所在位置即可。

你可以假设 `nums[-1] = nums[n] = -∞`。

你必须实现时间复杂度为 O(log n) 的算法来解决此问题。

### 示例 1

```
输入：nums = [1,2,3,1]
输出：2
解释：3 是峰值元素，你的函数应该返回其索引 2。
```

### 示例 2

```
输入：nums = [1,2,1,3,5,6,4]
输出：1 或 5 
解释：你的函数可以返回索引 1（峰值元素为 2），或者返回索引 5（峰值元素为 6）。
```

### 约束条件

- `1 <= nums.length <= 1000`
- `-2^31 <= nums[i] <= 2^31 - 1`
- 对于所有有效的 `i` 都有 `nums[i] != nums[i + 1]`

## 题目分析

### 算法思路

**朴素想法**：从头到尾扫一遍，任何一个满足 `nums[i-1] < nums[i] > nums[i+1]` 的位置就是峰值（下标越界时把边界视为 `-∞`）。这需要 O(n)，不满足题目 O(log n) 的要求。

**关键观察**：数组虽然整体无序，但「峰值」是一个**局部**性质。如果我们站在某个位置 `mid` 上，只看 `nums[mid]` 与 `nums[mid+1]` 这一对相邻元素，就能判断峰值（至少一个峰值）在左半边还是右半边：

- 若 `nums[mid] < nums[mid+1]`，从 `mid` 到 `mid+1` 是**上升**的。此时若一路向右爬到边界，边界是 `-∞`，那么「先升后降」必然在某处出现一个峰，所以 `[mid+1, right]` 内一定存在峰值。收缩左边界 `left = mid + 1`。
- 若 `nums[mid] > nums[mid+1]`（相邻元素互异，不可能相等），从 `mid` 开始就是向下的。同理，`[left, mid]` 内一定存在峰值。收缩右边界 `right = mid`。

这样每次排除一半区间，最终 `left == right` 指向一个峰值。

**为什么二分有效？** 题目保证相邻元素不相等，并且边界视为 `-∞`。每次我们向「更高」的方向收缩，就像沿着山坡往上走，无论走哪边都一定能到达某个峰顶，不会走进死胡同。

### 为什么正确（不变量论证）

维护如下不变量：在当前区间 `[left, right]` 上，

- 若 `left > 0`，则 `nums[left-1] < nums[left]`（区间左端在「上升」）；
- 若 `right < n-1`，则 `nums[right] > nums[right+1]`（区间右端在「下降」）。

**区间内最大值是全局峰值**：设 `nums[left..right]` 的最大值在下标 `p`。区间内与 `p` 相邻的元素都 `< nums[p]`（相邻元素互异）。若 `p == left`，则左邻居是 `nums[left-1] < nums[left]` 或边界 `-∞`；若 `p == right`，则右邻居是 `nums[right+1] < nums[right]` 或边界 `-∞`。故 `p` 是峰值。

**不变量保持**：

- 初始 `[0, n-1]` 没有区间外邻居，边界按 `-∞` 处理，不变量空成立。
- 当 `nums[mid] < nums[mid+1]` 令 `left = mid+1` 后，新的左端点满足 `nums[left-1] = nums[mid] < nums[mid+1] = nums[left]`，左端条件成立；右端未变。
- 当 `nums[mid] > nums[mid+1]` 令 `right = mid` 后，新的右端点满足 `nums[right] = nums[mid] > nums[mid+1] = nums[right+1]`，右端条件成立；左端未变。

循环结束时 `left == right`，区间只有一个元素，它既是区间最大值又是峰值，返回 `left` 正确。

### 复杂度分析

- **时间复杂度**：O(log n)，每轮把区间缩小一半。
- **空间复杂度**：O(1)，只使用了常数级别的额外空间。

### 关键点

- 利用相邻元素严格不等的条件。
- 向更大的方向收缩一定不会错过峰值（这一步由上面的不变量论证保证）。
- 边界条件 `nums[-1] = nums[n] = -∞` 天然保证了峰值的存在性。
- 数组可能有多个峰值，算法只需返回其中任意一个；返回的 `left` 一定是一个真正的峰值，而不是局部高点以外的位置。

### 易错点 / 边界情况

- **单元素数组**：循环不执行，返回 0，`nums[0]` 按边界视为 `-∞` 即为峰值。
- **访问 `nums[mid+1]` 的越界风险**：循环条件是 `left < right`，`mid = left + (right-left)/2` 严格小于 `right ≤ n-1`，因此 `mid+1 ≤ n-1` 不会越界。
- **比较对象是 `mid` 与 `mid+1`**，收缩时 `left = mid+1`、`right = mid`，两边对 `mid` 的处理不同，别写反。
- **单调数组**：全升返回 `n-1`，全降返回 `0`，都是正确答案。
- **该算法依赖「相邻元素互异」**：如果允许相邻相等，向某侧收缩可能落到平台边缘而无法判定峰值，需要对相等情形单独处理。


### 交互演示

点击下方按钮逐步观察算法的执行过程：

<iframe
  src="../../assets/interactive/116-find-peak-element-demo.html"
  style="width:100%; min-height:550px; border:none; border-radius:8px; background:transparent;"
  title="寻找峰值 - 交互演示">
</iframe>

## Go 代码实现

```go
package main

import "fmt"

func findPeakElement(nums []int) int {
    left, right := 0, len(nums)-1
    for left < right {
        mid := left + (right-left)/2
        // 比较 mid 和 mid+1，判断峰值在哪一侧
        if nums[mid] < nums[mid+1] {
            // 上升趋势，峰值在右侧
            left = mid + 1
        } else {
            // 下降趋势，峰值在左侧（包括 mid）
            right = mid
        }
    }
    return left
}

func main() {
    testCases := [][]int{
        {1, 2, 3, 1},
        {1, 2, 1, 3, 5, 6, 4},
        {1},
        {1, 2},
        {2, 1},
    }

    for _, nums := range testCases {
        idx := findPeakElement(nums)
        fmt.Printf("nums = %v, 峰值索引 = %d, 峰值值 = %d\n",
            nums, idx, nums[idx])
    }
}
```
