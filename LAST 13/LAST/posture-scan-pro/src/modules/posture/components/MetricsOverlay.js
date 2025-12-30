import React, { useRef, useEffect } from 'react';
import './MetricsOverlay.css';

// 角度偏差状态评估函数
const getAngleStatus = (angle, type) => {
  if (type === 'knee') {
    // 深蹲角度范围：90-110度为正常
    if (angle >= 90 && angle <= 110) return 'good';
    if (angle >= 85 && angle <= 115) return 'warning';
    return 'bad';
  } else {
    // 其他角度偏差：±5度为正常
    const absAngle = Math.abs(angle);
    if (absAngle <= 5) return 'good';
    if (absAngle <= 10) return 'warning';
    return 'bad';
  }
};

// Enhanced SVG for the human silhouette with identifiable parts.
const HumanSilhouette = ({ highlightedParts = [], problemParts = [] }) => {
  const isPartHighlighted = (part) => highlightedParts.includes(part);
  const isPartProblem = (part) => problemParts.includes(part);

  return (
    <svg viewBox="0 0 100 250" className="human-silhouette">
      <g fill="#e0e0e0" opacity="0.3">
        {/* Head */}
        <circle
          id="head"
          cx="50"
          cy="20"
          r="15"
          className={
            isPartProblem('head') ? 'problem' :
            isPartHighlighted('head') ? 'highlighted' : ''
          }
        />
        {/* Torso */}
        <rect
          id="trunk"
          x="30"
          y="35"
          width="40"
          height="70"
          rx="10"
          className={
            isPartProblem('trunk') ? 'problem' :
            isPartHighlighted('trunk') ? 'highlighted' : ''
          }
        />
        {/* Left Arm */}
        <rect
          id="leftElbow"
          x="10"
          y="40"
          width="15"
          height="80"
          rx="7"
          className={
            isPartProblem('leftElbow') ? 'problem' :
            isPartHighlighted('leftElbow') ? 'highlighted' : ''
          }
        />
        {/* Right Arm */}
        <rect
          id="rightElbow"
          x="75"
          y="40"
          width="15"
          height="80"
          rx="7"
          className={
            isPartProblem('rightElbow') ? 'problem' :
            isPartHighlighted('rightElbow') ? 'highlighted' : ''
          }
        />
        {/* Left Leg */}
        <rect
          id="leftKnee"
          x="30"
          y="105"
          width="15"
          height="100"
          rx="7"
          className={
            isPartProblem('leftKnee') ? 'problem' :
            isPartHighlighted('leftKnee') ? 'highlighted' : ''
          }
        />
        {/* Right Leg */}
        <rect
          id="rightKnee"
          x="55"
          y="105"
          width="15"
          height="100"
          rx="7"
          className={
            isPartProblem('rightKnee') ? 'problem' :
            isPartHighlighted('rightKnee') ? 'highlighted' : ''
          }
        />
      </g>
    </svg>
  );
};

// Pre-defined positions for metrics on the static model (in percentages)
const METRIC_POSITIONS = {
  leftKnee: { top: '70%', left: '28%' },
  rightKnee: { top: '70%', right: '28%' },
  // Use a more robust centering method for the trunk.
  trunk: { top: '45%', left: '50%', marginLeft: '-60px' },
  leftElbow: { top: '50%', left: '15%' },
  rightElbow: { top: '50%', right: '15%' },
};

const MetricsOverlay = ({ metrics, dataBoxRefs }) => {
  // Extract the 'type' from each metric to determine which parts to highlight
  const highlightedParts = metrics.map(m => m.type);

  // 识别异常部位（状态为warning或bad的部位）
  const problemParts = metrics
    .filter(m => {
      const status = getAngleStatus(m.value, m.type);
      return status === 'warning' || status === 'bad';
    })
    .map(m => m.type);

  return (
    <div className="metrics-overlay-container">
      <div className="model-container left">
        <HumanSilhouette highlightedParts={highlightedParts} problemParts={problemParts} />
        {metrics.filter(m => m.position === 'left').map(metric => {
          const status = getAngleStatus(metric.value, metric.type);
          return (
            <div
              key={metric.label}
              ref={el => dataBoxRefs.current[metric.label] = el}
              className={`data-box status-${status}`}
              style={METRIC_POSITIONS[metric.type]}
            >
              <div className="data-value">{metric.value.toFixed(0)}°</div>
              <div className="data-label">{metric.label}</div>
            </div>
          );
        })}
      </div>
      <div className="model-container right">
        <HumanSilhouette highlightedParts={highlightedParts} problemParts={problemParts} />
        {metrics.filter(m => m.position === 'right').map(metric => {
          const status = getAngleStatus(metric.value, metric.type);
          return (
            <div
              key={metric.label}
              ref={el => dataBoxRefs.current[metric.label] = el}
              className={`data-box status-${status}`}
              style={METRIC_POSITIONS[metric.type]}
            >
              <div className="data-value">{metric.value.toFixed(0)}°</div>
              <div className="data-label">{metric.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsOverlay;
