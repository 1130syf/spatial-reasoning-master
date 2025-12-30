/**
 * 初始化状态监控组件
 * 用于显示MediaPipe初始化进度和状态
 */

import React, { useEffect, useState } from 'react';

const InitializationMonitor = ({ sessionState, onInitializationComplete }) => {
  const [detectionStatus, setDetectionStatus] = useState({
    poseDetected: false,
    frameCount: 0,
    lastAngle: 0,
    confidence: 0
  });

  useEffect(() => {
    // 监听控制台日志，提取初始化相关信息
    const originalLog = console.log;
    let frameCount = 0;

    console.log = (...args) => {
      const message = args.join(' ');

      // 检测姿态检测信息
      if (message.includes('初始化帧计数:')) {
        const count = parseInt(message.match(/初始化帧计数:\s*(\d+)/)?.[1] || 0);
        frameCount = count;
        setDetectionStatus(prev => ({
          ...prev,
          frameCount: count,
          poseDetected: count > 0
        }));
      }

      // 检测角度计算信息
      if (message.includes('膝盖角度:') || message.includes('检测到')) {
        const angleMatch = message.match(/(\d+\.?\d*)/);
        if (angleMatch) {
          setDetectionStatus(prev => ({
            ...prev,
            lastAngle: parseFloat(angleMatch[1])
          }));
        }
      }

      // 检测初始化完成
      if (message.includes('初始化完成')) {
        onInitializationComplete?.();
      }

      // 调用原始log
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, [onInitializationComplete]);

  if (sessionState !== 'INITIALIZING') {
    return null;
  }

  const progress = Math.min((detectionStatus.frameCount / 15) * 100, 100);

  return (
    <div className="initialization-monitor">
      <div className="monitor-header">
        <h3>🎯 正在初始化姿态检测系统</h3>
        <p>请在摄像头前保持站立姿势，系统正在校准...</p>
      </div>

      <div className="monitor-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {detectionStatus.frameCount}/15 帧稳定检测
        </span>
      </div>

      <div className="monitor-status">
        <div className={`status-item ${detectionStatus.poseDetected ? 'active' : ''}`}>
          <div className="status-icon">
            {detectionStatus.poseDetected ? '✅' : '⏳'}
          </div>
          <div className="status-text">
            <strong>姿态检测</strong>
            <span>{detectionStatus.poseDetected ? '已检测到人体姿态' : '正在检测姿态...'}</span>
          </div>
        </div>

        {detectionStatus.lastAngle > 0 && (
          <div className="status-item">
            <div className="status-icon">📐</div>
            <div className="status-text">
              <strong>实时角度</strong>
              <span>{detectionStatus.lastAngle.toFixed(1)}°</span>
            </div>
          </div>
        )}

        <div className="status-item">
          <div className="status-icon">📹</div>
          <div className="status-text">
            <strong>摄像头状态</strong>
            <span>正在处理视频流...</span>
          </div>
        </div>
      </div>

      <div className="monitor-tips">
        <h4>💡 提示：</h4>
        <ul>
          <li>确保全身都在摄像头视野内</li>
          <li>保持光线充足，避免背光</li>
          <li>站立姿势，双臂自然下垂</li>
          <li>与摄像头保持2-3米距离</li>
        </ul>
      </div>

      <style jsx>{`
        .initialization-monitor {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          z-index: 1000;
          min-width: 320px;
          max-width: 400px;
        }

        .monitor-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .monitor-header h3 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 18px;
        }

        .monitor-header p {
          margin: 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.4;
        }

        .monitor-progress {
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4299e1, #3182ce);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          display: block;
          text-align: center;
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .monitor-status {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .status-item.active {
          background: #edf2ff;
          border-color: #4299e1;
        }

        .status-icon {
          font-size: 20px;
          width: 24px;
          text-align: center;
        }

        .status-text {
          flex: 1;
        }

        .status-text strong {
          display: block;
          color: #2d3748;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .status-text span {
          display: block;
          color: #718096;
          font-size: 12px;
        }

        .monitor-tips {
          background: #fef5e7;
          border: 1px solid #f6e05e;
          border-radius: 8px;
          padding: 16px;
        }

        .monitor-tips h4 {
          margin: 0 0 8px 0;
          color: #d69e2e;
          font-size: 14px;
        }

        .monitor-tips ul {
          margin: 0;
          padding-left: 16px;
        }

        .monitor-tips li {
          margin: 4px 0;
          color: #744210;
          font-size: 12px;
          line-height: 1.4;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .status-item:not(.active) .status-icon {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default InitializationMonitor;