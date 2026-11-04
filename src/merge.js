/** LeetCode 88: copy these lines together as the Go submission. */
export const GO_CODE = Object.freeze([
  'func merge(nums1 []int, m int, nums2 []int, n int) {',
  '    i, j, k := m-1, n-1, m+n-1',
  '    for j >= 0 {',
  '        if i >= 0 && nums1[i] > nums2[j] {',
  '            nums1[k] = nums1[i]',
  '            i--',
  '        } else {',
  '            nums1[k] = nums2[j]',
  '            j--',
  '        }',
  '        k--',
  '    }',
  '}',
]);

const LIMIT = 1_000_000_000;

function validateValues(values, name) {
  for (const value of values) {
    if (!Number.isInteger(value) || Math.abs(value) > LIMIT) {
      throw new Error(`${name} 的每一项都必须是 -10⁹ 到 10⁹ 之间的整数。`);
    }
  }
}

function validateSorted(values, length, name) {
  for (let index = 1; index < length; index += 1) {
    if (values[index - 1] > values[index]) {
      throw new Error(`${name} 必须按非递减顺序排列。`);
    }
  }
}

function validateInput(nums1, m, nums2, n) {
  if (!Array.isArray(nums1) || !Array.isArray(nums2)) {
    throw new Error('nums1 和 nums2 必须是数组。');
  }
  if (![m, n].every((value) => Number.isInteger(value) && value >= 0 && value <= 200)) {
    throw new Error('m 和 n 必须是 0 到 200 之间的整数。');
  }
  if (m + n < 1 || m + n > 200) {
    throw new Error('m + n 必须在 1 到 200 之间。');
  }
  if (nums1.length !== m + n) {
    throw new Error('nums1 的长度必须等于 m + n，请为合并结果保留足够位置。');
  }
  if (nums2.length !== n) {
    throw new Error('nums2 的长度必须等于 n。');
  }
  validateValues(nums1, 'nums1');
  validateValues(nums2, 'nums2');
  validateSorted(nums1, m, 'nums1 的前 m 个有效元素');
  validateSorted(nums2, n, 'nums2');
}

/** Parse a comma-separated decimal integer array, with optional square brackets. */
export function parseArray(text) {
  if (typeof text !== 'string') {
    throw new Error('请输入用逗号分隔的整数数组。');
  }
  let content = text.trim();
  if (content.startsWith('[') && content.endsWith(']')) {
    content = content.slice(1, -1).trim();
  }
  if (!content) return [];

  const values = content.split(',').map((item, index) => {
    const token = item.trim();
    if (!/^[+-]?\d+$/u.test(token)) {
      throw new Error(`第 ${index + 1} 项不是有效整数，请检查空项、小数或文字。`);
    }
    return Number(token);
  });
  validateValues(values, '数组');
  return values;
}

/**
 * Build independent snapshots of the in-place reverse merge, without mutating inputs.
 * sortedFrom is inclusive; write frames keep the read pointers until the move frame.
 * comparisons counts only numeric comparisons, excluding an exhausted-input check.
 */
export function buildMergeTrace(nums1, m, nums2, n) {
  validateInput(nums1, m, nums2, n);
  const a = [...nums1];
  const b = [...nums2];
  const frames = [];
  let i = m - 1;
  let j = n - 1;
  let k = m + n - 1;
  let sortedFrom = a.length;
  let comparisons = 0;
  let writes = 0;

  function addFrame(phase, selected, writeIndex, lines, title, description) {
    frames.push({
      phase,
      a: [...a],
      b: [...b],
      i,
      j,
      k,
      sortedFrom,
      selected,
      writeIndex,
      lines: [...lines],
      title,
      description,
      comparisons,
      writes,
    });
  }

  addFrame(
    'initial', null, null, [1, 2], '从数组尾部开始',
    `i = ${i} 指向 nums1 的最后一个有效元素，j = ${j} 指向 nums2 尾部，k = ${k} 指向下一个写入位置。有效范围由 m 和 n 决定，零也可以是真实数据。`,
  );

  while (j >= 0) {
    const hasBoth = i >= 0;
    const selected = hasBoth && a[i] > b[j] ? 'a' : 'b';
    const source = selected === 'a' ? 'nums1' : 'nums2';
    const sourceIndex = selected === 'a' ? i : j;
    const value = selected === 'a' ? a[i] : b[j];
    if (hasBoth) comparisons += 1;

    let description;
    if (!hasBoth) {
      description = `nums1 的有效元素已耗尽，直接取 nums2[${j}] = ${b[j]}，无需比较数值。`;
    } else if (a[i] === b[j]) {
      description = `nums1[${i}] 和 nums2[${j}] 都是 ${value}；条件使用 >，相等时选择 nums2。下一步写入 nums1[${k}]。`;
    } else {
      description = `比较 nums1[${i}] = ${a[i]} 与 nums2[${j}] = ${b[j]}，较大的 ${value} 来自 ${source}，下一步写入 nums1[${k}]。`;
    }
    addFrame('compare', selected, null, [3, 4], hasBoth ? '选择当前较大的元素' : '复制 nums2 剩余元素', description);

    a[k] = value;
    writes += 1;
    sortedFrom = k;
    addFrame(
      'write', selected, k, selected === 'a' ? [5] : [7, 8], '写入目标位置',
      `将 ${source}[${sourceIndex}] = ${value} 写入 nums1[${k}]。此帧保留读取时的指针，索引 ${k} 起的后缀已就位。`,
    );

    if (selected === 'a') i -= 1;
    else j -= 1;
    k -= 1;
    addFrame(
      'move', selected, null, selected === 'a' ? [6, 11] : [9, 11], '向左移动指针',
      `${selected === 'a' ? 'i' : 'j'} 和 k 各向左移动一格；现在 i = ${i}、j = ${j}、k = ${k}。已确认的后缀从索引 ${sortedFrom} 开始。`,
    );
  }

  sortedFrom = 0;
  addFrame(
    'done', null, null, [3, 12, 13], '合并完成',
    n === 0
      ? 'nums2 为空，nums1 的有效元素已经有序，直接完成；比较 0 次，写入 0 次。'
      : `nums2 已全部合入，nums1 剩余前缀保持原位，整个数组已有序。共比较 ${comparisons} 次，写入 ${writes} 次。`,
  );
  return frames;
}
