import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SpinalCurvatureReport.css'; // We will create this file next

const SpinalCurvatureReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportData } = location.state || {}; // Safely access state

  if (!reportData) {
    return (
      <div className="report-container">
        <h1>错误</h1>
        <p>未找到报告数据，请返回检测页面重新生成。</p>
        <button onClick={() => navigate('/spinal-curvature')} className="control-btn no-print">返回</button>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header">
        <h1>脊柱弯曲度分析报告</h1>
        <p>生成日期: {new Date().toLocaleString()}</p>
      </header>
      
      <main className="report-main">
        <div className="report-section">
          <h2>核心指标</h2>
          <p><strong>脊柱倾斜角度:</strong> <span>{reportData.curvatureAngle}°</span></p>
          <p className="assessment"><strong>初步评估:</strong> <span>{reportData.assessment}</span></p>
        </div>
        
        <div className="report-section">
          <h2>免责声明</h2>
          <p className="disclaimer">
            本报告由 AI健身辅助平台 根据姿态识别算法生成，结果仅供参考，不能替代专业医疗诊断。我们建议您咨询医生或物理治疗师以获取专业的医疗建议。
          </p>
        </div>
      </main>
      
      <footer className="report-footer no-print">
        <button onClick={() => navigate('/spinal-curvature')} className="control-btn">返回检测</button>
        <button onClick={() => window.print()} className="control-btn print">打印报告</button>
      </footer>
    </div>
  );
};

export default SpinalCurvatureReport;
