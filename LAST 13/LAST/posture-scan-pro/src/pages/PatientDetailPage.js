import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaUser, FaCalendarAlt, FaVenusMars, FaRulerVertical, FaWeight, FaChartLine, FaClipboardCheck, FaBone } from 'react-icons/fa';
import api from '../api';
import './PatientDetailPage.css';

const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      try {
        setIsLoading(true);
        // Fetch patient info and their assessments in parallel
        const [patientData, assessmentsData] = await Promise.all([
          api.getPatientById(patientId),
          api.getAssessmentsByPatientId(patientId)
        ]);

        if (patientData) {
          setPatient(patientData);
          setAssessments(assessmentsData);
        } else {
          setError('未找到指定的人员。');
        }
      } catch (err) {
        console.error("Failed to fetch patient details:", err);
        setError('无法从数据库加载人员详情。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  // 计算统计信息
  const statistics = useMemo(() => {
    if (!assessments || assessments.length === 0) {
      return {
        totalCount: 0,
        lastAssessmentDate: null,
        assessmentTypes: {},
        averageBalance: null
      };
    }
    
    // 统计评估类型
    const typeCount = {};
    let balanceSum = 0;
    let balanceCount = 0;
    
    assessments.forEach(a => {
      const type = a.assessmentType || '静态体态评估';
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // 尝试提取平衡指数
      if (a.assessment_data) {
        try {
          const data = typeof a.assessment_data === 'string' ? JSON.parse(a.assessment_data) : a.assessment_data;
          if (data?.balanceIndex?.overall?.value) {
            balanceSum += parseFloat(data.balanceIndex.overall.value);
            balanceCount++;
          }
        } catch (e) {}
      }
    });
    
    return {
      totalCount: assessments.length,
      lastAssessmentDate: assessments[0]?.created_at,
      assessmentTypes: typeCount,
      averageBalance: balanceCount > 0 ? Math.round(balanceSum / balanceCount) : null
    };
  }, [assessments]);

  const handleStartNewAssessment = () => {
    navigate(`/patient/${patientId}/assessment/new`);
  };

  const handleStartSpinalCurvature = () => {
    navigate(`/patient/${patientId}/spinal-curvature`);
  };

  if (isLoading) {
    return <div className="page-container"><h1>正在加载人员详情...</h1></div>;
  }

  if (error) {
    return <div className="page-container"><h1 style={{ color: 'red' }}>{error}</h1></div>;
  }

  if (!patient) {
    return <div className="page-container"><h1>人员不存在。</h1></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{patient.name} 的个人主页</h1>
        <div className="header-buttons">
          <button className="btn btn-primary" onClick={handleStartNewAssessment}>
            <FaPlus /> 开始新的评估
          </button>
          <button className="btn btn-secondary" onClick={handleStartSpinalCurvature}>
            <FaBone /> 脊柱弯曲度检测
          </button>
        </div>
      </div>

      <div className="patient-detail-grid">
        {/* Patient Info Card */}
        <div className="content-card patient-info-card">
          <h3><FaUser /> 基本信息</h3>
          <div className="info-grid">
            <div><FaVenusMars /> <strong>性别:</strong> {patient.gender}</div>
            <div><FaCalendarAlt /> <strong>年龄:</strong> {patient.age}</div>
            <div><FaRulerVertical /> <strong>身高:</strong> {patient.height} cm</div>
            <div><FaWeight /> <strong>体重:</strong> {patient.weight} kg</div>
          </div>
        </div>

        {/* Assessments History Card */}
        <div className="content-card assessments-history-card">
          <h3>历史评估报告</h3>
          <div className="assessments-list">
            {assessments.length > 0 ? (
              assessments.map(assessment => (
                <div key={assessment.id} className="assessment-item" onClick={() => navigate(`/assessment/${assessment.id}`)}>
                  <span>报告ID: #{assessment.id}</span>
                  <span>评估日期: {new Date(assessment.created_at).toLocaleDateString()}</span>
                  <button className="btn-view-detail">查看</button>
                </div>
              ))
            ) : (
              <p className="empty-state">该人员暂无评估报告。</p>
            )}
          </div>
        </div>

        {/* 统计信息卡片 */}
        <div className="content-card statistics-card">
          <h3><FaChartLine /> 统计信息</h3>
          <div className="stats-summary-grid">
            <div className="stat-summary-item">
              <span className="stat-number">{statistics.totalCount}</span>
              <span className="stat-label">总评估次数</span>
            </div>
            <div className="stat-summary-item">
              <span className="stat-number">
                {statistics.averageBalance !== null ? statistics.averageBalance : '--'}
              </span>
              <span className="stat-label">平均平衡指数</span>
            </div>
            <div className="stat-summary-item">
              <span className="stat-number">
                {statistics.lastAssessmentDate 
                  ? new Date(statistics.lastAssessmentDate).toLocaleDateString() 
                  : '--'}
              </span>
              <span className="stat-label">最近评估</span>
            </div>
          </div>
          
          {Object.keys(statistics.assessmentTypes).length > 0 && (
            <div className="type-distribution">
              <h4>评估类型分布</h4>
              <div className="type-bars">
                {Object.entries(statistics.assessmentTypes).map(([type, count]) => (
                  <div key={type} className="type-bar-item">
                    <div className="type-bar-label">
                      <span>{type}</span>
                      <span>{count}次</span>
                    </div>
                    <div className="type-bar-track">
                      <div 
                        className="type-bar-fill" 
                        style={{ width: `${(count / statistics.totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
