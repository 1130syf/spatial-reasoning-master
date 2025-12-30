import React, { useState } from 'react';
import { 
  Activity, 
  Database, 
  PenTool, 
  CheckCircle, 
  Layers, 
  Brain, 
  Filter, 
  Search, 
  Download, 
  ChevronRight,
  Eye
} from 'lucide-react';
import './DatasetShowcase.css';

const DatasetShowcase = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部动作');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleExport = () => {
    if (selectedSample) {
      const jsonData = JSON.stringify({
        image_id: selectedSample.id,
        iscrowd: 0,
        num_keypoints: 14,
        keypoints: [
          [420, 210, 2, 425, 208, 2, "..."],
          [310, 150, 2, 315, 152, 2, "..."]
        ]
      }, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample_${selectedSample.id}_annotations.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const keypoints = [
    { id: 0, name: 'Nose', x: 50, y: 15 },
    { id: 11, name: 'Left Shoulder', x: 70, y: 30 },
    { id: 12, name: 'Right Shoulder', x: 30, y: 30 },
    { id: 13, name: 'Left Elbow', x: 85, y: 45 },
    { id: 14, name: 'Right Elbow', x: 15, y: 45 },
    { id: 15, name: 'Left Wrist', x: 95, y: 60 },
    { id: 16, name: 'Right Wrist', x: 5, y: 60 },
    { id: 23, name: 'Left Hip', x: 65, y: 60 },
    { id: 24, name: 'Right Hip', x: 35, y: 60 },
    { id: 25, name: 'Left Knee', x: 70, y: 80 },
    { id: 26, name: 'Right Knee', x: 30, y: 80 },
    { id: 27, name: 'Left Ankle', x: 70, y: 95 },
    { id: 28, name: 'Right Ankle', x: 30, y: 95 },
  ];
  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ];
  const uploadedImageSrc = "/keypoints-splash-big.png"; // FIX: Corrected file extension
  const samples = [
    { id: 201, type: 'Group Dining', quality: 'High', source: 'COCO Val 2017', status: 'Verified', isPreRendered: true, cropStyle: { top: '0%', left: '0%' } },
    { id: 202, type: 'Meeting/Class', quality: 'High', source: 'CrowdPose', status: 'Verified', isPreRendered: true, cropStyle: { top: '0%', left: '-100%' } },
    { id: 203, type: 'Sports (Soccer)', quality: 'Complex', source: 'Sports Dataset', status: 'Verified', isPreRendered: true, cropStyle: { top: '0%', left: '-200%' } },
    { id: 204, type: 'Motorcycling', quality: 'High', source: 'MPII Human Pose', status: 'Review', isPreRendered: true, cropStyle: { top: '-100%', left: '0%' } },
    { id: 205, type: 'Social Event', quality: 'Occluded', source: 'COCO Train', status: 'Verified', isPreRendered: true, cropStyle: { top: '-100%', left: '-100%' } },
    { id: 206, type: 'Urban Walking', quality: 'High', source: 'In-the-wild', status: 'Auto-labeled', isPreRendered: true, cropStyle: { top: '-100%', left: '-200%' } },
  ];

  const filteredSamples = samples.filter(sample => {
    const searchMatch = sample.id.toString().includes(searchTerm);
    if (activeFilter === '全部动作') {
      return searchMatch;
    }
    if (activeFilter === '多人场景 (Crowd)') {
      return searchMatch && (sample.type.includes('Group') || sample.type.includes('Meeting') || sample.type.includes('Social'));
    }
    if (activeFilter === '运动 (Sports)') {
      return searchMatch && (sample.type.includes('Sports') || sample.type.includes('Motorcycling'));
    }
    return searchMatch;
  });

  const renderSkeleton = (scale = 1, offsetX = 0, offsetY = 0, poseType = 'normal', isOverlay = false, isPreRendered = false) => {
    if (isPreRendered) {
      return (
        <div className="skeleton-prerendered-container">
           {isOverlay && (
             <div className="prerendered-badge">
               <Eye style={{width: '0.75rem', height: '0.75rem', color: '#34d399'}} />
               <span className="prerendered-text">Pre-visualized Ground Truth</span>
             </div>
           )}
        </div>
      );
    }
    let adjustedKeypoints = keypoints.map(p => ({...p}));
    if (poseType.includes('Squat') || poseType.includes('Fitness')) {
      adjustedKeypoints = keypoints.map(p => {
        let np = {...p};
        if ([23,24].includes(p.id)) np.y += 10; 
        if ([25,26].includes(p.id)) { np.y -= 5; np.x = p.id===25? 85 : 15; }
        return np;
      });
    }
    const strokeColor = isOverlay ? "rgba(0, 255, 255, 0.9)" : "white";
    const pointColor = isOverlay ? "#FACC15" : "#F472B6";
    const strokeWidth = isOverlay ? "3" : "2";
    return (
      <svg viewBox="0 0 100 110" className="skeleton-svg">
        {connections.map(([start, end], idx) => {
          const p1 = adjustedKeypoints.find(k => k.id === start);
          const p2 = adjustedKeypoints.find(k => k.id === end);
          if (!p1 || !p2) return null;
          return <line key={`link-${idx}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" className={isOverlay ? "skeleton-line-overlay" : "skeleton-line"} />;
        })}
        {adjustedKeypoints.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={hoveredPoint === p.id ? 5 : (isOverlay ? 3 : 2)} fill={hoveredPoint === p.id ? "#FFFFFF" : pointColor} stroke={isOverlay ? "rgba(0,0,0,0.5)" : "none"} strokeWidth={isOverlay ? "1" : "0"} className="skeleton-point" onMouseEnter={() => setHoveredPoint(p.id)} onMouseLeave={() => setHoveredPoint(null)} />
        ))}
      </svg>
    );
  };

  return (
    <div className="dataset-showcase-container">
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="logo-container">
              <Activity style={{height: '1.5rem', width: '1.5rem', color: 'white'}} />
            </div>
            <span className="logo-text">PoseData<span className="logo-text-highlight">Hub</span></span>
          </div>
          <div className="nav-right">
            <button onClick={() => setActiveTab('overview')} className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}>数据集概览</button>
            <button onClick={() => setActiveTab('methodology')} className={`nav-button ${activeTab === 'methodology' ? 'active' : ''}`}>标注方法论</button>
            <button onClick={() => setActiveTab('explorer')} className={`nav-button ${activeTab === 'explorer' ? 'active' : ''}`}>数据浏览器</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'overview' && (
          <div className="tab-content overview-tab">
            <div className="header-section">
              <h1 className="main-title">高精度人体姿态训练数据集</h1>
              <p className="subtitle">
                本项目采用多源异构数据融合策略，包含真实场景、实验室采集及合成数据，
                针对特定康复与健身动作进行了 <span className="highlight-text">像素级人工修正</span>。
              </p>
            </div>

            <div className="stats-grid">
              {[
                { label: '总图片样本', value: '45,000+', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: '标注关键点', value: '1.4M+', icon: PenTool, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: '动作类别', value: '28 类', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: '标注准确率', value: '96.5%', icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <div className="stat-card-header">
                    <div className={`stat-icon-container ${stat.bg}`}>
                      <stat.icon style={{height: '1.5rem', width: '1.5rem'}} className={`stat-icon ${stat.color}`} />
                    </div>
                    <span className="stat-verified-badge">Verified</span>
                  </div>
                  <h3 className="stat-value">{stat.value}</h3>
                  <p className="stat-label">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="analysis-grid">
              <div className="analysis-card">
                <h3 className="analysis-title">
                  <Brain style={{height: '1.25rem', width: '1.25rem', color: '#64748b'}} />
                  数据来源构成
                </h3>
                <div className="progress-bar-group">
                  {[
                    { label: '真实场景采集 (In-the-wild)', pct: 45, desc: '解决复杂光照与背景干扰', color: 'bg-blue-500' },
                    { label: '专业实验室采集 (Studio)', pct: 30, desc: '确保标准动作的高精度基准', color: 'bg-indigo-500' },
                    { label: '3D 渲染合成 (Synthetic)', pct: 25, desc: '补充极端角度与遮挡数据', color: 'bg-cyan-500' },
                  ].map((item, i) => (
                    <div key={i} className="progress-item">
                      <div className="progress-labels">
                        <span>{item.label}</span>
                        <span>{item.pct}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className={`progress-bar-fg ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                      </div>
                      <p className="progress-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="skeleton-card">
                <div className="skeleton-card-blur-1"></div>
                <div className="skeleton-card-blur-2"></div>
                
                <h3 className="skeleton-card-title">骨骼拓扑结构定义</h3>
                <div className="skeleton-card-content">
                  <div className="skeleton-preview-container">
                    {renderSkeleton(1, 0, 0, 'normal')}
                  </div>
                  <div className="skeleton-info">
                    <p className="skeleton-info-text">
                      采用行业标准的关键点拓扑结构，重点优化了四肢末端与核心躯干的连接关系。
                    </p>
                    <div className="hover-info-box">
                      <div className="hover-info-title">Current Focus</div>
                      <div className="hover-info-value">
                        {hoveredPoint !== null ? keypoints.find(k => k.id === hoveredPoint)?.name : 'Hover over points'}
                      </div>
                      <div className="hover-info-details">
                        ID: {hoveredPoint !== null ? hoveredPoint : '--'} | Confidence: {'>'}0.98
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="tab-content methodology-tab">
            <div className="header-section">
              <h2 className="main-title">Human-in-the-Loop 标注流程</h2>
              <p className="subtitle">
                为了满足验收指标中对“准确率”的严格要求，我们设计了四级数据清洗与标注流水线，确保每一条用于训练的数据都是“Ground Truth”级别。
              </p>
            </div>

            <div className="timeline-container">
              <div className="timeline-line"></div>
              {[
                { step: '01', title: '预处理与初筛', desc: '使用传统的计算机视觉算法剔除模糊、过曝及无效帧。利用自动化脚本进行数据平衡，防止长尾分布问题。', tags: ['Blur Detection', 'Data Balancing'] },
                { step: '02', title: '模型预标注 (Semi-Supervised)', desc: '利用上一代 Teacher Model 进行初步关键点预测。此阶段极大提升了标注效率，将人工工作量降低了 60%。', tags: ['Teacher-Student', 'Pseudo-Labeling'] },
                { step: '03', title: '人工精细修正', desc: '对于模型置信度低于 0.85 的样本，由专业标注团队介入。重点修正遮挡部位（如手部互遮、腿部交叉）。', tags: ['Manual Correction', 'Occlusion Handling'] },
                { step: '04', title: '专家抽检与验收', desc: '由康复医学专家或高级算法工程师进行最终抽检（抽检率 10%）。确保解剖学结构的合理性。', tags: ['Expert Review', 'QA > 99%'] }
              ].map((item, idx) => (
                <div key={idx} className={`timeline-item ${idx % 2 !== 0 ? 'right' : 'left'}`}>
                  <div className="timeline-step-container">
                    <div className={`timeline-step ${idx % 2 === 0 ? 'step-blue' : 'step-emerald'}`}>
                      {item.step}
                    </div>
                  </div>
                  <div className="timeline-card">
                    <h3 className="timeline-card-title">{item.title}</h3>
                    <p className="timeline-card-desc">{item.desc}</p>
                    <div className="timeline-card-tags">
                      {item.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="tab-content explorer-tab">
            <div className="filter-bar">
              <div className="filter-buttons">
                 <button className={`filter-button ${activeFilter === '全部动作' ? 'active' : ''}`} onClick={() => setActiveFilter('全部动作')}>
                   <Filter style={{height: '1rem', width: '1rem'}} /> 全部动作
                 </button>
                 <button className={`filter-button ${activeFilter === '多人场景 (Crowd)' ? 'active' : ''}`} onClick={() => setActiveFilter('多人场景 (Crowd)')}>
                   多人场景 (Crowd)
                 </button>
                 <button className={`filter-button ${activeFilter === '运动 (Sports)' ? 'active' : ''}`} onClick={() => setActiveFilter('运动 (Sports)')}>
                   运动 (Sports)
                 </button>
              </div>
              <div className="search-bar">
                <input type="text" placeholder="搜索样本 ID..." className="search-input" value={searchTerm} onChange={handleSearchChange} />
              </div>
            </div>

            <div className="image-grid">
              {filteredSamples.map((sample) => (
                <div key={sample.id} onClick={() => setSelectedSample(sample)} className="image-card">
                  <div className="image-container">
                     <img 
                       src={uploadedImageSrc} 
                       alt={sample.type}
                       className="image-asset"
                       style={{
                         width: '300%',
                         height: '200%',
                         top: sample.cropStyle.top,
                         left: sample.cropStyle.left,
                       }}
                       onError={(e) => {
                         e.target.onerror = null;
                         e.target.style.display = 'none';
                         e.target.parentElement.innerHTML = `<div class="image-error">需上传图片: keypoints-splash-big.png</div>`;
                       }}
                     />
                  </div>
                  <div className="image-overlay"></div>
                  <div className="skeleton-overlay">
                     {renderSkeleton(1, 0, 0, sample.type, true, sample.isPreRendered)}
                  </div>
                  <div className="info-label">
                    <div className="info-type">{sample.type}</div>
                    <div className="info-details">
                      <span>ID: {sample.id}</span>
                      <span className="info-source">{sample.source}</span>
                    </div>
                  </div>
                </div>
              ))}
              {[...Array(6)].map((_, i) => (
                <div key={`ph-${i}`} className="placeholder-card">
                  <div className="placeholder-icon"></div>
                  <span className="placeholder-text">Loading Dataset...</span>
                </div>
              ))}
            </div>
            
            <div className="load-more-container">
              <button className="load-more-button">
                加载更多样本 <ChevronRight style={{height: '1rem', width: '1rem'}} />
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedSample && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-visuals">
               <div className="modal-image-container">
                 <img 
                   src={uploadedImageSrc} 
                   className="modal-image" 
                   style={{
                     width: '300%', 
                     height: '200%',
                     top: selectedSample.cropStyle.top,
                     left: selectedSample.cropStyle.left,
                   }}
                   alt="Detail View" 
                 />
               </div>
              <div className="modal-skeleton-container">
                {renderSkeleton(1.5, 0, 0, selectedSample.type, true, selectedSample.isPreRendered)}
              </div>
              <div className="modal-sample-badge">
                <span>Sample #{selectedSample.id}</span>
                {selectedSample.isPreRendered && <span className="modal-sample-badge-highlight">• Multi-Person Ground Truth</span>}
              </div>
            </div>

            <div className="modal-metadata">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">{selectedSample.type}</h3>
                  <p className="modal-subtitle">Dataset Source: {selectedSample.source}</p>
                </div>
                <button onClick={() => setSelectedSample(null)} className="modal-close-button">
                  <svg className="modal-close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div>
                  <h4 className="modal-section-title">标注详情 (Annotation Details)</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-label">场景复杂度</div>
                      <div className="detail-value">{selectedSample.quality}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">关键点类型</div>
                      <div className="detail-value">Multi-Person (17+ Points)</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">审核状态</div>
                      <div className="detail-value verified">
                        <CheckCircle style={{height: '1rem', width: '1rem'}} /> Expert Verified
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">数据集归属</div>
                      <div className="detail-value">{selectedSample.source.split(' ')[0]}</div>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="modal-section-title">JSON 原始数据片段 (COCO Format)</h4>
                   <div className="code-block">
                     <p>{`{`}</p>
                     <p className="code-line">{`"image_id": ${selectedSample.id},`}</p>
                     <p className="code-line">{`"iscrowd": 0,`}</p>
                     <p className="code-line">{`"num_keypoints": 14,`}</p>
                     <p className="code-line">{`"keypoints": [`}</p>
                     <p className="code-comment">// [x, y, v] format for multi-person</p>
                     <p className="code-line">{`[420, 210, 2, 425, 208, 2, ...],`}</p>
                     <p className="code-line">{`[310, 150, 2, 315, 152, 2, ...]`}</p>
                     <p className="code-line">{`]`}</p>
                     <p>{`}`}</p>
                   </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="button-primary" onClick={handleExport}>
                  <Download style={{height: '1rem', width: '1.5rem'}} /> 导出标注数据
                </button>
                <button className="button-secondary">
                  报告错误
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetShowcase;
