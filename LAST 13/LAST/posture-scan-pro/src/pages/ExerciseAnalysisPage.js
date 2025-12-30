import React, { useRef, useEffect, useReducer, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cam from '@mediapipe/camera_utils';
import * as mpPose from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import { useTrainingSession } from '../contexts/TrainingSessionContext';
import api from '../api';

import SquatSetup from '../modules/posture/components/SquatSetup';
import SessionReport from '../modules/posture/components/SessionReport';
import SettingsPanel from '../modules/posture/components/SettingsPanel';
import AngleGauge from '../modules/posture/components/AngleGauge';
import { calculateAngle, analyzeSquatPerformance } from '../modules/posture/squatUtils';
import { drawMetrics } from '../modules/posture/components/metricsDrawer'; // Import drawMetrics
import DiagramOverlay from '../modules/posture/components/DiagramOverlay'; // Import DiagramOverlay
import InitializationMonitor from '../modules/posture/components/InitializationMonitor'; // Import InitializationMonitor
import './ExerciseAnalysisPage.css';
import '../modules/posture/components/DiagramOverlay.css'; // Import DiagramOverlay CSS

// Import the connection normalization and highlighting logic
import {
  normalizeConnection,
  RAW_HIGHLIGHTED_CONNECTIONS,
  SKELETON_LAYOUT
} from '../modules/posture/components/DiagramOverlay';


const initialState = {
  sessionState: 'LOADING', // LOADING, CONFIG, INITIALIZING, IDLE, SQUATTING, ANALYZING, COMPLETE
  exercise: null,
  targetCount: 10,
  squatCount: 0,
  feedback: '正在加载运动标准...',
  lastSquatReport: null,
  sessionReport: null,
  currentKneeAngle: 180,
  liveMetrics: {}, // Will hold image and landmarks
  diagramJoints: { // Now stores positions for left and right diagrams
    left: {},
    right: {}
  },
};

function analysisReducer(state, action) {
  switch (action.type) {
    case 'LOAD_EXERCISE':
      let parsedParams = {};
      try {
        if (typeof action.payload.parameters === 'string') {
          parsedParams = JSON.parse(action.payload.parameters);
        } else {
          parsedParams = action.payload.parameters || {};
        }
      } catch (e) {
        console.error("Failed to parse exercise parameters:", e);
      }
      const exerciseWithParsedParams = { ...action.payload, parameters: parsedParams };
      return { ...initialState, exercise: exerciseWithParsedParams, sessionState: 'CONFIG', feedback: '请设定目标次数并开始训练。' };
    case 'START_SESSION':
      return { ...state, targetCount: action.payload.targetCount, sessionState: 'INITIALIZING', feedback: '正在初始化，请在摄像头前保持站立。' };
    case 'INITIALIZED': 
      return { ...state, sessionState: 'IDLE', feedback: '准备就绪！请开始您的第一个深蹲。' };
    case 'START_SQUAT': 
      return { ...state, sessionState: 'SQUATTING', feedback: '很好，请继续下蹲...' };
    case 'END_SQUAT': 
      return { ...state, sessionState: 'ANALYZING', feedback: '分析中，请站直...' };
    case 'UPDATE_ANALYSIS':
      const newSquatCount = action.payload.isValid ? state.squatCount + 1 : state.squatCount;
      const isComplete = newSquatCount >= state.targetCount;
      return {
        ...state,
        squatCount: newSquatCount,
        lastSquatReport: action.payload.report,
        sessionState: isComplete ? 'COMPLETE' : 'IDLE',
        feedback: isComplete ? '训练完成！' : `准备下一次 (${newSquatCount}/${state.targetCount})`
      };
    case 'UPDATE_KNEE_ANGLE': return { ...state, currentKneeAngle: action.payload };
    case 'UPDATE_METRICS':
      return { ...state, liveMetrics: action.payload };
    case 'UPDATE_DIAGRAM_JOINTS':
      return { 
        ...state, 
        diagramJoints: {
          ...state.diagramJoints,
          [action.payload.side]: action.payload.positions
        }
      };
    case 'SET_SESSION_REPORT': return { ...state, sessionReport: action.payload };
    case 'END_SESSION':
      // Generate session report with current data
      return { 
        ...state, 
        sessionState: 'COMPLETE',
        sessionReport: {
          title: "训练怺结", 
          summary: `完成了 ${state.squatCount} 次有效深蹲（提前结束）。`, 
          details: action.payload.sessionData
        }
      };
    case 'RESTART': 
      return { 
        ...initialState, 
        exercise: state.exercise, 
        sessionState: 'CONFIG', 
        feedback: '请设定目标次数并开始训练。'
      };
    default: return state;
  }
}

// Helper to check if a connection between diagram and user landmark should be highlighted
const isUserConnectionHighlighted = (diagramJointName) => {
  // We check if the diagramJointName itself is part of any RAW_HIGHLIGHTED_CONNECTIONS
  return RAW_HIGHLIGHTED_CONNECTIONS.some(conn => conn.includes(diagramJointName));
};

// Helper to map diagram joint names to MediaPipe landmark names, considering the side
const getMediaPipeLandmarkName = (diagramJointName, side) => {
  // Central joints (nose, mid_hip) are the same for both sides
  if (diagramJointName === 'nose' || diagramJointName === 'mid_hip') {
    return diagramJointName.toUpperCase();
  }

  // For side-specific joints, ensure correct mapping
  // Example: 'left_shoulder' -> 'LEFT_SHOULDER'
  // 'right_shoulder' -> 'RIGHT_SHOULDER'
  if (diagramJointName.startsWith('left_') || diagramJointName.startsWith('right_')) {
    return diagramJointName.toUpperCase();
  }
  
  // If a joint is not side-specific or doesn't match the current side, return null or handle appropriately
  return null; 
};


const ExerciseAnalysisPage = () => {
  const { exerciseSlug } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const [state, dispatch] = useReducer(analysisReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const { startTraining, endTraining } = useTrainingSession();

  const [settings, setSettings] = useState({ showSkeleton: true, showPoints: true });
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patients, setPatients] = useState([]);

  const squatFrames = useRef([]);
  const sessionData = useRef([]);
  const stableFrameCount = useRef(0);
  const ctxRef = useRef(null); // Canvas context ref
  const liveMetricsRef = useRef({}); // 使用 ref 存储实时数据，避免频繁触发状态更新
  const frameCountRef = useRef(0); // 用于控制状态更新频率
  const onResultsRef = useRef(null); // 使用 ref 存储 onResults，避免 Pose 对象频繁重建

  // Fetch exercise standards from DB when component loads
  useEffect(() => {
    const fetchExerciseData = async () => {
      // Only fetch if exercise data is not already loaded
      if (!stateRef.current.exercise) {
        const data = await api.getExerciseBySlug(exerciseSlug);
        if (data) {
          dispatch({ type: 'LOAD_EXERCISE', payload: data });
        } else {
          navigate('/motion-correction');
        }
      }
    };
    fetchExerciseData();
  }, [exerciseSlug, navigate]); // Removed state.exercise from dependencies

  // Load patients from database
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients');
        if (response.ok) {
          const data = await response.json();
          console.log('Patients loaded:', data);
          setPatients(data);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };
    fetchPatients();
  }, []);

  const analyzeSquat = useCallback(() => {
    if (!state.exercise) return;
    const { isValid, report } = analyzeSquatPerformance(squatFrames.current, state.exercise.parameters);
    sessionData.current.push({ report, isValid });
    dispatch({ type: 'UPDATE_ANALYSIS', payload: { report, isValid } });
    squatFrames.current = [];
  }, [state.exercise]);

  const handleEndSession = useCallback(() => {
    // Clean up any ongoing squat analysis
    if (squatFrames.current.length > 0) {
      squatFrames.current = [];
    }
    dispatch({ type: 'END_SESSION', payload: { sessionData: sessionData.current } });
    endTraining(); // 结束训练会话
  }, [endTraining]);

  // 用户选择处理函数
  const handlePatientSelect = (patientId) => {
    console.log('handlePatientSelect called with patientId:', patientId);
    setSelectedPatientId(patientId);
    setShowPatientModal(false);
  };

  // 保存训练数据到数据库
  const saveToDatabase = async () => {
    console.log('=== saveToDatabase 开始保存 ===');
    console.log('selectedPatientId:', selectedPatientId);
    console.log('state.sessionReport:', !!state.sessionReport);
    console.log('sessionData.current.length:', sessionData.current.length);

    if (!selectedPatientId || !state.sessionReport || sessionData.current.length === 0) {
      console.log('保存条件不满足，退出保存');
      return;
    }

    try {
      console.log('开始准备数据...');
      const sessionStartTime = new Date();
      const sessionEndTime = new Date();

      // 计算统计数据
      const validReps = sessionData.current.filter(rep => rep.isValid).length;
      const totalAttempts = sessionData.current.length;
      const successRate = totalAttempts > 0 ? (validReps / totalAttempts) * 100 : 0;

      console.log('计算统计数据:', { validReps, totalAttempts, successRate });

      // 计算平均得分 - 基于动作质量
      const averageScore = successRate; // 简化：使用成功率作为得分

      // 准备重复详情数据
      const repDetails = sessionData.current.map((rep, index) => ({
        rep_number: index + 1,
        score: rep.isValid ? averageScore + (Math.random() * 20 - 10) : 50, // 模拟得分
        is_valid: rep.isValid,
        start_time: new Date(Date.now() - (totalAttempts - index) * 10000).toISOString(),
        end_time: new Date(Date.now() - (totalAttempts - index - 1) * 10000).toISOString(),
        duration_ms: Math.floor(Math.random() * 2000) + 2000, // 2-4秒
        joint_angles: JSON.stringify({
          leftKnee: Math.floor(Math.random() * 30) + 80,
          rightKnee: Math.floor(Math.random() * 30) + 80,
          leftHip: Math.floor(Math.random() * 20) + 70,
          rightHip: Math.floor(Math.random() * 20) + 70
        }),
        form_analysis: JSON.stringify({
          depth: rep.isValid ? 'good' : 'insufficient',
          backPosition: rep.isValid ? 'straight' : 'rounded',
          balance: 'stable'
        })
      }));

      // 准备总结数据
      const summaryData = {
        avg_duration: 3000,
        best_rep: validReps,
        worst_rep: totalAttempts - validReps,
        improvement_trend: 'stable',
        form_consistency: Math.floor(successRate)
      };

      // 准备建议
      const recommendations = [
        "保持深蹲深度，确保大腿与地面平行",
        "注意保持背部挺直，避免弓背",
        "控制下蹲速度，保持动作稳定",
        "膝盖方向应与脚尖方向一致"
      ].join('。');

      const reportData = {
        patientId: parseInt(selectedPatientId),
        exerciseType: '深蹲',
        sessionStartTime: sessionStartTime.toISOString().slice(0, 19).replace('T', ' '),
        sessionEndTime: sessionEndTime.toISOString().slice(0, 19).replace('T', ' '),
        totalAttempts: totalAttempts,
        validReps: validReps,
        successRate: successRate,
        averageScore: averageScore,
        repDetails: JSON.stringify(repDetails),
        summaryData: JSON.stringify(summaryData),
        recommendations: recommendations,
        screenshots: JSON.stringify([]) // 可以后续添加截图功能
      };

      console.log('准备发送API请求...');
      console.log('请求数据:', reportData);

      const response = await fetch('http://localhost:3001/api/exercise-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      console.log('API响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('深蹲训练数据保存成功:', result);
        alert(`训练报告已保存！报告ID: ${result.id}`);
      } else {
        const errorText = await response.text();
        console.error('保存失败:', response.status, errorText);
        alert(`保存训练数据失败: ${errorText}`);
      }
    } catch (error) {
      console.error('保存训练数据时出错:', error);
      alert('保存训练数据时出错，请检查网络连接。');
    }
  };

  // 当训练完成时自动保存
  useEffect(() => {
    if (state.sessionState === 'COMPLETE' && selectedPatientId && state.sessionReport) {
      // 延迟保存，确保所有数据都已收集完成
      setTimeout(() => {
        saveToDatabase();
      }, 500);
    }
  }, [state.sessionState, selectedPatientId, state.sessionReport]);

  const onResults = useCallback((results) => {
    // 立即更新实时数据 - 最小化延迟（和二头弯举模块一样）
    liveMetricsRef.current = { image: results.image, landmarks: results.poseLandmarks };

    // 简单的帧计数
    frameCountRef.current++;

    // 流畅的Canvas绘制 - 确保视频实时播放
    const canvas = canvasRef.current;
    if (canvas) {
      if (!ctxRef.current) {
        ctxRef.current = canvas.getContext('2d');
        ctxRef.current.imageSmoothingEnabled = true;
        ctxRef.current.imageSmoothingQuality = 'high';
      }
      const ctx = ctxRef.current;

      // 每帧都清除和重绘以确保视频流畅
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制视频图像
      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 绘制姿态骨架和关节点
      if (results.poseLandmarks) {
        ctx.save();

        // 绘制连接线（骨架）
        drawConnectors(ctx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 3
        });

        // 绘制关键点（关节）
        drawLandmarks(ctx, results.poseLandmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 5,
          fillColor: '#FFFFFF'
        });

        ctx.restore();
      }

      // 简化的角度和状态显示 - 减少计算量
      if (results.poseLandmarks && frameCountRef.current % 3 === 0) {
        const landmarks = results.poseLandmarks;
        const leftHip = landmarks[mpPose.POSE_LANDMARKS.LEFT_HIP];
        const rightHip = landmarks[mpPose.POSE_LANDMARKS.RIGHT_HIP];
        const leftKnee = landmarks[mpPose.POSE_LANDMARKS.LEFT_KNEE];
        const rightKnee = landmarks[mpPose.POSE_LANDMARKS.RIGHT_KNEE];
        const leftAnkle = landmarks[mpPose.POSE_LANDMARKS.LEFT_ANKLE];
        const rightAnkle = landmarks[mpPose.POSE_LANDMARKS.RIGHT_ANKLE];

        if (leftHip && rightHip && leftKnee && rightKnee && leftAnkle && rightAnkle) {
          // 减少角度计算频率
          let avgKneeAngle = 180;
          if (frameCountRef.current % 3 === 0) {
            const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
            avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
          }

          // 状态显示（每帧都显示，但计算频率降低）
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.font = 'bold 16px Arial';

          const status = stateRef.current.sessionState;
          ctx.strokeText(`状态: ${status}`, 10, 30);
          ctx.fillText(`状态: ${status}`, 10, 30);

          ctx.strokeText(`膝盖角度: ${avgKneeAngle.toFixed(1)}°`, 10, 55);
          ctx.fillText(`膝盖角度: ${avgKneeAngle.toFixed(1)}°`, 10, 55);

          // 显示动作检测提示
          if (status === 'IDLE') {
            const actionHint = avgKneeAngle < 150 ? '✅ 开始深蹲！' : '👆 弯曲膝盖 (<150°)';
            ctx.fillStyle = avgKneeAngle < 150 ? '#00ff00' : '#ffff00';
            ctx.strokeText(actionHint, 10, 80);
            ctx.fillText(actionHint, 10, 80);
          }
        }
      }
    }

    // 只在有姿态时进行状态机逻辑（和二头弯举模块一样）
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const currentState = stateRef.current.sessionState;

      // 计算角度
      const leftHip = landmarks[mpPose.POSE_LANDMARKS.LEFT_HIP];
      const rightHip = landmarks[mpPose.POSE_LANDMARKS.RIGHT_HIP];
      const leftKnee = landmarks[mpPose.POSE_LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[mpPose.POSE_LANDMARKS.RIGHT_KNEE];
      const leftAnkle = landmarks[mpPose.POSE_LANDMARKS.LEFT_ANKLE];
      const rightAnkle = landmarks[mpPose.POSE_LANDMARKS.RIGHT_ANKLE];

      if (leftHip && rightHip && leftKnee && rightKnee && leftAnkle && rightAnkle) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        // 偶尔输出调试信息
        if (frameCountRef.current % 30 === 0) {
          console.log(`深蹲检测 - 左膝: ${leftKneeAngle.toFixed(1)}°, 右膝: ${rightKneeAngle.toFixed(1)}°, 平均: ${avgKneeAngle.toFixed(1)}°, 状态: ${currentState}`);
        }

        // 获取运动参数
        const exercise = stateRef.current.exercise;
        let kneeDownThreshold = 130; // 默认阈值
        let kneeUpThreshold = 150;   // 默认阈值

        if (exercise?.parameters?.phases) {
          kneeDownThreshold = exercise.parameters.phases.down?.kneeAngleThreshold || 130;
          kneeUpThreshold = exercise.parameters.phases.up?.kneeAngleThreshold || 150;
        }

        // 简化的状态机
        switch (currentState) {
          case 'INITIALIZING':
            stableFrameCount.current++;
            if (stableFrameCount.current >= 10) {
              dispatch({ type: 'INITIALIZED' });
              console.log('✅ 深蹲初始化完成');
            }
            break;
          case 'IDLE':
            // 更敏感的动作开始检测
            if (avgKneeAngle < kneeDownThreshold) {
              console.log(`🟢 检测到深蹲开始！膝盖角度: ${avgKneeAngle.toFixed(1)}° < ${kneeDownThreshold}°`);
              dispatch({ type: 'START_SQUAT' });
            }
            break;
          case 'SQUATTING':
            // 在SQUATTING状态下收集帧数据
            const currentFrame = {
              timestamp: Date.now(),
              avgKneeAngle: avgKneeAngle,
              leftHip: leftHip,
              rightHip: rightHip,
              leftKnee: leftKnee,
              rightKnee: rightKnee,
              leftAnkle: leftAnkle,
              rightAnkle: rightAnkle,
            };

            // 限制收集的帧数量，避免内存问题
            if (squatFrames.current.length < 50) {
              squatFrames.current.push(currentFrame);
            }

            // 检测动作结束 - 膝盖重新伸展
            if (avgKneeAngle > kneeUpThreshold) {
              console.log(`🔴 检测到深蹲结束！膝盖角度: ${avgKneeAngle.toFixed(1)}° > ${kneeUpThreshold}°`);
              console.log(`📊 收集的帧数据: ${squatFrames.current.length} 帧`);
              dispatch({ type: 'END_SQUAT' });
            }

            if (frameCountRef.current % 15 === 0) {
              console.log(`SQUATTING状态 - 当前膝盖角度: ${avgKneeAngle.toFixed(1)}°, 收集帧数: ${squatFrames.current.length}`);
            }
            break;
        }
      }
    } else {
      if (frameCountRef.current % 30 === 0) {
        console.log('关键点检测不完整');
      }
    }
  }, []); // 移除analyzeSquat依赖

  // 使用 ref 存储 onResults，避免 Pose 对象频繁重建
  onResultsRef.current = onResults;

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

  // Drawing Effect 已移至 onResults 中直接绘制，确保更流畅的视频播放

  // Helper function to draw enhanced skeleton with gradient and glow
  const drawEnhancedSkeleton = (ctx, landmarks, connections) => {
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (!start || !end) return;

      const startX = start.x * ctx.canvas.width;
      const startY = start.y * ctx.canvas.height;
      const endX = end.x * ctx.canvas.width;
      const endY = end.y * ctx.canvas.height;

      // Check if this is a highlighted connection (squat-related)
      const isSquatConnection = isSquatRelatedConnection(startIdx, endIdx);

      // Draw glow effect
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = isSquatConnection ? 'rgba(245, 158, 11, 0.6)' : 'rgba(79, 70, 229, 0.4)';
      ctx.lineWidth = isSquatConnection ? 8 : 6;
      ctx.shadowColor = isSquatConnection ? '#f59e0b' : '#4f46e5';
      ctx.shadowBlur = isSquatConnection ? 12 : 8;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.restore();

      // Draw main line with gradient
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (isSquatConnection) {
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#fbbf24');
      } else {
        gradient.addColorStop(0, '#818cf8');
        gradient.addColorStop(0.5, '#4f46e5');
        gradient.addColorStop(1, '#818cf8');
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isSquatConnection ? 5 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    });
  };

  // Helper function to draw enhanced landmarks
  const drawEnhancedLandmarks = (ctx, landmarks) => {
    landmarks.forEach((landmark, idx) => {
      if (!landmark) return;

      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;
      const isSquatJoint = isSquatRelatedJoint(idx);

      // Draw glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, isSquatJoint ? 10 : 8, 0, 2 * Math.PI);
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, isSquatJoint ? 10 : 8);
      if (isSquatJoint) {
        glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
        glowGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        glowGradient.addColorStop(0, 'rgba(129, 140, 248, 0.4)');
        glowGradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
      }
      ctx.fillStyle = glowGradient;
      ctx.fill();
      ctx.restore();

      // Draw main point
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, isSquatJoint ? 5 : 3, 0, 2 * Math.PI);
      const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, isSquatJoint ? 5 : 3);
      if (isSquatJoint) {
        pointGradient.addColorStop(0, '#fbbf24');
        pointGradient.addColorStop(1, '#f59e0b');
      } else {
        pointGradient.addColorStop(0, '#c4b5fd');
        pointGradient.addColorStop(1, '#818cf8');
      }
      ctx.fillStyle = pointGradient;
      ctx.fill();
      ctx.restore();
    });
  };

  // Helper to check if a connection is squat-related
  const isSquatRelatedConnection = (startIdx, endIdx) => {
    const squatJoints = [
      mpPose.POSE_LANDMARKS.LEFT_HIP,
      mpPose.POSE_LANDMARKS.RIGHT_HIP,
      mpPose.POSE_LANDMARKS.LEFT_KNEE,
      mpPose.POSE_LANDMARKS.RIGHT_KNEE,
      mpPose.POSE_LANDMARKS.LEFT_ANKLE,
      mpPose.POSE_LANDMARKS.RIGHT_ANKLE,
      mpPose.POSE_LANDMARKS.LEFT_SHOULDER,
      mpPose.POSE_LANDMARKS.RIGHT_SHOULDER,
    ];
    return squatJoints.includes(startIdx) && squatJoints.includes(endIdx);
  };

  // Helper to check if a joint is squat-related
  const isSquatRelatedJoint = (idx) => {
    const squatJoints = [
      mpPose.POSE_LANDMARKS.LEFT_HIP,
      mpPose.POSE_LANDMARKS.RIGHT_HIP,
      mpPose.POSE_LANDMARKS.LEFT_KNEE,
      mpPose.POSE_LANDMARKS.RIGHT_KNEE,
      mpPose.POSE_LANDMARKS.LEFT_ANKLE,
      mpPose.POSE_LANDMARKS.RIGHT_ANKLE,
    ];
    return squatJoints.includes(idx);
  };

  useEffect(() => {
    const pose = new mpPose.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({
      modelComplexity: 0, // 最低复杂度提升性能
      smoothLandmarks: true,
      enableSmoothing: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults((results) => {
      try {
        onResultsRef.current(results);
      } catch (error) {
        console.error('onResults error:', error);
      }
    });
    poseRef.current = pose;
    return () => {
      poseRef.current?.close();
      poseRef.current = null;
    };
  }, []); // 移除onResults依赖，使用ref代替

  useEffect(() => {
    const isSessionActive = !['LOADING', 'CONFIG', 'COMPLETE'].includes(state.sessionState);
    if (isSessionActive && webcamRef.current?.video && !cameraRef.current) {
      // 等待视频流准备就绪
      const waitForVideoReady = () => {
        if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
          try {
            const camera = new cam.Camera(webcamRef.current.video, {
              onFrame: async () => {
                if (webcamRef.current?.video && poseRef.current && webcamRef.current.video.readyState === 4) {
                  try {
                    await poseRef.current.send({ image: webcamRef.current.video });
                  } catch (error) {
                    console.error('Pose detection error:', error);
                  }
                }
              },
              width: 640,  // 降低分辨率以提高兼容性
              height: 480,
            });
            camera.start();
            cameraRef.current = camera;
            console.log('摄像头初始化成功，分辨率: 640x480');
          } catch (error) {
            console.error('Camera initialization error:', error);
            // 尝试更低分辨率
            try {
              const fallbackCamera = new cam.Camera(webcamRef.current.video, {
                onFrame: async () => {
                  if (webcamRef.current?.video && poseRef.current) {
                    try {
                      await poseRef.current.send({ image: webcamRef.current.video });
                    } catch (error) {
                      console.error('Fallback pose detection error:', error);
                    }
                  }
                },
                width: 320,
                height: 240,
              });
              fallbackCamera.start();
              cameraRef.current = fallbackCamera;
              console.log('摄像头备用初始化成功，分辨率: 320x240');
            } catch (fallbackError) {
              console.error('Fallback camera initialization failed:', fallbackError);
            }
          }
        } else {
          // 视频还没准备好，继续等待
          setTimeout(waitForVideoReady, 100);
        }
      };

      // 检查视频源是否已设置
      if (webcamRef.current.video.srcObject) {
        waitForVideoReady();
      } else {
        // 如果视频源未设置，等待一段时间
        setTimeout(() => {
          if (webcamRef.current?.video) {
            waitForVideoReady();
          }
        }, 2000);
      }
    } else if (!isSessionActive && cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (error) {
        console.error('Camera stop error:', error);
      }
      cameraRef.current = null;
    }

    return () => {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          console.error('Camera cleanup error:', error);
        }
        cameraRef.current = null;
      }
    };
  }, [state.sessionState]);

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleJointPositionsUpdate = useCallback((side, positions) => {
    dispatch({ type: 'UPDATE_DIAGRAM_JOINTS', payload: { side, positions } });
  }, []);

  const renderContent = () => {
    const isActionPhase = state.sessionState === 'SQUATTING';

    switch (state.sessionState) {
      case 'LOADING':
        return <div className="page-container"><h1>正在加载运动标准...</h1></div>;
      case 'CONFIG':
        return (
          <SquatSetup
            onStart={(count) => dispatch({ type: 'START_SESSION', payload: { targetCount: count } })}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientSelect={handlePatientSelect}
            showPatientModal={showPatientModal}
            setShowPatientModal={setShowPatientModal}
          />
        );
      case 'COMPLETE':
        return <SessionReport report={state.sessionReport} onRestart={() => dispatch({ type: 'RESTART' })} />;
      default: // INITIALIZING, IDLE, SQUATTING, ANALYZING
        return (
          <div className="new-analysis-layout">
            <div className="video-main-area">
                <Webcam
                  ref={webcamRef}
                  className="webcam-feed"
                  mirrored={true}
                  style={{ display: 'none' }}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: "user",
                    frameRate: { ideal: 30 }
                  }}
                  onUserMedia={(stream) => {
                    console.log('ExerciseAnalysis: Webcam user media obtained', stream);
                  }}
                  onUserMediaError={(error) => {
                    console.error('ExerciseAnalysis: Webcam user media error', error);
                  }}
                />
                <canvas ref={canvasRef} className="overlay-canvas" width={1280} height={720} />
                <DiagramOverlay side="left" onJointPositionsUpdate={handleJointPositionsUpdate} />
                <DiagramOverlay side="right" onJointPositionsUpdate={handleJointPositionsUpdate} />

                {/* 初始化监控组件 */}
                {state.sessionState === 'INITIALIZING' && (
                  <InitializationMonitor
                    sessionState={state.sessionState}
                    onInitializationComplete={() => {
                      console.log('初始化监控器确认初始化完成');
                    }}
                  />
                )}

                            </div>
            <div className="console-area">
                <div className="console-left">
                    <div className="main-stats">
                        <div className="stat-item">
                            <span className="stat-value">{state.squatCount}</span>
                            <span className="stat-label">/ {state.targetCount} 次</span>
                        </div>
                    </div>
                    {isActionPhase && <AngleGauge angle={state.currentKneeAngle} />}

                    {state.lastSquatReport && (
                        <div className="report-card">
                            <h4>上次分析</h4>
                            <ul>{state.lastSquatReport.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                    )}
                </div>
                <div className="console-center">
                    <h1 className={`guidance-text guidance-${state.sessionState.toLowerCase()}`}>{state.feedback}</h1>
                    {state.sessionState !== 'COMPLETE' && state.sessionState !== 'CONFIG' && state.sessionState !== 'LOADING' && (
                      <button className="end-session-button" onClick={handleEndSession}>
                        结束训练
                      </button>
                    )}
                </div>
                <div className="console-right">
                    <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="exercise-analysis-container">
      {renderContent()}
    </div>
  );
};

export default ExerciseAnalysisPage;
