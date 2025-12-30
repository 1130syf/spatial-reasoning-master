import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ExerciseReportDetail.css';

const ExerciseReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRep, setSelectedRep] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/exercise-reports/${reportId}`);
        if (response.ok) {
          const data = await response.json();
          setReport(data);
        } else {
          setError('报告不存在或加载失败');
        }
      } catch (err) {
        console.error('获取报告详情失败:', err);
        setError('网络错误，请检查连接');
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="exercise-report-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>正在加载报告详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exercise-report-container">
        <div className="error-state">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/reports')} className="back-btn">
            返回报告列表
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="exercise-report-container">
        <div className="empty-state">
          <h2>📋 报告不存在</h2>
          <p>未找到ID为 {reportId} 的报告</p>
          <button onClick={() => navigate('/reports')} className="back-btn">
            返回报告列表
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return '#10b981'; // 绿色 - 优秀
    if (numScore >= 75) return '#f59e0b'; // 黄色 - 良好
    return '#ef4444'; // 红色 - 需要改进
  };

  const getScoreLevel = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return '优秀';
    if (numScore >= 75) return '良好';
    return '需要改进';
  };

  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  return (
    <div className="exercise-report-container">
      {/* 报告头部 */}
      <header className="report-header">
        <div className="header-left">
          <button onClick={() => navigate('/reports')} className="back-btn">
            ← 返回列表
          </button>
          <h1>{report.exercise_type}训练报告</h1>
          <div className="patient-info">
            <span className="patient-name">{report.patientName}</span>
            <span className="patient-details">
              {report.age}岁 | {report.gender} | {report.height}cm | {report.weight}kg
            </span>
          </div>
        </div>
        <div className="header-right">
          <div className="report-id">报告ID: #{report.id}</div>
          <div className="report-time">{formatTime(report.created_at)}</div>
        </div>
      </header>

      {/* 核心指标卡片 */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">平均得分</div>
            <div
              className="metric-value"
              style={{ color: getScoreColor(report.average_score) }}
            >
              {parseFloat(report.average_score).toFixed(1)}
            </div>
            <div
              className="metric-level"
              style={{ color: getScoreColor(report.average_score) }}
            >
              {getScoreLevel(report.average_score)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">有效次数</div>
            <div className="metric-value">{report.valid_reps}</div>
            <div className="metric-subtitle">/ {report.total_attempts} 总尝试</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">成功率</div>
            <div className="metric-value">{parseFloat(report.success_rate).toFixed(1)}%</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${parseFloat(report.success_rate)}%`,
                  backgroundColor: getScoreColor(report.success_rate)
                }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-label">训练时长</div>
            <div className="metric-value">
              {report.session_start_time && report.session_end_time ?
                `${Math.round((new Date(report.session_end_time) - new Date(report.session_start_time)) / 60000)}分钟`
                : '--'
              }
            </div>
          </div>
        </div>
      </div>

      {/* 详细重复数据 */}
      <div className="rep-details-section">
        <h2>📈 每次重复详情</h2>

        {/* 重复数据表格 */}
        <div className="rep-table-container">
          <table className="rep-table">
            <thead>
              <tr>
                <th>重复次数</th>
                <th>得分</th>
                <th>状态</th>
                <th>用时</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {report.repDetails && report.repDetails.length > 0 ? (
                report.repDetails.map((rep, index) => (
                  <tr
                    key={rep.id}
                    className={`rep-row ${rep.is_valid ? 'valid' : 'invalid'}`}
                    onClick={() => setSelectedRep(selectedRep?.id === rep.id ? null : rep)}
                  >
                    <td className="rep-number">#{rep.rep_number}</td>
                    <td>
                      <span
                        className="score-badge"
                        style={{
                          backgroundColor: getScoreColor(rep.score) + '20',
                          color: getScoreColor(rep.score)
                        }}
                      >
                        {parseFloat(rep.score).toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${rep.is_valid ? 'valid' : 'invalid'}`}>
                        {rep.is_valid ? '✅ 有效' : '❌ 无效'}
                      </span>
                    </td>
                    <td>
                      <span className="duration">
                        {rep.duration_ms ? `${(rep.duration_ms / 1000).toFixed(1)}s` : '--'}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn">
                        {selectedRep?.id === rep.id ? '收起' : '查看'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">暂无详细重复数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 选中重复的详细信息 */}
        {selectedRep && (
          <div className="rep-detail-expand">
            <h3>第 {selectedRep.rep_number} 次重复详细分析</h3>
            <div className="rep-detail-grid">
              <div className="detail-card">
                <h4>基本信息</h4>
                <p><strong>开始时间:</strong> {selectedRep.start_time ? formatTime(selectedRep.start_time) : '--'}</p>
                <p><strong>结束时间:</strong> {selectedRep.end_time ? formatTime(selectedRep.end_time) : '--'}</p>
                <p><strong>持续时间:</strong> {selectedRep.duration_ms ? `${(selectedRep.duration_ms / 1000).toFixed(2)}秒` : '--'}</p>
              </div>

              {selectedRep.screenshot && (
                <div className="detail-card">
                  <h4>动作截图</h4>
                  <img
                    src={selectedRep.screenshot}
                    alt={`第${selectedRep.rep_number}次重复`}
                    className="rep-screenshot"
                  />
                </div>
              )}

              {selectedRep.joint_angles && (
                <div className="detail-card">
                  <h4>关节角度数据</h4>
                  <div className="joint-angles">
                    {Object.entries(JSON.parse(selectedRep.joint_angles || {})).map(([joint, angle]) => (
                      <div key={joint} className="joint-angle">
                        <span className="joint-name">{joint}:</span>
                        <span className="angle-value">{angle}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 训练总结和建议 */}
      <div className="summary-section">
        <div className="summary-card">
          <h2>📋 训练总结</h2>
          {report.summary_data && (
            <div className="summary-grid">
              {Object.entries(JSON.parse(report.summary_data || {})).map(([key, value]) => (
                <div key={key} className="summary-item">
                  <span className="summary-label">
                    {key === 'avg_duration' ? '平均用时' :
                     key === 'best_rep' ? '最佳重复' :
                     key === 'worst_rep' ? '最差重复' :
                     key === 'improvement_trend' ? '进步趋势' :
                     key === 'form_consistency' ? '动作稳定性' : key}:
                  </span>
                  <span className="summary-value">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {report.recommendations && (
          <div className="recommendations-card">
            <h2>💡 改善建议</h2>
            <div className="recommendations-content">
              {report.recommendations.split('。').filter(r => r.trim()).map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="bullet">•</span>
                  <span>{rec.trim()}.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseReportDetail;