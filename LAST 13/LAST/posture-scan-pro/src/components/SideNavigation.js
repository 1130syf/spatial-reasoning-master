import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaUserFriends, FaVideo, FaChartBar, FaCog } from 'react-icons/fa'; // 添加轮子图标
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
  }, [location, onPageChange]);

  return (
    <div className="side-navigation">
      <div className="nav-header">
        <h1 className="logo">AI健身<span>智能辅助平台</span></h1>
      </div>

      <ul className="nav-menu">
        {/* 三个主要栏目 */}
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
            <span className="nav-text">查看报告</span>
          </NavLink>
        </li>
      </ul>

      <div className="nav-footer">
        <p>© {new Date().getFullYear()} AI健身辅助平台</p>
      </div>
    </div>
  );
};

export default SideNavigation;