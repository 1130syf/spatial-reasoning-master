#!/bin/bash

# PostureScan Pro 项目自动设置脚本
# 创建所有必要的文件夹和文件

echo "开始创建 PostureScan Pro 项目..."

# 创建基本目录结构
mkdir -p src/components
mkdir -p src/modules/patient
mkdir -p src/modules/posture
mkdir -p src/modules/analysis
mkdir -p src/modules/reports
mkdir -p src/modules/visualization
mkdir -p src/services
mkdir -p src/utils
mkdir -p public
mkdir -p app

echo "创建项目配置文件..."

# package.json
cat > package.json << 'EOF'
{
  "name": "posture-scan-pro",
  "version": "1.0.0",
  "description": "3D Posture Assessment System",
  "main": "app/main.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "^6.2.1",
    "chart.js": "^3.7.0"
  },
  "devDependencies": {
    "react-scripts": "5.0.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

echo "创建公共 HTML 文件..."

# public/index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="PostureScan Pro - 3D姿态评估系统" />
    <title>PostureScan Pro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <noscript>您需要启用 JavaScript 来运行此应用程序。</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

echo "创建 React 入口文件..."

# src/index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# src/index.css
cat > src/index.css << 'EOF'
:root {
  --primary-color: #0AC461;
  --primary-dark: #08a452;
  --accent-color: #1B1B1B;
  --text-color: #E0E0E0;
  --bg-dark: #121212;
  --bg-medium: #1E1E1E;
  --bg-light: #2D2D2D;
  --border-color: #333333;
  --error-color: #FF5252;
  --success-color: #4CAF50;
  --warning-color: #FFC107;
  
  --font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --border-radius: 6px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  --transition: all 0.3s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-dark);
  color: var(--text-color);
  line-height: 1.5;
}

html, body, #root {
  height: 100%;
}
EOF

# src/App.js
cat > src/App.js << 'EOF'
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';

// 导入组件占位符（开发时会替换为实际组件）
const PatientList = () => <div>患者列表</div>;
const PatientDetail = () => <div>患者详情</div>;
const PostureCapture = () => <div>姿态捕获</div>;
const PostureAnalysis = () => <div>姿态分析</div>;
const ReportGenerator = () => <div>报告生成器</div>;

import './App.css';

// 暂时占位组件
const TemporaryComponent = ({ title }) => (
  <div className="temporary-component">
    <h1>{title}</h1>
    <p>该功能正在开发中...</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<PatientList />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/patient/new" element={<TemporaryComponent title="新增患者" />} />
            <Route path="/patient/edit/:id" element={<TemporaryComponent title="编辑患者" />} />
            <Route path="/patient/:patientId/assessment/new" element={<PostureCapture />} />
            <Route path="/assessment/:assessmentId" element={<PostureAnalysis />} />
            <Route path="/assessment/preview" element={<PostureAnalysis />} />
            <Route path="/assessment/:assessmentId/report" element={<ReportGenerator />} />
            <Route path="/reports" element={<TemporaryComponent title="报告管理" />} />
            <Route path="/settings" element={<TemporaryComponent title="设置" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
EOF

# src/App.css
cat > src/App.css << 'EOF'
.app-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 通用按钮样式 */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 卡片样式 */
.card {
  background-color: var(--bg-medium);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 20px;
  margin-bottom: 20px;
}

/* 临时组件样式 */
.temporary-component {
  text-align: center;
  padding: 40px;
  background-color: var(--bg-medium);
  border-radius: var(--border-radius);
}

.temporary-component h1 {
  margin-bottom: 20px;
  color: var(--primary-color);
}
EOF

echo "创建基础组件..."

# src/components/Navigation.js
cat > src/components/Navigation.js << 'EOF'
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">PostureScan Pro</h1>
      </div>
      
      <ul className="nav-menu">
        <li>
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">仪表板</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/users" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">用户管理</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/capture" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📷</span>
            <span className="nav-text">姿态捕获</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/analysis" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">姿态分析</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📝</span>
            <span className="nav-text">报告管理</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">设置</span>
          </NavLink>
        </li>
      </ul>
      
      <div className="nav-footer">
        <p>PostureScan Pro</p>
        <p className="version">版本 1.0.0</p>
      </div>
    </nav>
  );
};

export default Navigation;
EOF

# src/components/Navigation.css
cat > src/components/Navigation.css << 'EOF'
.navigation {
  width: 260px;
  background-color: var(--bg-medium);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.nav-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-color);
}

.nav-title {
  color: var(--primary-color);
  font-size: 20px;
  margin: 0;
  font-weight: 700;
}

