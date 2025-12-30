import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';
import PatientSelectionModal from './PatientSelectionModal';

const Welcome = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(null); // 'capture' or 'view_reports'

  const handleOpenModal = (target) => {
    setModalTarget(target);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalTarget(null);
  };

  // The modal will now handle navigation based on the target
  const handlePatientSelect = (patientId) => {
    setIsModalOpen(false);
    if (modalTarget === 'capture') {
      navigate(`/patient/${patientId}/assessment/new`);
    } else if (modalTarget === 'view_reports') {
      navigate(`/patient/${patientId}`); // Navigate to the patient detail page
    }
  };

  return (
    <>
      <div className="welcome-container">
        <div className="welcome-content">
          <h1>欢迎使用 <span className="highlight">AI健身辅助平台</span></h1>

          <div className="welcome-image-container">
            <div className="placeholder-image">
              <div className="placeholder-icon">🧍</div>
              <h2>AI健身辅助平台</h2>
              <p>精准捕捉身体姿态，科学分析身体平衡</p>
            </div>
          </div>

          {/* Features section now has only two items */}
          <div className="welcome-features two-items">
            <div className="feature-item">
              <div className="feature-icon capture-icon">📹</div>
              <h3>姿态捕获</h3>
              <p>为指定人员开始一次新的评估</p>
              <button
                className="feature-btn capture-btn"
                onClick={() => handleOpenModal('capture')}
              >
                开始捕获
              </button>
            </div>

            <div className="feature-item">
              <div className="feature-icon reports-icon">📊</div>
              <h3>查看报告</h3>
              <p>查看指定人员的所有历史报告</p>
              <button
                className="feature-btn reports-btn"
                onClick={() => handleOpenModal('view_reports')}
              >
                查看报告
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* The modal is now more generic */}
      <PatientSelectionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onPatientSelect={handlePatientSelect} // Pass the selection handler
      />
    </>
  );
};

export default Welcome;
