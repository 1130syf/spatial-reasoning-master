import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { FaUserFriends, FaVideo, FaChartBar, FaCog, FaRunning } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  // This is a simplified list for the welcome page, the main navigation is in Layout.js
  const featureItems = [
    { path: '/personnel', icon: <FaUserFriends />, title: '人员管理', description: '添加、编辑和管理用户信息' },
    { path: '/motion-correction', icon: <FaRunning />, title: '运动纠正', description: '实时分析标准深蹲等动作' },
    { path: '/reports', icon: <FaChartBar />, title: '报告管理', description: '查看和管理分析报告' },
  ];

  return (
    <div className="home-dashboard">
      <main className="main-content" style={{width: '100%', padding: '20px'}}>
        <header className="main-header">
          <h1>欢迎使用 AI健身辅助平台</h1>
          <p>请从左侧菜单中选择一个功能开始，或通过下方卡片快速访问核心功能。</p>
        </header>
        
        <section className="features-grid">
          {featureItems.map((item) => (
            <div key={item.path} className="feature-card" onClick={() => handleNavigation(item.path)}>
              <div className="feature-icon">{item.icon}</div>
              <div className="feature-text">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default HomePage;
