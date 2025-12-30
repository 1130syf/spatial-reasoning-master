import React, { useState } from 'react';
import './SquatSetup.css';

const SquatSetup = ({ onStart, patients, selectedPatientId, onPatientSelect, showPatientModal, setShowPatientModal }) => {
  const [targetCount, setTargetCount] = useState(10);

  const handleStart = () => {
    console.log('handleStart called', { targetCount, selectedPatientId });
    if (!selectedPatientId) {
      // 如果没有选择用户，先显示用户选择弹窗
      setShowPatientModal(true);
    } else {
      // 如果已经选择用户，直接开始训练
      onStart(targetCount);
    }
  };

  return (
    <div className="squat-setup-card">
      <div className="setup-header">
        <h1>标准深蹲挑战</h1>
        <p>设定你的训练目标，开始挑战吧！</p>
      </div>

      {/* 用户信息显示 */}
      {selectedPatientId && (
        <div className="patient-info-display">
          <span className="patient-label">当前用户:</span>
          <span className="patient-name">
            {patients.find(p => p.id === parseInt(selectedPatientId))?.name || `ID: ${selectedPatientId}`}
          </span>
          <button className="change-patient-btn" onClick={() => setShowPatientModal(true)}>
            更换用户
          </button>
        </div>
      )}

      <div className="setup-content">
        <label htmlFor="target-count">目标次数</label>
        <div className="input-group">
          <button onClick={() => setTargetCount(c => Math.max(1, c - 1))}>-</button>
          <input
            id="target-count"
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
            min="1"
          />
          <button onClick={() => setTargetCount(c => c + 1)}>+</button>
        </div>
      </div>
      <div className="setup-actions">
        <button className="start-button" onClick={handleStart}>
          {selectedPatientId ? '开始训练' : '选择用户并开始训练'}
        </button>
      </div>

      {/* 用户选择弹窗 */}
      {showPatientModal && (
        <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>选择用户</h2>
            <p>请选择要进行深蹲训练的用户：</p>
            <div className="patient-list">
              {patients.length > 0 ? (
                patients.map(patient => (
                  <div
                    key={patient.id}
                    className="patient-item"
                    onClick={() => {
                      console.log('Patient selected:', patient.id);
                      onPatientSelect(patient.id);
                      // 选择用户后立即开始训练
                      setTimeout(() => {
                        onStart(targetCount);
                      }, 100);
                    }}
                  >
                    <div className="patient-info">
                      <strong>{patient.name}</strong>
                      <span className="patient-details">
                        {patient.age}岁 | {patient.gender} | {patient.height}cm | {patient.weight}kg
                      </span>
                    </div>
                    <div className="patient-arrow">→</div>
                  </div>
                ))
              ) : (
                <div className="no-patients">
                  <p>暂无用户数据</p>
                  <p>请先在人员管理中添加用户</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowPatientModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquatSetup;
