import React, { useRef, useEffect, useReducer, useCallback } from 'react';
import * as cam from '@mediapipe/camera_utils';
import * as mpPose from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import { useTrainingSession } from '../../contexts/TrainingSessionContext';

import './StandardSquat.css';
import SquatSetup from './components/SquatSetup';
import SquattingView from './components/SquattingView';
import SessionReport from './components/SessionReport';
import { calculateAngle, analyzeSquatPerformance } from './squatUtils';
// The drawing function is no longer called here, but in the view component.

const initialState = {
  sessionState: 'CONFIG',
  targetCount: 10,
  squatCount: 0,
  feedback: '请设定目标次数并开始训练。',
  lastSquatReport: null,
  sessionReport: null,
  liveMetrics: [], // This will now be passed to the view component
};

function squatReducer(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        targetCount: action.payload.targetCount,
        sessionState: 'INITIALIZING',
        feedback: '正在初始化，请在画面中保持稳定...',
      };
    case 'INITIALIZED':
      return { ...state, sessionState: 'IDLE', feedback: '准备好后，请开始深蹲。' };
    case 'START_SQUAT':
      return { ...state, sessionState: 'SQUATTING', feedback: '下蹲中...' };
    case 'END_SQUAT':
      return { ...state, sessionState: 'ANALYZING', feedback: '分析中...' };
    case 'UPDATE_ANALYSIS':
      const newSquatCount = action.payload.isValid ? state.squatCount + 1 : state.squatCount;
      const isComplete = newSquatCount >= state.targetCount;
      return {
        ...state,
        squatCount: newSquatCount,
        lastSquatReport: action.payload.report,
        sessionState: isComplete ? 'COMPLETE' : 'IDLE',
        feedback: isComplete ? '训练完成！' : `准备下一次深蹲 (${newSquatCount}/${state.targetCount})。`,
      };
    case 'UPDATE_METRICS': // This action is now responsible for updating the metrics data
      return { ...state, liveMetrics: action.payload };
    case 'SET_SESSION_REPORT':
      return { ...state, sessionReport: action.payload };
    case 'END_SESSION':
      // Generate session report with current data
      return { 
        ...state, 
        sessionState: 'COMPLETE',
        sessionReport: {
          title: "训练总结", 
          summary: `完成了 ${state.squatCount} 次有效深蹲（提前结束）。`, 
          details: action.payload.sessionData
        }
      };
    case 'RESTART':
      return initialState;
    default:
      return state;
  }
}

const StandardSquat = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const [state, dispatch] = useReducer(squatReducer, initialState);
  const { startTraining, endTraining } = useTrainingSession();

  const squatFrames = useRef([]);
  const sessionData = useRef([]);
  const stableFrameCount = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const analyzeSquat = useCallback(() => {
    const { isValid, report } = analyzeSquatPerformance(squatFrames.current);
    sessionData.current.push({ report, isValid, frames: squatFrames.current });
    dispatch({ type: 'UPDATE_ANALYSIS', payload: { report, isValid } });
    squatFrames.current = [];
  }, []);

  const handleEndSession = useCallback(() => {
    // Clean up any ongoing squat analysis
    if (squatFrames.current.length > 0) {
      squatFrames.current = [];
    }
    dispatch({ type: 'END_SESSION', payload: { sessionData: sessionData.current } });
    endTraining(); // 结束训练会话
  }, [endTraining]);

  const onResults = useCallback((results) => {
    // The drawing logic is now moved to the SquattingView component.
    // This callback now only focuses on processing landmarks and updating state.
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const leftHip = landmarks[23];
      const leftKnee = landmarks[25];
      const leftAnkle = landmarks[27];
      const rightHip = landmarks[24];
      const rightKnee = landmarks[26];
      const rightAnkle = landmarks[28];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];

      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
      const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      const shoulderMidpoint = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
      const trunkAngle = calculateAngle(shoulderMidpoint, hipMidpoint, {x: hipMidpoint.x, y: hipMidpoint.y + 1});

      const metrics = [
        { type: 'leftKnee', label: '左膝角度', value: leftKneeAngle, landmark: leftKnee, position: 'left', color: '#f59e0b' },
        { type: 'rightKnee', label: '右膝角度', value: rightKneeAngle, landmark: rightKnee, position: 'right', color: '#f59e0b' },
        { type: 'trunk', label: '躯干角度', value: trunkAngle, landmark: shoulderMidpoint, position: 'left', color: '#10b981' },
      ];
      dispatch({ type: 'UPDATE_METRICS', payload: { metrics, image: results.image, landmarks: results.poseLandmarks } });

      const currentState = stateRef.current.sessionState;
      switch (currentState) {
        case 'INITIALIZING':
          stableFrameCount.current++;
          if (stableFrameCount.current > 30) dispatch({ type: 'INITIALIZED' });
          break;
        case 'IDLE':
          if (avgKneeAngle < 150) dispatch({ type: 'START_SQUAT' });
          break;
        case 'SQUATTING':
          squatFrames.current.push({ avgKneeAngle, trunkAngle });
          if (avgKneeAngle > 165) dispatch({ type: 'END_SQUAT' });
          break;
        default:
          break;
      }
    }
  }, []);

  useEffect(() => {
    if (state.sessionState === 'ANALYZING') {
      analyzeSquat();
    }
    if (state.sessionState === 'COMPLETE' && !state.sessionReport) {
      const report = { title: "训练总结", summary: `完成了 ${state.squatCount} 次有效深蹲。`, details: sessionData.current };
      dispatch({ type: 'SET_SESSION_REPORT', payload: report });
    }
  }, [state.sessionState, state.squatCount, state.sessionReport, analyzeSquat]);

  // 监听 sessionState 变化，管理训练会话状态
  useEffect(() => {
    const isTrainingState = ['INITIALIZING', 'IDLE', 'SQUATTING', 'ANALYZING'].includes(state.sessionState);
    if (isTrainingState) {
      startTraining('squat');
    } else if (state.sessionState === 'COMPLETE') {
      endTraining();
    }
  }, [state.sessionState, startTraining, endTraining]);

  useEffect(() => {
    poseRef.current = new mpPose.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    poseRef.current.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    
    return () => {
      poseRef.current?.close();
    };
  }, []);

  useEffect(() => {
    poseRef.current.onResults(onResults);

    const isSessionActive = !['CONFIG', 'COMPLETE'].includes(state.sessionState);
    let camera = null;

    if (isSessionActive && webcamRef.current?.video) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && poseRef.current) {
            try {
              await poseRef.current.send({ image: webcamRef.current.video });
            } catch (error) {
              console.error('Pose detection error:', error);
            }
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
    
    return () => {
      if (camera) {
        camera.stop();
        camera = null;
      }
    };
  }, [state.sessionState, onResults]);

  const renderContent = () => {
    switch (state.sessionState) {
      case 'CONFIG':
        return <SquatSetup onStart={(count) => dispatch({ type: 'START_SESSION', payload: { targetCount: count } })} />;
      case 'COMPLETE':
        return <SessionReport report={state.sessionReport} onRestart={() => dispatch({ type: 'RESTART' })} />;
      default:
        return (
          <SquattingView
            webcamRef={webcamRef}
            canvasRef={canvasRef}
            state={state}
            onEndSession={handleEndSession}
          />
        );
    }
  };

  return (
    <div className="standard-squat-container">
      {renderContent()}
    </div>
  );
};

export default StandardSquat;
