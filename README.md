# 序场 · 面试经典 150 题

全新实现的算法交互笔记，覆盖力扣官方 **面试经典 150 题**的全部 150 题、23 个分组。

保留统一的白底、蓝色强调、衬线标题和易读字号；讲解按题目采用核心观察、流程、判断分支、纵向过程、角色对比或状态推导。每题都有原理、关键条件、边界说明、真实算法状态和同步高亮的 Go 代码；9 道适合图解的题目附带标注示意图。

## 本地运行

在线站点：https://yzmjy.github.io/leetcode-top-interview-150/

GitHub Pages 从 `feat/algorithm-lab` 分支通过 `.github/workflows/deploy.yml` 自动发布。推送后依次执行全部测试、语法检查和静态打包，再部署 `dist/`。发布包由实际模块依赖闭包组成，不包含开发服务、测试、文档或本地运行记录。

可运行 `npm run build:pages` 在本地生成相同的静态发布包。入口使用相对资源路径，兼容 GitHub Pages 仓库子目录。

需要 Node.js 22 或更新版本，无须安装依赖。

```powershell
npm run dev
```

访问 http://127.0.0.1:5173 。可通过环境变量 `PORT` 选择其他端口。

```powershell
npm test
npm run check
npm run check:go
```

## 操作

- 自动播放 / 暂停、上一步、下一步、拖动进度、速度切换、从头演示。
- 键盘左右箭头切换步骤，空格播放 / 暂停；编辑输入时不拦截按键。
- 页眉右侧“题目索引”可搜索题号、题名、类别并筛选难度；页尾可以切换上一题 / 下一题。
- 地址使用 `?problem=题号`，例如 `?problem=124`，可直接打开或分享某一道题。
- 编辑输入采用 JSON 参数，并附带默认例和边界例快捷入口。展示区使用紧凑格式，矩阵按行排列。
- 数组、字符串、栈、链表、树、图、Trie、矩阵、状态表、区间、位运算分别呈现对应结构。
- 链表按真实 next 关系重排原节点，分步展示断链、反转、接回与删除；节点编号保持不变，重复值也可追踪。
- 树翻转保留左右槽位；堆的上浮、下沉及跨堆移动逐次展示实体交换；四叉树构建同时展示输入区域与输出树。
- 节点移动使用连续轨迹，连接线跟随位置更新；系统偏好减少动态效果时直接显示目标状态。
- 下标和指针使用 Go 中的变量名；右开边界位于数组外时显示独立边界标记。
- Go 展示代码经过 gofmt 格式化；原始步骤通过词法 token 对齐和语句锚点映射到展示行，复制得到同一份格式化代码。
- 示例规模按题目限制，避免大规模回溯或不合法结构让演示失去可观察性；非法输入显示明确错误。

`check:go` 需要 Go 工具链，会为平台提供的节点类型补充编译桩，分别编译全部 150 份解法。

## 维护与验证

- `src/catalog-data.js`：官方题单顺序与分组。
- `src/lessons-a.js` / `lessons-b.js` / `lessons-c.js`：逐题算法、示例、Go 源码与状态记录。
- `src/strategies.js` / `reasoning.js`：逐题讲解布局、原理和边界。
- `src/scenes.js` / `explainers.js`：动态数据结构与必要图解。
- `src/linked-layout.js` / `tree-layout.js`：保留节点身份和结构关系的布局；`scene-player.js` / `scene-motion.js`：节点与连线的连续过渡。
- `src/presentation.js` / `go-display.js`：紧凑示例、格式化 Go 和高亮映射。
- 修改 Go 源码后运行 `node scripts/format-go.mjs` 重生展示代码及行映射，再运行完整检查。
- Node 测试覆盖所有默认例、每题至少两组边界例、结构身份、高亮映射、教学内容和审查回归。

题单来源：https://leetcode.cn/studyplan/top-interview-150/

题目来源：https://leetcode.cn/problems/merge-sorted-array/

视觉与交互参考：用户提供的「三数之和 · 序场算法实验室」。

本分支 `feat/algorithm-lab` 从独立历史的空分支开始；旧版保留于 `master`，没有读取或复用旧版实现。
