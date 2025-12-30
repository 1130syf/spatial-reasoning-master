# PostureScan Pro 摄像头黑屏问题修复指南

## 问题描述
运动纠正模块摄像头显示黑屏，无法正常使用。

## 问题分析
经过代码分析，发现以下几个可能导致摄像头黑屏的原因：

1. **摄像头权限问题** - 浏览器未获得摄像头访问权限
2. **视频流未准备就绪** - MediaPipe Camera 在视频流未准备好时就开始初始化
3. **分辨率设置过高** - 默认1280x720分辨率对某些设备过高
4. **设备兼容性问题** - 某些摄像头或浏览器不兼容当前配置
5. **HTTPS协议要求** - 现代浏览器要求在安全环境下访问摄像头

## 已实施的修复方案

### 1. 改进的摄像头初始化逻辑
- **等待视频流准备就绪**: 在视频流 readyState === 4 时才开始 MediaPipe 初始化
- **降级分辨率策略**: 优先使用 640x480，失败时自动降级到 320x240
- **增强错误处理**: 提供详细的错误日志和恢复机制

### 2. 优化的 Webcam 组件配置
```javascript
<Webcam
  ref={webcamRef}
  mirrored={true}
  audio={false}
  videoConstraints={{
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    facingMode: "user",
    frameRate: { ideal: 30 }
  }}
  onUserMedia={(stream) => {
    console.log('摄像头媒体流获取成功');
  }}
  onUserMediaError={(error) => {
    console.error('摄像头媒体流错误:', error);
  }}
/>
```

### 3. 摄像头管理器工具
创建了 `CameraUtils.js` 模块，提供：
- 权限检查和请求
- 设备枚举和选择
- 优化约束配置
- 错误恢复机制

### 4. 诊断工具
创建了 `camera_troubleshooting.html` 诊断页面，帮助用户排查摄像头问题。

## 使用步骤

### 第一步：运行诊断工具
1. 在浏览器中打开 `camera_troubleshooting.html`
2. 按照页面指示依次检查：
   - 浏览器权限
   - 摄像头设备
   - 摄像头功能测试
   - 浏览器兼容性

### 第二步：检查浏览器设置
1. **允许摄像头权限**：
   - 在地址栏左侧找到摄像头图标
   - 点击并选择"允许"访问摄像头
   - 刷新页面

2. **检查 HTTPS 连接**：
   - 确保使用 https:// 或 http://localhost 访问
   - 如果使用 IP 地址访问，请切换到 localhost

3. **关闭占用摄像头的应用**：
   - 关闭 Zoom、Teams、Skype 等视频会议应用
   - 关闭其他可能使用摄像头的网页或应用

### 第三步：测试修复效果
1. 访问 http://localhost:3000
2. 导航到运动纠正模块
3. 选择深蹲或二头弯举训练
4. 观察摄像头是否正常显示

### 第四步：如果仍有问题
如果摄像头仍然黑屏，请尝试：

1. **清除浏览器缓存**：
   - 按 Ctrl+Shift+Delete 清除缓存和 Cookie
   - 重新访问应用

2. **更换浏览器**：
   - 推荐使用 Chrome 90+、Firefox 88+、Edge 90+
   - 避免使用 Safari 或较旧的浏览器版本

3. **检查系统权限**：
   - Windows: 设置 → 隐私 → 摄像头 → 允许应用访问摄像头
   - macOS: 系统偏好设置 → 安全性与隐私 → 隐私 → 摄像头

4. **硬件检查**：
   - 确保摄像头正确连接
   - 在其他应用中测试摄像头是否工作
   - 更新摄像头驱动程序

## 技术细节

### 修复的关键代码变更

#### ExerciseAnalysisPage.js
```javascript
// 等待视频流准备就绪
const waitForVideoReady = () => {
  if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
    try {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && poseRef.current && webcamRef.current.video.readyState === 4) {
            await poseRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,  // 降低分辨率
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    } catch (error) {
      // 备用低分辨率方案
      const fallbackCamera = new cam.Camera(webcamRef.current.video, {
        width: 320,
        height: 240,
        // ...相同配置
      });
      fallbackCamera.start();
      cameraRef.current = fallbackCamera;
    }
  } else {
    setTimeout(waitForVideoReady, 100);
  }
};
```

#### BicepCurlAnalysisPage.js
- 应用相同的修复逻辑
- 增强错误处理和日志记录

## 预期效果

修复后应该看到：
1. ✅ 摄像头权限请求对话框正常显示
2. ✅ 摄像头视频流在 Canvas 上正常显示
3. ✅ MediaPipe 姿态检测正常工作
4. ✅ 关节点和骨骼线正确绘制
5. ✅ 运动纠正功能正常响应

## 日志监控

打开浏览器开发者工具（F12），在 Console 选项卡中查看：
- "摄像头初始化成功，分辨率: 640x480"
- "ExerciseAnalysis: Webcam user media obtained"
- "摄像头媒体流获取成功"

如果看到这些日志，说明摄像头修复成功。

## 故障排除联系

如果按照以上步骤仍然无法解决问题，请：
1. 截图浏览器控制台的错误信息
2. 提供使用的浏览器版本和操作系统
3. 描述具体的操作步骤和现象

---
**修复完成时间**: 2025-12-20
**修复范围**: 运动纠正模块摄像头显示问题