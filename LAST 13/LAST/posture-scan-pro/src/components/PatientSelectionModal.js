import React, { useState, useEffect } from 'react';
import api from '../api';
import './PatientSelectionModal.css';

const PatientSelectionModal = ({ isOpen, onClose, onPatientSelect }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPatients = async () => {
        setIsLoading(true);
        try {
          const data = await api.getPatients();
          setPatients(data);
        } catch (error) {
          console.error("Failed to fetch patients for modal:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPatients();
    }
  }, [isOpen]);

  // This function now calls the prop passed from the parent
  const handleSelectPatient = (patientId) => {
    if (onPatientSelect) {
      onPatientSelect(patientId);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content patient-selection-modal" onClick={e => e.stopPropagation()}>
        <h2>选择人员</h2>
        <input
          type="text"
          placeholder="搜索人员姓名..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="patient-list-container">
          {isLoading ? (
            <p>正在加载人员列表...</p>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                className="patient-list-item" 
                onClick={() => handleSelectPatient(patient.id)}
              >
                <div className="patient-avatar">{patient.name.charAt(0)}</div>
                <div className="patient-info">
                  <span className="patient-name">{patient.name}</span>
                  <span className="patient-meta">ID: {patient.id} | 年龄: {patient.age}</span>
                </div>
              </div>
            ))
          ) : (
            <p>未找到匹配的人员。</p>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;
