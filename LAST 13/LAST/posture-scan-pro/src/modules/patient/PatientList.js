import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PatientList.css';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // 这里应该从API获取用户数据
    // 这里使用示例数据
    const samplePatients = [
      { id: 1, name: '张三', gender: '男', age: 35, lastAssessment: '2023-10-15' },
      { id: 2, name: '李四', gender: '男', age: 42, lastAssessment: '2023-10-10' },
      { id: 3, name: '王五', gender: '女', age: 28, lastAssessment: '2023-09-30' }
    ];
    setPatients(samplePatients);
  }, []);

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleViewDetails = () => {
    if (selectedPatient) {
      navigate(`/patient/${selectedPatient.id}`);
    }
  };

  const handleStartCapture = () => {
    if (selectedPatient) {
      // 如果选择了用户，导航到带有用户ID的姿态捕获页面
      navigate(`/patient/${selectedPatient.id}/assessment/new`);
    } else {
      // 如果没有选择用户，可以直接导航到普通的姿态捕获页面
      navigate('/posture-capture');
    }
  };

  const handleAddPatient = () => {
    navigate('/patient/new');
  };

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h1>人员管理</h1>
        <div className="patient-actions">
          <button onClick={handleAddPatient} className="btn add-btn">新增人员</button>
          <button
            onClick={handleStartCapture}
            className={`btn capture-btn ${!selectedPatient ? 'btn-secondary' : ''}`}
          >
            姿态捕获
          </button>
        </div>
      </div>

      <div className="patient-table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>年龄</th>
              <th>最近评估</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr
                key={patient.id}
                className={selectedPatient && selectedPatient.id === patient.id ? 'selected' : ''}
                onClick={() => handlePatientClick(patient)}
              >
                <td>{patient.name}</td>
                <td>{patient.gender}</td>
                <td>{patient.age}</td>
                <td>{patient.lastAssessment}</td>
                <td>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatient(patient);
                    handleViewDetails();
                  }} className="btn btn-small">
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPatient && (
        <div className="selected-patient-panel">
          <h3>已选择: {selectedPatient.name}</h3>
          <div className="selected-patient-actions">
            <button onClick={handleViewDetails} className="btn btn-small">查看详情</button>
            <button onClick={handleStartCapture} className="btn btn-primary">开始姿态捕获</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;