/**
 * 实时调试信息显示组件
 * 用于显示姿态检测角度和动作状态
 */

import React, { useEffect, useState } from 'react';

const RealtimeDebugInfo = ({ sessionState, currentKneeAngle, currentElbowAngle, exerciseType }) => {
  const [angleHistory, setAngleHistory] = useState([]);
  const [lastAngles, setLastAngles] = useState({ knee: 180, elbow: 180 });
  const [detectionStatus, setDetectionStatus] = useState('等待检测...');

  useEffect(() => {
    // 监听控制台日志，提取角度信息
    const originalLog = console.log;

    console.log = (...args) => {
      const message = args.join(' ');

      // 检测姿态检测信息
      if (message.includes('姿态检测')) {
        const kneeMatch = message.match(/膝盖角度:\s*(\d+\.?\d*)/);
        const hipMatch = message.match(/髋部角度:\s*(\d+\.?\d*)/);

        if (kneeMatch) {
          const kneeAngle = parseFloat(kneeMatch[1]);
          setLastAngles(prev => ({ ...prev, knee: kneeAngle }));

          // 添加到历史记录（保留最近20个数据点）
          setAngleHistory(prev => {
            const newHistory = [...prev, { type: 'knee', value: kneeAngle, time: Date.now() }];
            return newHistory.slice(-20);
          });
        }

        if (hipMatch) {
          const hipAngle = parseFloat(hipMatch[1]);
          setDetectionStatus(`髋部: ${hipAngle.toFixed(1)}°`);
        }
      }

      // 检测二头弯举信息
      if (message.includes('二头弯举检测')) {
        // 匹配新的调试格式: 左肘: X°, 右肘: Y°, 平均: Z°
        const avgAngleMatch = message.match(/平均:\s*(\d+\.?\d*)°/);
        const leftElbowMatch = message.match(/左肘:\s*(\d+\.?\d*)°/);
        const rightElbowMatch = message.match(/右肘:\s*(\d+\.?\d*)°/);

        if (avgAngleMatch) {
          const avgAngle = parseFloat(avgAngleMatch[1]);
          setLastAngles(prev => ({ ...prev, elbow: avgAngle }));

          setAngleHistory(prev => {
            const newHistory = [...prev, { type: 'elbow', value: avgAngle, time: Date.now() }];
            return newHistory.slice(-20);
          });
        }

        // 如果有左右肘的详细数据，也显示在状态中
        if (leftElbowMatch && rightElbowMatch) {
          const leftAngle = parseFloat(leftElbowMatch[1]);
          const rightAngle = parseFloat(rightElbowMatch[1]);
          setDetectionStatus(`左:${leftAngle.toFixed(0)}° 右:${rightAngle.toFixed(0)}°`);
        } else {
          const stateMatch = message.match(/状态:\s*(\w+)/);
          if (stateMatch) {
            setDetectionStatus(stateMatch[1]);
          }
        }
      }

      // 检测动作开始/结束
      if (message.includes('检测到深蹲开始') || message.includes('检测到二头弯举开始')) {
        setDetectionStatus('🟢 动作开始');
      }
      if (message.includes('检测到深蹲结束') || message.includes('检测到二头弯举结束')) {
        setDetectionStatus('🔴 动作结束');
      }

      // 调用原始log
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  // 获取当前显示的角度
  const getCurrentAngle = () => {
    if (exerciseType === 'squat') {
      return lastAngles.knee;
    } else if (exerciseType === 'bicep-curl') {
      return lastAngles.elbow;
    }
    return 180;
  };

  // 获取角度颜色
  const getAngleColor = (angle, type) => {
    if (type === 'squat') {
      // 深蹲：膝盖角度越小表示蹲得越低
      if (angle < 120) return '#10b981'; // 绿色 - 深蹲中
      if (angle < 150) return '#f59e0b'; // 黄色 - 浅蹲
      return '#ef4444'; // 红色 - 站立
    } else if (type === 'bicep-curl') {
      // 二头弯举：肘部角度越小表示弯曲越大
      if (angle < 90) return '#10b981'; // 绿色 - 弯曲
      if (angle < 130) return '#f59e0b'; // 黄色 - 半弯曲
      return '#ef4444'; // 红色 - 伸展
    }
    return '#6b7280';
  };

  const currentAngle = getCurrentAngle();
  const angleColor = getAngleColor(currentAngle, exerciseType);

  if (sessionState === 'LOADING' || sessionState === 'CONFIG' || sessionState === 'COMPLETE') {
    return null;
  }

  return (
    <div className="realtime-debug-info">
      <div className="debug-header">
        <h4>🎯 实时动作检测</h4>
        <span className="exercise-type">
          {exerciseType === 'squat' ? '深蹲模式' : '二头弯举模式'}
        </span>
      </div>

      <div className="angle-display">
        <div className="angle-value" style={{ color: angleColor }}>
          {currentAngle.toFixed(1)}°
        </div>
        <div className="angle-label">
          {exerciseType === 'squat' ? '膝盖角度' : '肘部角度'}
        </div>
      </div>

      <div className="status-indicator">
        <div className="status-dot"></div>
        <span className="status-text">{detectionStatus}</span>
      </div>

      <div className="angle-guide">
        <div className="guide-title">动作阈值:</div>
        {exerciseType === 'squat' ? (
          <>
            <div className="guide-item">
              <span className="guide-label">开始下蹲:</span>
              <span className="guide-value">&lt; 120°</span>
            </div>
            <div className="guide-item">
              <span className="guide-label">完全站起:</span>
              <span className="guide-value">&gt; 150°</span>
            </div>
          </>
        ) : (
          <>
            <div className="guide-item">
              <span className="guide-label">开始弯举:</span>
              <span className="guide-value">&lt; 160°</span>
            </div>
            <div className="guide-item">
              <span className="guide-label">达到峰值:</span>
              <span className="guide-value">&lt; 100°</span>
            </div>
            <div className="guide-item">
              <span className="guide-label">完全伸展:</span>
              <span className="guide-value">&gt; 160°</span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .realtime-debug-info {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 12px;
          backdrop-filter: blur(10px);
          z-index: 1000;
          min-width: 200px;
        }

        .debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .debug-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .exercise-type {
          background: rgba(59, 130, 246, 0.8);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .angle-display {
          text-align: center;
          margin-bottom: 12px;
        }

        .angle-value {
          font-size: 32px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .angle-label {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .status-text {
          font-size: 11px;
          font-weight: 500;
        }

        .angle-guide {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 12px;
        }

        .guide-title {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .guide-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 10px;
        }

        .guide-label {
          opacity: 0.7;
        }

        .guide-value {
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default RealtimeDebugInfo;