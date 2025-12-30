import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ReportDetailPage.css';

const DataRow = ({ label, value, unit = '' }) => (
  <div className="detail-metric-item">
    <span className="detail-metric-label">{label}</span>
    <span className="detail-metric-value">
      {value !== null && value !== undefined ? `${value.toFixed(1)}${unit}` : 'N/A'}
    </span>
  </div>
);

const ReportDetailPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      console.log(`[ReportDetailPage] useEffect: Fetching with assessmentId: ${assessmentId}`);
      try {
        setIsLoading(true);
        const data = await api.getAssessmentById(assessmentId);
        if (data) {
          // FIX: The data from the backend is already a parsed object because of the mysql2 driver.
          // We do NOT need to parse it again.
          // data.assessment_data = JSON.parse(data.assessment_data); // This was the error line.
          setAssessment(data);
        } else {
          setError(`未找到ID为 ${assessmentId} 的报告。`);
        }
      } catch (err) {
        console.error("[ReportDetailPage] Failed to fetch assessment:", err);
        setError("无法从数据库加载报告详情。");
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    } else {
      console.error("[ReportDetailPage] useEffect skipped: assessmentId is missing.", assessmentId);
      setError("错误：报告ID缺失，无法加载。");
      setIsLoading(false);
    }
  }, [assessmentId]);

  if (isLoading) {
    return <div className="page-container"><h1>正在加载报告详情...</h1></div>;
  }

  if (error) {
    return <div className="page-container"><h1 style={{ color: 'red' }}>{error}</h1></div>;
  }

  if (!assessment) {
    return <div className="page-container"><h1>报告不存在。</h1></div>;
  }

  const { patientName, created_at, screenshot, assessment_data } = assessment;

  // 检查评估类型并获取相应的数据
  const isSpinalAssessment = assessment_data?.type === "脊柱弯曲度检测";

  let displayData;
  if (isSpinalAssessment) {
    // 脊柱曲率检测数据
    displayData = assessment_data;
  } else {
    // 传统姿态分析数据
    const { balanceIndex, sagittalAngles, coronalAngles } = assessment_data || {};
    displayData = {
      balanceIndex,
      sagittalAngles,
      coronalAngles
    };
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{isSpinalAssessment ? '脊柱弯曲度检测报告' : '评估报告详情'} (ID: {assessment.id})</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>返回列表</button>
      </div>
      <div className="detail-grid">
        <div className="screenshot-card content-card">
          <h3>评估快照</h3>
          <p><strong>人员:</strong> {patientName}</p>
          <p><strong>评估类型:</strong> {assessment_data?.type || '静态体态评估'}</p>
          <p><strong>评估时间:</strong> {new Date(created_at).toLocaleString()}</p>
          {screenshot && <img src={screenshot} alt="Assessment Screenshot" className="screenshot-image" />}
        </div>
        <div className="data-card content-card">
          <h3>详细数据</h3>
          {isSpinalAssessment ? (
            // 脊柱曲率检测数据显示
            <div className="spinal-data-section">
              <div className="data-section">
                <h4>脊柱分析结果</h4>
                <div className="detail-metric-item">
                  <span className="detail-metric-label">脊柱倾斜角度</span>
                  <span className="detail-metric-value">{displayData.curvatureAngle || 'N/A'}°</span>
                </div>
                <div className="detail-metric-item">
                  <span className="detail-metric-label">水平偏移量</span>
                  <span className="detail-metric-value">{displayData.horizontalOffset || 'N/A'}%</span>
                </div>
                <div className="detail-metric-item">
                  <span className="detail-metric-label">躯干垂直比例</span>
                  <span className="detail-metric-value">{displayData.spineLength || 'N/A'}%</span>
                </div>
              </div>
              <div className="data-section">
                <h4>健康评估</h4>
                <div className="detail-metric-item">
                  <span className="detail-metric-label">评估结果</span>
                  <span className="detail-metric-value" style={{
                    color: displayData.status === 'good' ? '#10b981' :
                           displayData.status === 'warning' ? '#f59e0b' : '#ef4444'
                  }}>
                    {displayData.assessment || 'N/A'}
                  </span>
                </div>
                {displayData.timestamp && (
                  <div className="detail-metric-item">
                    <span className="detail-metric-label">检测时间</span>
                    <span className="detail-metric-value">{new Date(displayData.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 传统姿态分析数据显示
            <div className="posture-data-section">
              {displayData.balanceIndex && (
                <div className="data-section">
                  <h4>平衡指数</h4>
                  <DataRow label="总体平衡" value={displayData.balanceIndex.overall?.value} unit="%" />
                  <DataRow label="前后平衡" value={displayData.balanceIndex.sagittal?.value} unit="%" />
                  <DataRow label="左右平衡" value={displayData.balanceIndex.coronal?.value} unit="%" />
                </div>
              )}
              {(displayData.sagittalAngles || displayData.coronalAngles) && (
                <div className="data-section">
                  <h4>姿态角度 (°)</h4>
                  <DataRow label="头部前倾" value={displayData.sagittalAngles?.head?.value} />
                  <DataRow label="肩部水平" value={displayData.coronalAngles?.shoulders?.value} />
                  <DataRow label="骨盆倾斜" value={displayData.coronalAngles?.pelvis?.value} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
