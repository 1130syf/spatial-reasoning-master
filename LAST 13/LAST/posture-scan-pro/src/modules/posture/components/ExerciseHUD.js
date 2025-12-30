import React from 'react';
import './ExerciseHUD.css';

const StageIndicator = ({ currentStage }) => {
  const stages = [
    { id: 'ready', label: '准备' },
    { id: 'down', label: '下蹲' },
    { id: 'up', label: '站起' },
  ];
  const currentIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="stage-indicator-container">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className={`stage-item ${index <= currentIndex ? 'active' : ''}`}>
            <div className="stage-dot"></div>
            <div className="stage-label">{stage.label}</div>
          </div>
          {index < stages.length - 1 && <div className={`stage-line ${index < currentIndex ? 'active' : ''}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const ExerciseHUD = ({ state }) => {
  const { sessionState, stage, feedback, squatCount, targetCount, currentKneeAngle, lastSquatReport } = state;

  if (sessionState === 'INITIALIZING') {
    return (
      <div className="hud-overlay">
        <div className="initializing-fullscreen">
          <h1>正在初始化...</h1>
          <p>请在摄像头前保持站立姿势</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-overlay">
      <div className="top-hud">
        <StageIndicator currentStage={stage} />
        <div className="count-display">
          <span>{squatCount}</span> / {targetCount}
        </div>
      </div>

      <div className="bottom-hud">
        <div className="feedback-panel">
          {lastSquatReport && stage === 'ready' ? (
            <div className="analysis-result">
              <h4>上次分析:</h4>
              {lastSquatReport.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          ) : (
            <div className="live-feedback">
              <div className="angle-readout">{currentKneeAngle.toFixed(0)}°</div>
              <div className="feedback-text">{feedback}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseHUD;
