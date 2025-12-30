# 安装指南 📦

## 问题说明

当前遇到 npm 缓存权限问题（EPERM），无法自动安装依赖。这是因为系统对 `D:\ProgrammingTools\node-v18.0.0-win-x64\node_cache` 目录的访问限制。

---

## 解决方案

### 方案 1: 更改 npm 缓存路径（推荐）

1. **打开新的 PowerShell 窗口（以管理员身份）**

2. **设置新的缓存路径**
```powershell
npm config set cache "C:\Users\旧城以西\AppData\Roaming\npm-cache"
```

3. **进入项目目录**
```powershell
cd c:\Users\旧城以西\Desktop\MyFile\LAST
```

4. **安装依赖**
```powershell
npm install
```

5. **启动开发服务器**
```powershell
npm run dev
```

---

### 方案 2: 使用 pnpm 代替 npm

pnpm 不依赖全局缓存，可以避免权限问题。

1. **全局安装 pnpm**
```powershell
npm install -g pnpm
```

2. **使用 pnpm 安装依赖**
```powershell
cd c:\Users\旧城以西\Desktop\MyFile\LAST
pnpm install
```

3. **启动开发服务器**
```powershell
pnpm dev
```

---

### 方案 3: 手动删除缓存后重试

1. **关闭所有 Node.js 进程**
```powershell
taskkill /F /IM node.exe
taskkill /F /IM npm.exe
```

2. **删除缓存目录**
```powershell
Remove-Item -Recurse -Force "D:\ProgrammingTools\node-v18.0.0-win-x64\node_cache\_cacache\tmp"
```

3. **安装依赖**
```powershell
npm install
```

---

### 方案 4: 使用在线开发环境（无需本地安装）

访问以下在线平台，导入 GitHub 仓库即可直接运行：

1. **StackBlitz** (推荐)
   - 访问: https://stackblitz.com/
   - 点击 "Import from GitHub"
   - 输入: `1130syf/spatial-reasoning-master`
   - 自动启动开发环境

2. **CodeSandbox**
   - 访问: https://codesandbox.io/
   - 点击 "Import Project"
   - 输入: `1130syf/spatial-reasoning-master`

3. **GitHub Codespaces**
   - 访问: https://github.com/1130syf/spatial-reasoning-master
   - 点击 "Code" -> "Codespaces" -> "New codespace"

---

## 验证安装成功

安装完成后，运行：

```bash
npm run dev
```

应该看到：

```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

然后在浏览器打开: http://localhost:3000

---

## 项目依赖列表

如果手动安装，需要以下依赖：

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "three": "^0.160.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 常见问题

### Q: npm install 很慢怎么办？
A: 使用国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: 端口 3000 被占用？
A: 修改 [vite.config.js](vite.config.js) 中的端口：
```js
server: {
  port: 3001, // 改为其他端口
}
```

### Q: 如何查看 Three.js 版本？
A: 运行 `npm list three`

---

## 下一步

安装成功后：

1. ✅ 访问 http://localhost:3000
2. ✅ 查看 3D 演示
3. ✅ 测试播放控制
4. ✅ 尝试视角切换
5. ✅ 调整播放速度

---

**需要帮助？** 请查看 GitHub Issues: https://github.com/1130syf/spatial-reasoning-master/issues
