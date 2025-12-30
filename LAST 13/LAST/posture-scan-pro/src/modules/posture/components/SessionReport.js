import React from 'react';
import './SessionReport.css';

const SessionReport = ({ report, onRestart }) => {
  if (!report) {
    return (
      <div className="session-report-card">
        <h2>正在生成报告...</h2>
      </div>
    );
  }

  // Calculate overall stats
  const validSquats = report.details.filter(item => item.isValid);
  const accuracy = report.details.length > 0 ? (validSquats.length / report.details.length) * 100 : 0;

  return (
    <div className="session-report-card">
      <div className="report-header">
        <h1>{report.title}</h1>
        <p>{report.summary}</p>
      </div>
      
      <div className="report-section">
        <h3>整体表现</h3>
        <div className="overall-stats">
          <div className="stat">
            <div className="stat-value">{validSquats.length}</div>
            <div className="stat-label">有效次数</div>
          </div>
          <div className="stat">
            <div className="stat-value">{report.details.length}</div>
            <div className="stat-label">总尝试次数</div>
          </div>
          <div className="stat">
            <div className="stat-value">{accuracy.toFixed(0)}%</div>
            <div className="stat-label">成功率</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>详细分析</h3>
        <div className="details-list">
          {report.details.length > 0 ? report.details.map((item, index) => (
            <div key={index} className={`detail-item ${item.isValid ? 'valid' : 'invalid'}`}>
              <h4>第 {index + 1} 次尝试</h4>
              <p>{item.report.join(' ')}</p>
            </div>
          )) : <p>没有记录到详细数据。</p>}
        </div>
      </div>

      <div className="report-actions">
        <button className="restart-button" onClick={onRestart}>
          再试一次
        </button>
      </div>
    </div>
  );
};

export default SessionReport;
