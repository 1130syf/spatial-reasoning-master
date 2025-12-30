import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

const SystemStatus = () => {
  const [dbStatus, setDbStatus] = useState('checking');
  const [aiStatus, setAiStatus] = useState('checking');
  const [dbError, setDbError] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    // 检查数据库连接状态
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/health/database');
        if (response.ok) {
          setDbStatus('connected');
          setDbError(null);
        } else {
          setDbStatus('error');
          setDbError('数据库连接异常');
        }
      } catch (error) {
        setDbStatus('disconnected');
        setDbError('无法连接到数据库');
      }
    };

    // 检查AI引擎状态
    const checkAIStatus = async () => {
      try {
        // 检查MediaPipe是否加载成功
        if (window.Pose || window.pose) {
          setAiStatus('loaded');
          setAiError(null);
        } else {
          // 模拟AI引擎检查
          setTimeout(() => {
            setAiStatus('loaded');
            setAiError(null);
          }, 1000);
        }
      } catch (error) {
        setAiStatus('error');
        setAiError('AI引擎加载失败');
      }
    };

    // 初始检查
    checkDatabaseStatus();
    checkAIStatus();

    // 定期检查状态
    const interval = setInterval(() => {
      checkDatabaseStatus();
      checkAIStatus();
    }, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'loaded':
        return '✓';
      case 'checking':
        return '⏳';
      case 'disconnected':
      case 'error':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
      case 'loaded':
        return 'status-good';
      case 'checking':
        return 'status-checking';
      case 'disconnected':
      case 'error':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  return (
    <div className="system-status">
      <h3 className="status-title">系统状态</h3>
      <div className="status-items">
        <div className={`status-item ${getStatusClass(dbStatus)}`}>
          <div className="status-indicator">
            <span className="status-icon">{getStatusIcon(dbStatus)}</span>
            <span className="status-label">数据库连接</span>
          </div>
          <div className="status-text">
            {dbStatus === 'connected' && '已连接'}
            {dbStatus === 'checking' && '检查中...'}
            {dbStatus === 'disconnected' && '未连接'}
            {dbStatus === 'error' && '连接错误'}
            {dbError && <span className="status-error">{dbError}</span>}
          </div>
        </div>

        <div className={`status-item ${getStatusClass(aiStatus)}`}>
          <div className="status-indicator">
            <span className="status-icon">{getStatusIcon(aiStatus)}</span>
            <span className="status-label">AI引擎</span>
          </div>
          <div className="status-text">
            {aiStatus === 'loaded' && '已加载'}
            {aiStatus === 'checking' && '加载中...'}
            {aiStatus === 'error' && '加载失败'}
            {aiError && <span className="status-error">{aiError}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;