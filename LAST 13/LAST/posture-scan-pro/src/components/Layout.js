import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTrainingSession } from '../contexts/TrainingSessionContext';
import './Layout.css';
import { FaHome, FaUserFriends, FaVideo, FaChartBar, FaCog, FaRunning, FaDatabase, FaBone, FaChartPie } from 'react-icons/fa';

const menuItems = [
  { path: '/', icon: <FaHome />, title: '主页', parentPaths: [] },
  { path: '/personnel', icon: <FaUserFriends />, title: '人员管理', parentPaths: ['/patient/'] },
  { path: '/posture-capture', icon: <FaVideo />, title: '姿态捕捉', requiresPatient: true, parentPaths: [] },
  { path: '/spinal-curvature', icon: <FaBone />, title: '脊柱弯曲度检测', parentPaths: ['/spinal-curvature-report'] },
  // MODIFIED: Renamed "Standard Squat" to "Motion Correction"
  { path: '/motion-correction', icon: <FaRunning />, title: '运动纠正', parentPaths: ['/standard-squat'] },
  { path: '/reports', icon: <FaChartBar />, title: '报告管理', parentPaths: ['/assessment/'] },
  { path: '/statistics', icon: <FaChartPie />, title: '数据展示', parentPaths: [] },
  { path: '/dataset', icon: <FaDatabase />, title: '数据集', parentPaths: [] },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTrainingActive, exerciseType } = useTrainingSession();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const handleNavigation = (item) => {
    if (item.requiresPatient) {
      return;
    }
    
    // 检查是否正在训练中且不是当前页面
    if (isTrainingActive && item.path !== location.pathname) {
      // 显示警告模态框
      setPendingNavigation(item.path);
      setShowWarningModal(true);
      return;
    }
    
    navigate(item.path);
  };

  const confirmNavigation = () => {
    setShowWarningModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowWarningModal(false);
    setPendingNavigation(null);
  };

  const isNavItemActive = (item) => {
    if (item.path === location.pathname) {
      return true;
    }
    return item.parentPaths.some(parentPath => location.pathname.startsWith(parentPath));
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>AI健身辅助平台</h1>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item ${isNavItemActive(item) ? 'active' : ''} ${item.requiresPatient ? 'disabled' : ''}`}
              onClick={() => handleNavigation(item)}
              title={item.requiresPatient ? '请先从"人员管理"中选择一位人员开始分析' : item.title}
            >
              <div className="nav-item-icon">{item.icon}</div>
              <span className="nav-item-title">{item.title}</span>
            </div>
          ))}
        </nav>
        <footer className="sidebar-footer">
          <p>© 2025 AI健身辅助平台</p>
        </footer>
      </aside>
      <main className="main-content">
        {children}
      </main>
        
      {/* 训练警告模态框 */}
      {showWarningModal && (
        <div className="modal-overlay" onClick={cancelNavigation}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ 训练进行中</h2>
            <p>您当前正在进行{exerciseType === 'squat' ? '深蹲' : '二头弯举'}训练。</p>
            <p>请先点击"结束训练"按钮结束当前训练，再切换页面。</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-primary" onClick={cancelNavigation}>
                继续训练
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
