import React from 'react';
import './AngleGauge.css'; // Import its own CSS

const AngleGauge = ({ angle, label = '实时膝盖角度', type = 'knee' }) => {
  // Ensure angle is a number, default to 0 if not
  const displayAngle = typeof angle === 'number' ? angle : 0;
  // Calculate rotation for the gauge fill. Max 180 degrees for a half-circle.
  // Assuming 0-180 range for knee angle, map it to -90 to +90 for visual rotation.
  const rotation = Math.max(-90, Math.min(90, (displayAngle / 180) * 180 - 90));

  // 获取角度状态和颜色
  const getAngleStatus = (angle, type) => {
    if (type === 'knee') {
      // 深蹲角度范围：90-110度为正常
      if (angle >= 90 && angle <= 110) return { status: 'good', color: '#10b981' };
      if (angle >= 85 && angle <= 115) return { status: 'warning', color: '#f59e0b' };
      return { status: 'bad', color: '#ef4444' };
    } else {
      // 其他角度偏差：±5度为正常
      const absAngle = Math.abs(angle);
      if (absAngle <= 5) return { status: 'good', color: '#10b981' };
      if (absAngle <= 10) return { status: 'warning', color: '#f59e0b' };
      return { status: 'bad', color: '#ef4444' };
    }
  };

  const angleStatus = getAngleStatus(displayAngle, type);

  return (
    <div className="gauge-container">
      <div className="gauge-background"></div>
      <div
        className="gauge-fill gauge-fill--dynamic"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: `linear-gradient(to right, ${angleStatus.color}dd, ${angleStatus.color})`
        }}
      ></div>
      <div className="gauge-cover">
        <span
          className={`gauge-value gauge-value--${angleStatus.status}`}
          style={{ color: angleStatus.color }}
        >
          {displayAngle.toFixed(0)}°
        </span>
        <span className="gauge-label">{label}</span>
        {/* 状态指示器 */}
        <div className={`gauge-status-indicator gauge-status--${angleStatus.status}`}></div>
      </div>
    </div>
  );
};

export default AngleGauge;