.nav-menu {
  list-style-type: none;
  padding: 16px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background-color: var(--bg-light);
  color: white;
}

.nav-link.active {
  background-color: rgba(10, 196, 97, 0.1);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-weight: 500;
  font-size: 14px;
}

.nav-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 12px;
  color: #888;
}

.version {
  color: #666;
  margin-top: 4px;
}
EOF

# src/components/Dashboard.js
cat > src/components/Dashboard.js << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    userCount: 0,
    assessmentCount: 0,
    postureCount: 0
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>欢迎使用 PostureScan Pro</h1>
        <p className="subtitle">3D姿态评估专业系统</p>
      </header>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-data">
            <h3 className="stat-value">{stats.userCount}</h3>
            <p className="stat-label">用户总数</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-data">
            <h3 className="stat-value">{stats.assessmentCount}</h3>
            <p className="stat-label">评估总数</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🧍</div>
          <div className="stat-data">
            <h3 className="stat-value">{stats.postureCount}</h3>
            <p className="stat-label">姿态评估</p>
          </div>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>快速操作</h2>
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/users')}>
            新增用户
          </button>
          <button className="btn-primary" onClick={() => navigate('/capture')}>
            开始姿态评估
          </button>
          <button className="btn-primary" onClick={() => navigate('/reports')}>
            查看报告
          </button>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>系统状态</h2>
        <div className="card status-card">
          <div className="status-item">
            <span className="status-icon success">✓</span>
            <span className="status-text">系统运行正常</span>
          </div>
          <div className="status-item">
            <span className="status-icon success">✓</span>
            <span className="status-text">数据库已连接</span>
          </div>
          <div className="status-item">
            <span className="status-icon success">✓</span>
            <span className="status-text">相机已准备就绪</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
EOF

# src/components/Dashboard.css
cat > src/components/Dashboard.css << 'EOF'
.dashboard {
  max-width: 1200px;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.subtitle {
  color: #aaa;
  font-size: 16px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: linear-gradient(145deg, #1e1e1e, #252525);
  border-radius: var(--border-radius);
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: var(--box-shadow);
}

.stat-icon {
  font-size: 36px;
  margin-right: 20px;
  width: 60px;
  height: 60px;
  background-color: rgba(10, 196, 97, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-data {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  color: #aaa;
  font-size: 14px;
}

.dashboard-section {
  margin-bottom: 40px;
}

.dashboard-section h2 {
  font-size: 20px;
  margin-bottom: 16px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.status-card {
  padding: 24px;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: bold;
}

.status-icon.success {
  background-color: var(--success-color);
  color: white;
}

.status-icon.warning {
  background-color: var(--warning-color);
  color: black;
}

.status-icon.error {
  background-color: var(--error-color);
  color: white;
}

.status-text {
  font-size: 16px;
}
EOF

# 创建README文件
cat > README.md << 'EOF'
# PostureScan Pro

3D姿态评估专业系统

## 项目简介

PostureScan Pro是一款专业的3D姿态评估系统，用于捕获、分析和可视化人体姿态数据。该系统旨在帮助医疗专业人员、物理治疗师和健身教练进行精准的姿态评估和治疗跟踪。

## 功能特点

- 实时3D姿态捕获与分析
- 多视角（正面、侧面、俯视）姿态数据可视化
- 患者管理和历史记录追踪
- 专业评估报告生成
- 数据导出和分享

## 技术栈

- React
- React Router
- Chart.js (数据可视化)

## 使用说明

1. 安装依赖: `npm install`
2. 启动开发服务器: `npm start`
3. 构建生产版本: `npm run build`

## 项目结构

- `/src/components`: 通用组件
- `/src/modules`: 功能模块组件
  - `/patient`: 患者管理模块
  - `/posture`: 姿态捕获模块
  - `/analysis`: 姿态分析模块
  - `/reports`: 报告生成模块
  - `/visualization`: 数据可视化组件
- `/src/services`: 服务层
- `/src/utils`: 工具函数

## 许可证

版权所有 © 2023 PostureScan Pro
EOF

echo "创建占位文件..."

# 创建各个模块的占位文件
touch src/modules/patient/PatientList.js
touch src/modules/patient/PatientDetail.js
touch src/modules/posture/PostureCapture.js
touch src/modules/analysis/PostureAnalysis.js
touch src/modules/reports/ReportGenerator.js

echo "PostureScan Pro 项目结构创建完成！"
echo "使用以下命令安装依赖并启动项目:"
echo "npm install"
echo "npm start"
