import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PatientDetail.css';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    // 这里应该从API获取用户数据
    // 使用示例数据
    const samplePatient = {
      id: parseInt(id),
      name: '张三',
      gender: '男',
      age: 35,
      height: 175,
      weight: 70,
      medicalHistory: '无特殊病史',
      notes: '常规体检'
    };

    const sampleAssessments = [
      { id: 101, date: '2023-10-15', type: '姿态评估', status: '已完成' },
      { id: 102, date: '2023-09-20', type: '姿态评估', status: '已完成' }
    ];

    setPatient(samplePatient);
    setAssessments(sampleAssessments);
  }, [id]);

  const handleStartCapture = () => {
    navigate(`/patient/${id}/assessment/new`);
  };

  const handleViewAssessment = (assessmentId) => {
    navigate(`/assessment/${assessmentId}`);
  };

  const handleEditPatient = () => {
    navigate(`/patient/edit/${id}`);
  };

  if (!patient) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-header">
        <h1>{patient.name}的个人档案</h1>
        <div className="patient-detail-actions">
          <button onClick={handleEditPatient} className="btn edit-btn">编辑资料</button>
          <button onClick={handleStartCapture} className="btn capture-btn">姿态捕获</button>
        </div>
      </div>

      <div className="patient-info-section">
        <h2>基本信息</h2>
        <div className="patient-info-grid">
          <div className="info-item">
            <span className="info-label">姓名:</span>
            <span className="info-value">{patient.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">性别:</span>
            <span className="info-value">{patient.gender}</span>
          </div>
          <div className="info-item">
            <span className="info-label">年龄:</span>
            <span className="info-value">{patient.age}</span>
          </div>
          <div className="info-item">
            <span className="info-label">身高:</span>
            <span className="info-value">{patient.height} cm</span>
          </div>
          <div className="info-item">
            <span className="info-label">体重:</span>
            <span className="info-value">{patient.weight} kg</span>
          </div>
        </div>
      </div>

      <div className="assessment-history-section">
        <h2>评估历史</h2>
        <table className="assessment-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(assessment => (
              <tr key={assessment.id}>
                <td>{assessment.date}</td>
                <td>{assessment.type}</td>
                <td>{assessment.status}</td>
                <td>
                  <button
                    onClick={() => handleViewAssessment(assessment.id)}
                    className="btn btn-small"
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="new-assessment-section">
        <button onClick={handleStartCapture} className="btn btn-primary btn-large">
          开始新的姿态评估
        </button>
      </div>
    </div>
  );
};

export default PatientDetail;