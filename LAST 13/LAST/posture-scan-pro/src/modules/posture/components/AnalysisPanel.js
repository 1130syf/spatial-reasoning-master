import React from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './AnalysisPanel.css';

const getBalanceClassName = (value) => {
  if (value === null || value === undefined) return 'value-na';
  if (value < 60) return 'value-bad';
  if (value < 80) return 'value-warning';
  return 'value-good';
};

// 角度偏差状态评估函数
const getAngleStatusClassName = (angle, normalRange = { min: -5, max: 5 }) => {
  if (angle === null || angle === undefined) return 'value-na';

  const absAngle = Math.abs(angle);
  if (absAngle <= normalRange.max) return 'value-good';      // 绿色 - 正常
  if (absAngle <= normalRange.max * 2) return 'value-warning'; // 黄色 - 警告
  return 'value-bad';                                        // 红色 - 异常
};

// 不同身体部位的正常角度范围定义
const ANGLE_RANGES = {
  head: { min: -10, max: 10 },      // 头部前倾/后仰
  shoulders: { min: -8, max: 8 },    // 肩部倾斜
  pelvis: { min: -6, max: 6 },      // 骨盆倾斜
  trunk: { min: -8, max: 8 },       // 躯干倾斜
  knees: { min: 90, max: 110 },     // 膝盖角度（深蹲时）
  plumbLine: { min: 0, max: 2 }     // 铅垂线偏移（cm）
};

const DataRow = ({ label, value, unit = '', className = '' }) => (
  <div className="metric-item">
    <span className="metric-label">{label}</span>
    <span className={`metric-value ${className}`}>
      {value !== null && value !== undefined ? `${value.toFixed(1)}${unit}` : 'N/A'}
    </span>
  </div>
);

const AnalysisPanel = ({ data, isDetecting, advice }) => {
  if (!isDetecting) {
    return (
      <aside className="analysis-panel">
        <div className="panel-header">
          <h3>实时分析</h3>
        </div>
        <div className="no-detection">
          <FaExclamationTriangle size={40} />
          <p>未检测到人体</p>
          <span>请确保完整身体位于摄像头视野内。</span>
        </div>
      </aside>
    );
  }

  const { balanceIndex, sagittalAngles, coronalAngles, transverseAngles, plumbLine } = data;

  return (
    <aside className="analysis-panel">
      <div className="panel-header">
        <h3>实时分析</h3>
        <span className="status-indicator">
          <FaCheckCircle /> 检测中
        </span>
      </div>
      
      <div className="panel-section">
        <h4>平衡指数</h4>
        <div className="metrics-grid">
          <DataRow label="总体平衡" value={balanceIndex.overall.value} unit="%" className={getBalanceClassName(balanceIndex.overall.value)} />
          <DataRow label="前后平衡" value={balanceIndex.sagittal.value} unit="%" className={getBalanceClassName(balanceIndex.sagittal.value)} />
          <DataRow label="左右平衡" value={balanceIndex.coronal.value} unit="%" className={getBalanceClassName(balanceIndex.coronal.value)} />
        </div>
      </div>

      <div className="panel-section">
        <h4>姿态角度 (°)</h4>
        <div className="metrics-grid">
          <DataRow
            label="头部前倾"
            value={sagittalAngles.head.value}
            className={getAngleStatusClassName(sagittalAngles.head.value, ANGLE_RANGES.head)}
          />
          <DataRow
            label="肩部水平"
            value={coronalAngles.shoulders.value}
            className={getAngleStatusClassName(coronalAngles.shoulders.value, ANGLE_RANGES.shoulders)}
          />
          <DataRow
            label="骨盆倾斜"
            value={coronalAngles.pelvis.value}
            className={getAngleStatusClassName(coronalAngles.pelvis.value, ANGLE_RANGES.pelvis)}
          />
          <DataRow
            label="肩部旋转"
            value={transverseAngles.shoulders.value}
            className={getAngleStatusClassName(transverseAngles.shoulders.value, ANGLE_RANGES.shoulders)}
          />
        </div>
      </div>

      <div className="panel-section">
        <h4>铅垂线分析 (cm)</h4>
        <div className="metrics-grid">
          <DataRow
            label="头部偏移"
            value={plumbLine.head.value}
            className={getAngleStatusClassName(plumbLine.head.value, ANGLE_RANGES.plumbLine)}
          />
          <DataRow
            label="肩部偏移"
            value={plumbLine.shoulders.value}
            className={getAngleStatusClassName(plumbLine.shoulders.value, ANGLE_RANGES.plumbLine)}
          />
          <DataRow
            label="臀部偏移"
            value={plumbLine.hips.value}
            className={getAngleStatusClassName(plumbLine.hips.value, ANGLE_RANGES.plumbLine)}
          />
        </div>
      </div>

      <div className="panel-section">
        <h4>姿态建议</h4>
        <div className="advice-list">
          {advice && advice.length > 0 ? (
            advice.map((item, index) => <p key={index}>{item}</p>)
          ) : (
            <p className="good-posture">姿态良好，请保持！</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AnalysisPanel;
