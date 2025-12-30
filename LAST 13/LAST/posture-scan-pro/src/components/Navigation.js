import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaUserFriends,
  FaVideo,
  FaChartBar,
  FaCog,
  FaHome
} from 'react-icons/fa'; // 导入图标，需要安装react-icons
import './SideNavigation.css';

const SideNavigation = ({ activePage, onPageChange }) => {
  const location = useLocation();

  // 判断当前路由路径
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/') onPageChange('home');
    else if (path.includes('/personnel') || path.includes('/patient')) onPageChange('personnel');
    else if (path.includes('/posture-capture') || path.includes('/assessment')) onPageChange('capture');
    else if (path.includes('/reports')) onPageChange('reports');
    else if (path.includes('/settings')) onPageChange('settings');
  }, [location, onPageChange]);

  return (
    <div className="side-navigation">
      <div className="nav-header">
        <h1 className="logo">AI健身<span>智能辅助平台</span></h1>
      </div>

      <ul className="nav-menu">
        <li className={activePage === 'home' ? 'active' : ''}>
          <NavLink to="/" className="nav-link home-link">
            <FaHome className="nav-icon" />
            <span className="nav-text">首页</span>
          </NavLink>
        </li>

        <li className={activePage === 'personnel' ? 'active' : ''}>
          <NavLink to="/personnel" className="nav-link personnel-link">
            <FaUserFriends className="nav-icon" />
            <span className="nav-text">人员管理</span>
          </NavLink>
        </li>

        <li className={activePage === 'capture' ? 'active' : ''}>
          <NavLink to="/posture-capture" className="nav-link capture-link">
            <FaVideo className="nav-icon" />
            <span className="nav-text">姿态捕获</span>
          </NavLink>
        </li>

        <li className={activePage === 'reports' ? 'active' : ''}>
          <NavLink to="/reports" className="nav-link reports-link">
            <FaChartBar className="nav-icon" />
            <span className="nav-text">报告管理</span>
          </NavLink>
        </li>

        <li className={activePage === 'settings' ? 'active' : ''}>
          <NavLink to="/settings" className="nav-link settings-link">
            <FaCog className="nav-icon" />
            <span className="nav-text">设置</span>
          </NavLink>
        </li>
      </ul>

      <div className="nav-footer">
        <p>© {new Date().getFullYear()} Posture</p>
      </div>
    </div>
  );
};

export default SideNavigation;