# 序场 · 面试经典 150 题

全新实现的算法交互笔记。目前仅实现官方题单第一题 **88. 合并两个有序数组**，供首题验收。

## 本地运行

需要 Node.js 22 或更新版本，无须安装依赖。

```powershell
npm run dev
```

访问 http://127.0.0.1:5173 。可通过环境变量 `PORT` 选择其他端口。

```powershell
npm test
npm run check
```

## 操作

- 自动播放 / 暂停、上一步、下一步、拖动进度、速度切换、从头演示。
- 键盘左右箭头切换步骤，空格播放 / 暂停；编辑输入时不拦截按键。
- 编辑数组时填写两个非递减数组的有效元素，自动计算 m、n 并补齐预留位置。
- Go 代码与动画步骤同步，可复制用于力扣。

题单来源：https://leetcode.cn/studyplan/top-interview-150/

题目来源：https://leetcode.cn/problems/merge-sorted-array/

视觉与交互参考：用户提供的「三数之和 · 序场算法实验室」。

本分支 `feat/algorithm-lab` 为独立历史的空分支；旧版保留于 `master`。未复用旧版代码，尚未制作其他题目。
