# 行测立体拼合大师 🧩

> 帮助公考考生通过交互式 3D 演示，掌握立体拼合题型

## 项目简介

这是一个专门为公务员考试（公考）考生设计的立体拼合学习工具。通过 3D 动画演示，让学生直观理解三块小立体图如何拼合成大立体图的完整过程。

## 核心功能

- ✨ **分步动画演示**: 自动播放拼合过程，每步配有文字说明
- 🎮 **手动步进模式**: 上一步/下一步控制，从任意角度观察
- 👁️ **多视角切换**: 俯视、侧视、前视、自由视角、透视模式
- 🎯 **聚焦核心功能**: 以"演示教学"为核心，降低学习难度

## 技术栈

- **前端框架**: Vue.js 3 (Composition API)
- **3D 引擎**: Three.js
- **UI 样式**: Tailwind CSS
- **动画库**: GSAP
- **状态管理**: Pinia

## 项目结构

```
spatial-reasoning-master/
├── docs/              # 项目文档
├── src/               # 源代码
│   ├── components/    # Vue 组件
│   ├── views/         # 页面视图
│   ├── utils/         # 工具函数
│   └── data/          # 题目数据
├── public/            # 静态资源
├── tests/             # 测试文件
├── PRD.md             # 产品需求文档
└── README.md          # 项目说明
```

## 开发进度

- [x] 项目规划与 PRD 编写
- [x] GitHub 仓库创建
- [x] 项目框架搭建
- [x] 3D 渲染功能
- [x] 动画演示系统
- [x] 多视角切换
- [ ] 题库系统（后续）

## 快速开始

⚠️ **如果遇到 npm 权限问题，请查看 [安装指南](INSTALL_GUIDE.md)**

```bash
# 方法 1: 使用 npm
npm install
npm run dev

# 方法 2: 使用 pnpm（推荐，避免权限问题）
npm install -g pnpm
pnpm install
pnpm dev

# 方法 3: 在线运行（无需安装）
# 访问 https://stackblitz.com/ 导入 GitHub 仓库
```

安装成功后，访问: http://localhost:3000

详细安装说明请查看: [INSTALL_GUIDE.md](INSTALL_GUIDE.md)

## 演示题目

首版将实现一道经典立体拼合真题的完整演示，包含：
- 目标大立体图（15 个立方体）
- 三块小立体图（7块 + 5块 + 5块）
- 灰色方块位置匹配逻辑

## 作者

Created with ❤️ for 公考考生

## 许可证

MIT License
