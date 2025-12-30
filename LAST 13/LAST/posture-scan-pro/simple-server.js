/**
 * 简单的静态文件服务器 - 用于快速启动前端应用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SRC_DIR = path.join(__dirname, 'src');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

  // 如果在public目录没找到文件，尝试在src目录查找
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SRC_DIR, req.url);
  }

  // 如果是目录，返回index.html
  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 如果文件不存在，返回基本的React应用页面
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PostureScan Pro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; }
            .container { max-width: 800px; margin: 0 auto; text-align: center; }
            .loading { font-size: 24px; margin: 50px 0; }
            .error { color: #ffcc00; background: rgba(255,0,0,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
            .links a { display: inline-block; margin: 10px; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; }
            .links a:hover { background: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏃‍♂️ PostureScan Pro</h1>
            <div class="loading">⚡ 正在加载中...</div>
            <p>React应用开发服务器正在启动中，请稍候...</p>

            <div class="error">
              <strong>📋 当前状态:</strong><br>
              • 后端服务: ✅ http://localhost:3001 (已运行)<br>
              • 前端服务: ⚠️ 正在尝试启动<br>
              • 文件请求: ${req.url}
            </div>

            <div class="links">
              <a href="http://localhost:3001/api/health">检查后端状态</a>
              <a href="/">刷新页面</a>
            </div>

            <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
              <p><strong>如需完整功能，请在终端执行:</strong></p>
              <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; text-align: left;">
cd "c:\\Users\\旧城以西\\Desktop\\MyFile\\LAST\\LAST 13\\LAST\\posture-scan-pro"
npm start</pre>
            </div>
          </div>

          <script>
            // 每5秒尝试重新加载页面
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          </script>
        </body>
        </html>
      `);
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 简易服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 服务目录: ${PUBLIC_DIR}`);
  console.log(`🔗 后端API: http://localhost:3001`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});