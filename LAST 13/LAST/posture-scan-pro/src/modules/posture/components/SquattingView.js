import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import * as mpPose from '@mediapipe/pose';

import MetricsOverlay from './MetricsOverlay';
import { drawMetrics } from './metricsDrawer';
import './SquattingView.css';

const SquattingView = ({ webcamRef, canvasRef, state, onEndSession }) => {
  const { sessionState, targetCount, squatCount, feedback, lastSquatReport, liveMetrics } = state;
  const dataBoxRefs = useRef({});

  useEffect(() => {
    if (!canvasRef.current || !liveMetrics || !liveMetrics.image) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 1. Clear canvas and draw the video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(liveMetrics.image, 0, 0, canvas.width, canvas.height);

    // 2. Draw the pose landmarks
    if (liveMetrics.landmarks) {
      drawConnectors(ctx, liveMetrics.landmarks, mpPose.POSE_CONNECTIONS, { color: '#4f46e5', lineWidth: 4 });
      drawLandmarks(ctx, liveMetrics.landmarks, { color: '#818cf8', lineWidth: 2 });
    }

    // 3. Calculate and draw the leader lines
    const linesToDraw = (liveMetrics.metrics || []).map(metric => {
      const ref = dataBoxRefs.current[metric.label];
      if (!ref || !metric.landmark) return null;

      const boxRect = ref.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      const landmarkCanvasX = metric.landmark.x * canvas.width;
      
      // Correctly determine the line's starting X based on the relative positions
      // of the landmark and the data box, making the connection logic robust.
      const boxCenterX = boxRect.left - canvasRect.x + boxRect.width / 2;
      const startX = landmarkCanvasX > boxCenterX 
        ? boxRect.right - canvasRect.x 
        : boxRect.left - canvasRect.x;

      const startY = boxRect.top - canvasRect.y + boxRect.height / 2;

      return {
        startX,
        startY,
        endX: landmarkCanvasX,
        endY: metric.landmark.y * canvas.height,
        color: metric.color || '#4f46e5',
      };
    }).filter(Boolean);

    drawMetrics(ctx, linesToDraw);

  }, [liveMetrics, canvasRef]);

  return (
    <div className="squatting-view-new">
      <div className="video-area">
        <Webcam ref={webcamRef} className="webcam-feed" mirrored={true} style={{ display: 'none' }} />
        <canvas ref={canvasRef} className="overlay-canvas" width={1280} height={720} />
        
        {/* The new Metrics Overlay is rendered on top */}
        <MetricsOverlay metrics={liveMetrics?.metrics || []} dataBoxRefs={dataBoxRefs} />
      </div>

      <div className="console-area-squat">
        <div className="main-stats">
          <div className="stat-item">
            <span className="stat-value">{squatCount}</span>
            <span className="stat-label">/ {targetCount} 次</span>
          </div>
        </div>
        <div className="feedback-console">
          <h1 className={`guidance-text guidance-${sessionState.toLowerCase()}`}>{feedback}</h1>
          {sessionState !== 'COMPLETE' && sessionState !== 'CONFIG' && (
            <button className="end-session-button" onClick={onEndSession}>
              结束训练
            </button>
          )}
        </div>
        <div className="report-console">
          {lastSquatReport && (
            <div className="report-card">
              <h4>上次分析</h4>
              <ul>
                {lastSquatReport.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquattingView;
