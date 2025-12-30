# StackBlitz 在线运行指南 🚀

StackBlitz 是一个在线代码编辑器，可以直接在浏览器中运行 Vue + Three.js 项目，**无需本地安装任何依赖**。

---

## 📖 导入步骤

### 方法 1: 直接导入 GitHub 仓库（推荐）

1. **访问 StackBlitz**
   - 打开浏览器，访问: https://stackblitz.com/

2. **创建新项目**
   - 点击首页的 **"New Project"** 按钮
   - 或直接访问: https://stackblitz.com/

3. **选择导入模板**
   - 在搜索框输入 **"Vue"** 或 **"Vite"**
   - 选择 **"Vue + Vite"** 模板

4. **导入 GitHub 仓库**
   - 点击右上角的 **"Import from GitHub"**
   - 在弹出的输入框中输入: `1130syf/spatial-reasoning-master`
   - 完整地址: `https://github.com/1130syf/spatial-reasoning-master`
   - 点击 **"Import"**

5. **等待安装**
   - StackBlitz 会自动安装依赖（约 1-2 分钟）
   - 安装完成后会自动启动开发服务器

6. **预览项目**
   - 右侧面板会自动显示预览
   - 或点击顶部的 **"Open in new tab"** 在新标签页打开

---

### 方法 2: 使用 GitHub 直接链接

1. **直接访问项目链接**
   - 访问: https://stackblitz.com/github/1130syf/spatial-reasoning-master
   - StackBlitz 会自动打开并导入项目

2. **等待加载**
   - 等待依赖安装完成（约 1-2 分钟）
   - 会自动启动预览

---

### 方法 3: 从 GitHub 页面启动

1. **访问你的 GitHub 仓库**
   - 打开: https://github.com/1130syf/spatial-reasoning-master

2. **修改 URL（如果支持）**
   - 将 `github.com` 替换为 `stackblitz.com/github`
   - 例如: `https://stackblitz.com/github/1130syf/spatial-reasoning-master`

---

## 🎯 使用 StackBlitz

### 界面说明

```
┌─────────────────────────────────────────┐
│  StackBlitz 界面                         │
├──────────────┬──────────────────────────┤
│              │                          │
│  代码编辑器   │      预览面板             │
│  (左侧)      │      (右侧)              │
│              │                          │
│  - src/      │      [3D 演示界面]        │
│  - package.json  │                      │
│  - App.vue   │                          │
│              │                          │
└──────────────┴──────────────────────────┘
```

### 常用操作

1. **查看预览**
   - 右侧面板默认显示预览
   - 点击 **"Open in new tab"** 可全屏查看

2. **编辑代码**
   - 左侧编辑器可以直接修改代码
   - 保存后会自动热重载

3. **查看控制台**
   - 点击底部的 **"Console"** 标签
   - 查看错误信息和日志

4. **调整预览大小**
   - 拖动编辑器和预览之间的分隔线
   - 或点击预览面板的 **"Fullscreen"** 按钮

---

## ✅ 验证运行成功

导入成功后，你应该看到：

1. **3D 演示区域** - 显示大立体图和三块小立体图
2. **控制面板** - 播放、暂停、视角切换等按钮
3. **无控制台错误** - Console 标签没有红色错误

---

## 🐛 常见问题

### Q1: 导入后显示空白？
**解决方案:**
- 等待 2-3 分钟让依赖完全安装
- 查看底部 Console 是否有错误
- 刷新页面重新加载

### Q2: 提示 "Port 3000 is already in use"?
**解决方案:**
- StackBlitz 会自动使用其他端口（如 3001）
- 无需手动处理

### Q3: Three.js 加载失败？
**解决方案:**
- 检查 `package.json` 中 Three.js 版本
- 确认依赖已完全安装（查看 Console）
- 尝试重启项目（点击顶部重启按钮）

### Q4: 预览窗口很小？
**解决方案:**
- 点击预览面板右上角的 **"Open in new tab"**
- 在新标签页中全屏查看

### Q5: 代码保存后没有更新？
**解决方案:**
- 等待几秒，热重载有延迟
- 或点击顶部工具栏的刷新按钮

---

## 📝 StackBlitz 限制

### 免费版限制
- ✅ 可以运行项目
- ✅ 可以编辑代码
- ✅ 可以导出代码
- ❌ 无法永久保存（会话关闭后清除）
- ❌ 无法推送到 GitHub（需要升级）

### 建议
- StackBlitz 适合**快速预览和测试**
- 长期开发建议使用**本地环境**
- 导出代码到本地后继续开发

---

## 💡 导出代码

如果你想将在 StackBlitz 中的修改保存到本地：

1. **导出项目**
   - 点击左上角的项目名称
   - 选择 **"Export as ZIP"**
   - 下载压缩包

2. **或者直接复制代码**
   - 在 StackBlitz 中编辑文件
   - 复制修改后的代码
   - 在本地对应文件中粘贴

---

## 🎬 完整视频演示

如果你更喜欢看视频教程：

1. 访问 StackBlitz 官方教程: https://www.youtube.com/c/stackblitz
2. 搜索 "StackBlitz import GitHub"
3. 按照视频步骤操作

---

## 📞 获取帮助

如果遇到问题：

1. **StackBlitz 文档**: https://stackblitz.com/docs
2. **GitHub Issues**: https://github.com/stackblitz/core/issues
3. **StackBlitz Discord**: https://discord.gg/stackblitz

---

## 🚀 快速开始链接

点击以下链接直接打开项目（自动导入）：

**👉 https://stackblitz.com/github/1130syf/spatial-reasoning-master**

（复制链接到浏览器打开）

---

## 总结

**最简单的步骤：**

1. 访问: https://stackblitz.com/github/1130syf/spatial-reasoning-master
2. 等待 2-3 分钟
3. 右侧自动显示 3D 演示

**就这么简单！** 🎉
