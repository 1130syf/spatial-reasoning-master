import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [exerciseReports, setExerciseReports] = useState([]);
  const [activeTab, setActiveTab] = useState('posture'); // 'posture' or 'exercise'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 并行获取体态评估报告和运动报告
        const [assessmentsData, exerciseData] = await Promise.all([
          api.getAllAssessments(),
          fetch('http://localhost:3001/api/exercise-reports').then(res => res.json())
        ]);

        setAssessments(assessmentsData);
        setExerciseReports(exerciseData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setError("无法从数据库加载报告列表。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewReport = (id, type = 'posture') => {
    // --- RIGOROUS CHECK ---
    // Ensure the id is a valid, positive number before navigating.
    if (!id && id !== 0) {
        alert(`错误：尝试查看一个ID为 "undefined" 的报告！`);
        console.error("handleViewReport received an invalid ID:", id);
        return;
    }

    if (type === 'exercise') {
      navigate(`/exercise-report/${id}`);
    } else {
      navigate(`/assessment/${id}`);
    }
  };

  const getExerciseTypeIcon = (exerciseType) => {
    switch (exerciseType) {
      case '深蹲':
        return '🏋️';
      case '二头弯举':
        return '💪';
      default:
        return '🏃';
    }
  };

  const getPostureIcon = (assessmentType) => {
    if (assessmentType && assessmentType.includes('脊柱')) {
      return '🦴';
    }
    return '🧍';
  };

  if (isLoading) {
    return <div className="page-container"><h1>正在加载报告列表...</h1></div>;
  }

  if (error) {
    return <div className="page-container"><h1 style={{ color: 'red' }}>{error}</h1></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>报告管理</h1>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab-button ${activeTab === 'posture' ? 'active' : ''}`}
          onClick={() => setActiveTab('posture')}
        >
          🧍 体态评估报告 ({assessments.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'exercise' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercise')}
        >
          🏃 运动训练报告 ({exerciseReports.length})
        </button>
      </div>

      <div className="content-card">
        {activeTab === 'posture' ? (
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>报告ID</th>
                  <th>人员姓名</th>
                  <th>评估类型</th>
                  <th>评估日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {assessments.length > 0 ? assessments.map(assessment => (
                  <tr key={assessment.id || Math.random()}>
                    <td>#{assessment.id ?? '无效ID'}</td>
                    <td>{assessment.patientName}</td>
                    <td>
                      <span className="type-badge">
                        {getPostureIcon(assessment.assessmentType)} {' '}
                        {assessment.assessmentType || '静态体态评估'}
                      </span>
                    </td>
                    <td>{new Date(assessment.created_at).toLocaleString()}</td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewReport(assessment.id, 'posture')}
                        disabled={!assessment.id && assessment.id !== 0}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-state">数据库中暂无体态评估报告。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>报告ID</th>
                  <th>人员姓名</th>
                  <th>运动类型</th>
                  <th>训练日期</th>
                  <th>平均得分</th>
                  <th>成功率</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {exerciseReports.length > 0 ? exerciseReports.map(report => (
                  <tr key={report.id || Math.random()}>
                    <td>#{report.id ?? '无效ID'}</td>
                    <td>{report.patientName}</td>
                    <td>
                      <span className="type-badge exercise-badge">
                        {getExerciseTypeIcon(report.exercise_type)} {' '}
                        {report.exercise_type}
                      </span>
                    </td>
                    <td>{new Date(report.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`score-badge ${
                        parseFloat(report.average_score) >= 90 ? 'excellent' :
                        parseFloat(report.average_score) >= 75 ? 'good' : 'needs-improvement'
                      }`}>
                        {report.average_score ? parseFloat(report.average_score).toFixed(1) : '--'}
                      </span>
                    </td>
                    <td>
                      <span className={`success-rate ${
                        parseFloat(report.success_rate) >= 80 ? 'high' :
                        parseFloat(report.success_rate) >= 60 ? 'medium' : 'low'
                      }`}>
                        {report.success_rate ? `${parseFloat(report.success_rate).toFixed(1)}%` : '--'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewReport(report.id, 'exercise')}
                        disabled={!report.id && report.id !== 0}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="empty-state">数据库中暂无运动训练报告。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
