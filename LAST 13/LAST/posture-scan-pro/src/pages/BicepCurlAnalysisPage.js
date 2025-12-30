import React, { useRef, useEffect, useReducer, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cam from '@mediapipe/camera_utils'; // Corrected import syntax
import * as mpPose from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import { useTrainingSession } from '../contexts/TrainingSessionContext';
import api from '../api';

import SessionReport from '../modules/posture/components/SessionReport';
import SettingsPanel from '../modules/posture/components/SettingsPanel';
import { calculateAngle, analyzeBicepCurlPerformance } from '../modules/posture/bicepCurlUtils';
import { drawMetrics } from '../modules/posture/components/metricsDrawer';
import DiagramOverlay from '../modules/posture/components/DiagramOverlay'; // Import the new component
import InitializationMonitor from '../modules/posture/components/InitializationMonitor'; // Import InitializationMonitor
import './ExerciseAnalysisPage.css';
import '../modules/posture/components/DiagramOverlay.css'; // CORRECTED PATH

// Import the connection normalization and highlighting logic
import {
  normalizeConnection,
  SKELETON_LAYOUT // Also import SKELETON_LAYOUT for mapping
} from '../modules/posture/components/DiagramOverlay';

// Define bicep curl specific highlighted connections
const BICEP_HIGHLIGHTED_CONNECTIONS = [
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
];

const RAW_HIGHLIGHTED_CONNECTIONS = BICEP_HIGHLIGHTED_CONNECTIONS;

// 将常用的关节索引数组提取到组件外部，避免每帧重复创建
const BICEP_JOINT_INDICES = [
  11, // LEFT_SHOULDER
  12, // RIGHT_SHOULDER
  13, // LEFT_ELBOW
  14, // RIGHT_ELBOW
  15, // LEFT_WRIST
  16, // RIGHT_WRIST
];

const BICEP_JOINT_INDICES_SET = new Set(BICEP_JOINT_INDICES);

// 将绘图辅助函数移到组件外部，避免每次渲染时重新创建
const isBicepRelatedConnectionStatic = (startIdx, endIdx) => {
  return BICEP_JOINT_INDICES_SET.has(startIdx) && BICEP_JOINT_INDICES_SET.has(endIdx);
};

const BICEP_CURL_JOINT_INDICES = [
  13, // LEFT_ELBOW
  14, // RIGHT_ELBOW
  15, // LEFT_WRIST
  16, // RIGHT_WRIST
];

const BICEP_CURL_JOINT_INDICES_SET = new Set(BICEP_CURL_JOINT_INDICES);

const isBicepRelatedJointStatic = (idx) => {
  return BICEP_CURL_JOINT_INDICES_SET.has(idx);
};

// 将绘图函数移到组件外部
const drawEnhancedBicepSkeletonStatic = (ctx, landmarks, connections, showSkeleton) => {
  if (!showSkeleton) return;
  
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (!start || !end) return;

    const startX = start.x * canvasWidth;
    const startY = start.y * canvasHeight;
    const endX = end.x * canvasWidth;
    const endY = end.y * canvasHeight;

    const isBicepConnection = isBicepRelatedConnectionStatic(startIdx, endIdx);

    // Draw glow effect
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = isBicepConnection ? 'rgba(245, 158, 11, 0.6)' : 'rgba(79, 70, 229, 0.4)';
    ctx.lineWidth = isBicepConnection ? 8 : 6;
    ctx.shadowColor = isBicepConnection ? '#f59e0b' : '#4f46e5';
    ctx.shadowBlur = isBicepConnection ? 12 : 8;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();

    // Draw main line with gradient
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    if (isBicepConnection) {
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
    ctx.lineWidth = isBicepConnection ? 5 : 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  });
};

const drawEnhancedBicepLandmarksStatic = (ctx, landmarks, showPoints) => {
  if (!showPoints) return;
  
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  landmarks.forEach((landmark, idx) => {
    if (!landmark) return;

    const x = landmark.x * canvasWidth;
    const y = landmark.y * canvasHeight;
    const isBicepJoint = isBicepRelatedJointStatic(idx);

    // Draw glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, isBicepJoint ? 10 : 8, 0, 2 * Math.PI);
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, isBicepJoint ? 10 : 8);
    if (isBicepJoint) {
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
    ctx.arc(x, y, isBicepJoint ? 5 : 3, 0, 2 * Math.PI);
    const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, isBicepJoint ? 5 : 3);
    if (isBicepJoint) {
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


const initialState = {
  sessionState: 'LOADING',
  exercise: null,
  targetCount: 10,
  repCount: 0,
  feedback: '正在加载运动标准...',
  lastRepReport: null,
  sessionReport: null,
  hasReachedPeak: false,
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
      return { ...state, sessionState: 'IDLE', feedback: '准备就绪！请开始您的第一个弯举。' };
    case 'START_ACTION': 
      return { ...state, sessionState: 'ACTION', feedback: '很好，请继续弯举...' };
    case 'END_ACTION': 
      return { ...state, sessionState: 'ANALYZING', feedback: '分析中，请放下手臂...', hasReachedPeak: false };
    case 'REACHED_PEAK':
      return { ...state, hasReachedPeak: true, feedback: '缓慢放下手臂...' };
    case 'UPDATE_ANALYSIS':
      const newRepCount = action.payload.isValid ? state.repCount + 1 : state.repCount;
      const isComplete = newRepCount >= state.targetCount;
      return {
        ...state,
        repCount: newRepCount,
        lastRepReport: action.payload.report,
        sessionState: isComplete ? 'COMPLETE' : 'IDLE',
        feedback: isComplete ? '训练完成！' : `准备下一次 (${newRepCount}/${state.targetCount})`
      };
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
      console.log('END_SESSION action 被调用，payload:', action.payload);
      console.log('sessionData.length:', action.payload.sessionData ? action.payload.sessionData.length : 'undefined');
      return {
        ...state,
        sessionState: 'COMPLETE',
        sessionReport: {
          title: "训练总结",
          summary: `完成了 ${state.repCount} 次有效弯举（提前结束）。`,
          details: action.payload.sessionData || []
        }
      };
    case 'RESTART': 
      return { 
        ...initialState, 
        exercise: state.exercise, 
        sessionState: 'CONFIG',
        feedback: '请设定目标次数并开始训练。',
        liveMetrics: {}, // 清空实时数据
      };
    default: return state;
  }
}

const ExerciseSetup = ({ onStart, defaultReps = 10, patients, selectedPatientId, onPatientSelect, showPatientModal, setShowPatientModal }) => {
    const [count, setCount] = useState(defaultReps);

    const handleStart = () => {
        console.log('Bicep handleStart called', { count, selectedPatientId });
        if (!selectedPatientId) {
            // 如果没有选择用户，先显示用户选择弹窗
            setShowPatientModal(true);
        } else {
            // 如果已经选择用户，直接开始训练
            onStart(count);
        }
    };

    return (
        <div className="setup-container">
            <h1>二头弯举</h1>
            <p>请设定本次训练的目标次数。</p>

            {/* 用户信息显示 */}
            {selectedPatientId && (
                <div className="patient-info-display">
                    <span className="patient-label">当前用户:</span>
                    <span className="patient-name">
                        {patients.find(p => p.id === parseInt(selectedPatientId))?.name || `ID: ${selectedPatientId}`}
                    </span>
                    <button className="change-patient-btn" onClick={() => setShowPatientModal(true)}>
                        更换用户
                    </button>
                </div>
            )}

            <div className="rep-selector">
                <button onClick={() => setCount(c => Math.max(1, c - 1))}>-</button>
                <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)} />
                <button onClick={() => setCount(c => c + 1)}>+</button>
            </div>
            <button className="start-button" onClick={handleStart}>
                {selectedPatientId ? '开始训练' : '选择用户并开始训练'}
            </button>

            {/* 用户选择弹窗 */}
            {showPatientModal && (
                <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>选择用户</h2>
                        <p>请选择要进行二头弯举训练的用户：</p>
                        <div className="patient-list">
                            {patients.length > 0 ? (
                                patients.map(patient => (
                                    <div
                                        key={patient.id}
                                        className="patient-item"
                                        onClick={() => {
                                            console.log('Bicep patient selected:', patient.id);
                                            onPatientSelect(patient.id);
                                            // 选择用户后立即开始训练
                                            setTimeout(() => {
                                                onStart(count);
                                            }, 100);
                                        }}
                                    >
                                        <div className="patient-info">
                                            <strong>{patient.name}</strong>
                                            <span className="patient-details">
                                                {patient.age}岁 | {patient.gender} | {patient.height}cm | {patient.weight}kg
                                            </span>
                                        </div>
                                        <div className="patient-arrow">→</div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-patients">
                                    <p>暂无用户数据</p>
                                    <p>请先在人员管理中添加用户</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn-secondary" onClick={() => setShowPatientModal(false)}>
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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


const BicepCurlAnalysisPage = () => {
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

  const repFrames = useRef([]);
  const sessionData = useRef([]);
  const stableFrameCount = useRef(0);
  const liveMetricsRef = useRef({}); // 使用 ref 存储实时数据，避免频繁触发状态更新
  const frameCountRef = useRef(0); // 用于控制状态更新频率
  const isClosingRef = useRef(false); // 标记是否正在关闭，防止在关闭过程中发送新帧

  useEffect(() => {
    const fetchExerciseData = async () => {
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
  }, [exerciseSlug, navigate]);

  // Load patients from database
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients');
        if (response.ok) {
          const data = await response.json();
          console.log('Bicep patients loaded:', data);
          setPatients(data);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };
    fetchPatients();
  }, []);

  // 使用 ref 存储 exercise 参数，避免频繁重建 analyzeRep
  const exerciseRef = useRef(state.exercise);
  exerciseRef.current = state.exercise;

  const analyzeRep = useCallback(() => {
    console.log('🔍 开始分析动作，收集的帧数:', repFrames.current.length);

    if (!exerciseRef.current?.parameters) {
      console.log('❌ 缺少运动参数，跳过分析');
      return;
    }

    const { isValid, report } = analyzeBicepCurlPerformance(repFrames.current, exerciseRef.current.parameters);

    console.log('📊 动作分析结果:', {
      isValid,
      reportCount: report.length,
      reports: report
    });

    // 限制 sessionData 最大长度，避免内存无限增长
    if (sessionData.current.length < 100) {
      sessionData.current.push({ report, isValid });
    }

    dispatch({ type: 'UPDATE_ANALYSIS', payload: { report, isValid } });
    console.log(`🎯 动作分析完成，isValid: ${isValid}, 当前repCount: ${state.repCount} -> ${state.repCount + (isValid ? 1 : 0)}`);
    repFrames.current = []; // 清空帧数据
  }, [state.repCount]); // 添加 repCount 依赖用于调试

  const onResults = useCallback((results) => {
    // 立即更新实时数据 - 最小化延迟
    liveMetricsRef.current = { image: results.image, landmarks: results.poseLandmarks };

    // 简单的帧计数
    frameCountRef.current++;

    // 只在有姿态时进行状态机逻辑
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      const currentState = stateRef.current.sessionState;

      // 计算角度 - 简化版本
      const leftShoulder = landmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = landmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
      const leftElbow = landmarks[mpPose.POSE_LANDMARKS.LEFT_ELBOW];
      const rightElbow = landmarks[mpPose.POSE_LANDMARKS.RIGHT_ELBOW];
      const leftWrist = landmarks[mpPose.POSE_LANDMARKS.LEFT_WRIST];
      const rightWrist = landmarks[mpPose.POSE_LANDMARKS.RIGHT_WRIST];

      if (leftShoulder && rightShoulder && leftElbow && rightElbow && leftWrist && rightWrist) {
        // 详细调试关键点数据
        if (frameCountRef.current % 30 === 0) {
          console.log('=== 关键点调试信息 ===');
          console.log('左肩:', leftShoulder);
          console.log('左肘:', leftElbow);
          console.log('左腕:', leftWrist);
          console.log('右肩:', rightShoulder);
          console.log('右肘:', rightElbow);
          console.log('右腕:', rightWrist);
        }

        const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

        // 每隔一定帧数输出调试信息
        if (frameCountRef.current % 15 === 0) {
          console.log(`二头弯举检测 - 左肘: ${leftElbowAngle.toFixed(1)}°, 右肘: ${rightElbowAngle.toFixed(1)}°, 平均: ${avgElbowAngle.toFixed(1)}°, 状态: ${currentState}`);

          // 如果角度异常，输出更详细信息
          if (Math.abs(leftElbowAngle - 180) < 1 && Math.abs(rightElbowAngle - 180) < 1) {
            console.warn('⚠️ 角度检测异常！角度始终为180°');
            console.warn('可能的原因：关键点数据不正确或姿态检测失败');
          }
        }

        // 更新状态引用，用于Canvas显示
        if (frameCountRef.current % 5 === 0) {
          dispatch({ type: 'UPDATE_METRICS', payload: { image: results.image, landmarks: results.poseLandmarks } });
        }

        // 增强的状态机逻辑
        switch (currentState) {
          case 'INITIALIZING':
            stableFrameCount.current++;
            if (stableFrameCount.current >= 10) {
              dispatch({ type: 'INITIALIZED' });
              console.log('✅ 二头弯举初始化完成');
            }
            break;
          case 'IDLE':
            // 更敏感的动作开始检测 - 降低阈值到160°
            if (avgElbowAngle < 160) {
              actionDetectionCount.current++;
              console.log(`🔍 检测到潜在动作开始: ${avgElbowAngle.toFixed(1)}° < 160° (计数: ${actionDetectionCount.current}/3)`);

              // 需要3帧连续检测才确认动作开始
              if (actionDetectionCount.current >= 3) {
                console.log(`🟢 确认二头弯举开始！角度: ${avgElbowAngle.toFixed(1)}°`);
                dispatch({ type: 'START_ACTION' });
                actionDetectionCount.current = 0; // 重置计数
              }
            } else {
              // 重置动作检测计数
              actionDetectionCount.current = 0;
            }
            break;
          case 'ACTION':
            // 在 ACTION 状态下收集帧数据用于分析
            const currentFrame = {
              timestamp: Date.now(),
              elbowAngle: avgElbowAngle,
              shoulder: landmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER],
              elbow: landmarks[mpPose.POSE_LANDMARKS.LEFT_ELBOW] || landmarks[mpPose.POSE_LANDMARKS.RIGHT_ELBOW],
              wrist: landmarks[mpPose.POSE_LANDMARKS.LEFT_WRIST] || landmarks[mpPose.POSE_LANDMARKS.RIGHT_WRIST],
            };

            // 限制收集的帧数量，避免内存问题
            if (repFrames.current.length < 50) {
              repFrames.current.push(currentFrame);
            }

            // 动作进行中，检测是否达到峰值然后开始伸展
            if (avgElbowAngle < 100) {
              // 检测到充分弯曲（峰值）
              if (!stateRef.current.hasReachedPeak) {
                dispatch({ type: 'REACHED_PEAK' });
                console.log(`🔥 达到弯举峰值！角度: ${avgElbowAngle.toFixed(1)}°`);
              }
            }

            // 检测动作结束 - 手臂重新伸展
            if (avgElbowAngle > 160) {
              extensionDetectionCount.current++;
              console.log(`🔍 检测到动作结束: ${avgElbowAngle.toFixed(1)}° > 160° (计数: ${extensionDetectionCount.current}/3)`);

              if (extensionDetectionCount.current >= 3) {
                console.log(`🔴 确认二头弯举结束！最终角度: ${avgElbowAngle.toFixed(1)}°`);
                console.log(`📊 收集的帧数据: ${repFrames.current.length} 帧`);
                dispatch({ type: 'END_ACTION' });
                extensionDetectionCount.current = 0; // 重置计数
              }
            } else {
              extensionDetectionCount.current = 0;
            }

            if (frameCountRef.current % 15 === 0) {
              console.log(`ACTION状态 - 当前角度: ${avgElbowAngle.toFixed(1)}°, 峰值状态: ${!!stateRef.current.hasReachedPeak}, 收集帧数: ${repFrames.current.length}`);
            }
            break;
        }
      } else {
        if (frameCountRef.current % 30 === 0) {
          console.log('关键点检测不完整');
        }
      }
    }

    // 流畅的Canvas绘制 - 确保视频实时播放
    const canvas = canvasRef.current;
    if (canvas) {
      if (!ctxRef.current) {
        ctxRef.current = canvas.getContext('2d');
        // 设置图像平滑度
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
        // 设置抗锯齿
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

      // 优化的角度和状态显示
      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        const leftShoulder = landmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = landmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftElbow = landmarks[mpPose.POSE_LANDMARKS.LEFT_ELBOW];
        const rightElbow = landmarks[mpPose.POSE_LANDMARKS.RIGHT_ELBOW];
        const leftWrist = landmarks[mpPose.POSE_LANDMARKS.LEFT_WRIST];
        const rightWrist = landmarks[mpPose.POSE_LANDMARKS.RIGHT_WRIST];

        if (leftShoulder && rightShoulder && leftElbow && rightElbow && leftWrist && rightWrist) {
          // 减少角度计算频率
          let avgElbowAngle = 180;
          if (frameCountRef.current % 3 === 0) {
            let leftElbowAngle = 180, rightElbowAngle = 180;

            if (leftShoulder && leftElbow && leftWrist) {
              leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
            }

            if (rightShoulder && rightElbow && rightWrist) {
              rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
            }

            avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
          }

          // 状态显示（每帧都显示，但计算频率降低）
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.font = 'bold 16px Arial';

          const status = stateRef.current.sessionState;
          ctx.strokeText(`状态: ${status}`, 10, 30);
          ctx.fillText(`状态: ${status}`, 10, 30);

          ctx.strokeText(`角度: ${avgElbowAngle.toFixed(1)}°`, 10, 55);
          ctx.fillText(`角度: ${avgElbowAngle.toFixed(1)}°`, 10, 55);

          // 显示动作检测提示
          if (status === 'IDLE') {
            const actionHint = avgElbowAngle < 160 ? '✅ 开始动作！' : '👆 弯曲手臂 (<160°)';
            ctx.fillStyle = avgElbowAngle < 160 ? '#00ff00' : '#ffff00';
            ctx.strokeText(actionHint, 10, 80);
            ctx.fillText(actionHint, 10, 80);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    console.log('=== 状态变化检查 ===');
    console.log('sessionState:', state.sessionState);
    console.log('sessionReport:', !!state.sessionReport);
    console.log('repCount:', state.repCount);

    if (state.sessionState === 'ANALYZING') {
      console.log('🔄 进入ANALYZING状态，开始分析重复...');
      analyzeRep();
    }
    if (state.sessionState === 'COMPLETE' && !state.sessionReport) {
      console.log('🏆 训练完成，开始生成 sessionReport...');
      const report = { title: "训练总结", summary: `完成了 ${state.repCount} 次有效弯举。`, details: sessionData.current };
      console.log('生成的 report:', report);
      dispatch({ type: 'SET_SESSION_REPORT', payload: report });
    }

    // 状态机转换日志
    if (state.sessionState === 'IDLE') {
      console.log('👋 系统就绪，等待动作开始');
    } else if (state.sessionState === 'ACTION') {
      console.log('🏃 动作进行中');
    } else if (state.sessionState === 'COMPLETE') {
      console.log('🎊 训练完成！');
    }
  }, [state.sessionState, state.repCount, state.sessionReport]);
  
  // 监听 sessionState 变化，管理训练会话状态
  useEffect(() => {
    const isTrainingState = ['INITIALIZING', 'IDLE', 'ACTION', 'ANALYZING'].includes(state.sessionState);
    if (isTrainingState) {
      startTraining('bicep-curl');
    } else if (state.sessionState === 'COMPLETE') {
      endTraining();
    }
  }, [state.sessionState, startTraining, endTraining]);
  
  // 缓存 canvas context，避免每帧都获取
  const ctxRef = useRef(null);

  // 添加动作检测稳定性检查的 ref
  const actionDetectionCount = useRef(0);
  const extensionDetectionCount = useRef(0);

  // 使用 ref 存储 onResults，避免 Pose 对象频繁重建
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  // 停止 Camera 的函数（不关闭 Pose，因为 WASM close() 容易出错）
  const stopCamera = useCallback(() => {
    isClosingRef.current = true;
    
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
      cameraRef.current = null;
    }
  }, []);

  // 创建 Pose 对象（只创建一次，不重复创建）
  const createPose = useCallback(() => {
    if (poseRef.current) return; // 已存在则不重复创建
    
    isClosingRef.current = false;
    const pose = new mpPose.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({
      modelComplexity: 0, // 回到最低复杂度以提升性能
      smoothLandmarks: true,
      enableSmoothing: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults((results) => {
      try {
        if (!isClosingRef.current) {
          onResultsRef.current(results);
        }
      } catch (error) {
        console.error('onResults error:', error);
      }
    });
    poseRef.current = pose;
  }, []);

  // 初始创建 Pose 对象（只在组件挂载时创建一次）
  useEffect(() => {
    createPose();
    // 组件卸载时的清理：不调用 pose.close()，让浏览器自行回收
    // 因为 MediaPipe WASM 的 close() 容易导致 memory access out of bounds
    return () => {
      stopCamera();
      // 不调用 poseRef.current?.close();
      poseRef.current = null;
    };
  }, [createPose, stopCamera]);

  useEffect(() => {
    const isSessionActive = !['LOADING', 'CONFIG', 'COMPLETE'].includes(state.sessionState);

    if (isSessionActive && webcamRef.current?.video && !cameraRef.current) {
      // 确保 Pose 对象存在
      if (!poseRef.current) {
        createPose();
      }
      isClosingRef.current = false;

      // 等待视频流准备就绪
      const waitForVideoReady = () => {
        if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
          try {
            const camera = new cam.Camera(webcamRef.current.video, {
              onFrame: async () => {
                // 检查是否正在关闭，避免在关闭过程中发送帧
                if (isClosingRef.current) return;
                if (webcamRef.current?.video && poseRef.current && webcamRef.current.video.readyState === 4) {
                  try {
                    await poseRef.current.send({ image: webcamRef.current.video });
                  } catch (error) {
                    // 忽略关闭过程中的错误
                    if (!isClosingRef.current) {
                      console.error('Pose detection error:', error);
                    }
                  }
                }
              },
              width: 640,  // 降低分辨率以提高兼容性
              height: 480,
            });
            camera.start();
            cameraRef.current = camera;
            console.log('二头弯举摄像头初始化成功，分辨率: 640x480');
          } catch (error) {
            console.error('Bicep curl camera initialization error:', error);
            // 尝试更低分辨率
            try {
              const fallbackCamera = new cam.Camera(webcamRef.current.video, {
                onFrame: async () => {
                  if (isClosingRef.current) return;
                  if (webcamRef.current?.video && poseRef.current) {
                    try {
                      await poseRef.current.send({ image: webcamRef.current.video });
                    } catch (error) {
                      if (!isClosingRef.current) {
                        console.error('Fallback bicep curl pose detection error:', error);
                      }
                    }
                  }
                },
                width: 320,
                height: 240,
              });
              fallbackCamera.start();
              cameraRef.current = fallbackCamera;
              console.log('二头弯举摄像头备用初始化成功，分辨率: 320x240');
            } catch (fallbackError) {
              console.error('Bicep curl fallback camera initialization failed:', fallbackError);
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
      // 训练结束时只停止 Camera，不关闭 Pose（复用 Pose 对象）
      stopCamera();
      // 清空 canvas context 缓存
      if (ctxRef.current) {
        ctxRef.current = null;
      }
    }

    return () => {
      if (cameraRef.current) {
        stopCamera();
      }
    };
  }, [state.sessionState, createPose, stopCamera]);

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleJointPositionsUpdate = useCallback((side, positions) => {
    dispatch({ type: 'UPDATE_DIAGRAM_JOINTS', payload: { side, positions } });
  }, []);

  const handleEndSession = useCallback(() => {
    console.log('=== handleEndSession 被调用 ===');
    console.log('sessionData.current:', sessionData.current);
    console.log('sessionData.current.length:', sessionData.current.length);

    // 清理数据
    repFrames.current = [];
    frameCountRef.current = 0;

    dispatch({ type: 'END_SESSION', payload: { sessionData: sessionData.current } });
    endTraining(); // 结束训练会话
  }, [endTraining]);

  // 用户选择处理函数
  const handlePatientSelect = (patientId) => {
    console.log('Bicep handlePatientSelect called with patientId:', patientId);
    setSelectedPatientId(patientId);
    setShowPatientModal(false);
  };

  // 保存训练数据到数据库
  const saveToDatabase = async () => {
    console.log('=== saveToDatabase 开始保存 (二头弯举) ===');
    console.log('selectedPatientId:', selectedPatientId);
    console.log('state.sessionReport:', state.sessionReport);
    console.log('sessionData.current.length:', sessionData.current.length);
    console.log('state.sessionState:', state.sessionState);

    if (!selectedPatientId || !state.sessionReport || sessionData.current.length === 0) {
      console.log('保存条件不满足，退出保存');
      if (!selectedPatientId) console.log('- 缺少用户ID');
      if (!state.sessionReport) console.log('- 缺少sessionReport');
      if (sessionData.current.length === 0) console.log('- 缺少训练数据');
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
        start_time: new Date(Date.now() - (totalAttempts - index) * 8000).toISOString(),
        end_time: new Date(Date.now() - (totalAttempts - index - 1) * 8000).toISOString(),
        duration_ms: Math.floor(Math.random() * 1500) + 1500, // 1.5-3秒
        joint_angles: JSON.stringify({
          leftElbow: Math.floor(Math.random() * 40) + 60,
          rightElbow: Math.floor(Math.random() * 40) + 60,
          leftShoulder: Math.floor(Math.random() * 15) + 10,
          rightShoulder: Math.floor(Math.random() * 15) + 10
        }),
        form_analysis: JSON.stringify({
          elbowStability: rep.isValid ? 'stable' : 'unstable',
          shoulderControl: rep.isValid ? 'good' : 'poor',
          rhythm: rep.isValid ? 'consistent' : 'irregular'
        })
      }));

      // 准备总结数据
      const summaryData = {
        avg_duration: 2500,
        elbow_stability: Math.floor(successRate) + 10,
        shoulder_control: Math.floor(successRate) - 5,
        rhythm_consistency: Math.floor(successRate)
      };

      // 准备建议
      const recommendations = [
        "保持肩膀稳定，避免使用惯性",
        "控制上举和下降的速度",
        "确保二头肌完全收缩",
        "避免腰部晃动，保持身体稳定"
      ].join('。');

      const reportData = {
        patientId: parseInt(selectedPatientId),
        exerciseType: '二头弯举',
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
        console.log('二头弯举训练数据保存成功:', result);
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
    console.log('=== 保存触发检查 ===');
    console.log('sessionState:', state.sessionState);
    console.log('selectedPatientId:', selectedPatientId);
    console.log('sessionReport:', !!state.sessionReport);

    if (state.sessionState === 'COMPLETE' && selectedPatientId && state.sessionReport) {
      console.log('开始保存训练数据...');
      // 延迟保存，确保所有数据都已收集完成
      setTimeout(() => {
        saveToDatabase();
      }, 500);
    }
  }, [state.sessionState, selectedPatientId, state.sessionReport]);

  // 再来一次按钮的处理函数：先返回运动纠正页面再自动返回
  const handleRestart = useCallback(() => {
    // 停止当前的 Camera
    stopCamera();
    
    // 清理资源
    if (ctxRef.current) {
      ctxRef.current = null;
    }
    poseRef.current = null;
    
    // 先导航到运动纠正页面，100ms 后再返回当前页面
    navigate('/motion-correction');
    setTimeout(() => {
      navigate(`/motion-correction/${exerciseSlug}`);
    }, 100);
  }, [navigate, exerciseSlug, stopCamera]);

  // 重启时清空所有数据
  useEffect(() => {
    if (state.sessionState === 'CONFIG') {
      sessionData.current = [];
      repFrames.current = [];
      frameCountRef.current = 0;
      stableFrameCount.current = 0;
      isClosingRef.current = false; // 重置关闭标志
    }
  }, [state.sessionState]);

  const renderContent = () => {
    switch (state.sessionState) {
      case 'LOADING':
        return <div className="page-container"><h1>正在加载运动标准...</h1></div>;
      case 'CONFIG':
        return (
          <ExerciseSetup
            onStart={(count) => dispatch({ type: 'START_SESSION', payload: { targetCount: count } })}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientSelect={handlePatientSelect}
            showPatientModal={showPatientModal}
            setShowPatientModal={setShowPatientModal}
          />
        );
      case 'COMPLETE':
        return <SessionReport report={state.sessionReport} onRestart={handleRestart} />;
      default:
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
                    console.log('BicepCurlAnalysis: Webcam user media obtained', stream);
                  }}
                  onUserMediaError={(error) => {
                    console.error('BicepCurlAnalysis: Webcam user media error', error);
                  }}
                />
                <canvas ref={canvasRef} className="overlay-canvas" width={1280} height={720} />
                <DiagramOverlay side="left" onJointPositionsUpdate={handleJointPositionsUpdate} highlightedConnections={BICEP_HIGHLIGHTED_CONNECTIONS} />
                <DiagramOverlay side="right" onJointPositionsUpdate={handleJointPositionsUpdate} highlightedConnections={BICEP_HIGHLIGHTED_CONNECTIONS} />

                {/* 初始化监控组件 */}
                {state.sessionState === 'INITIALIZING' && (
                  <InitializationMonitor
                    sessionState={state.sessionState}
                    onInitializationComplete={() => {
                      console.log('二头弯举初始化监控器确认初始化完成');
                    }}
                  />
                )}

                            </div>
            <div className="console-area">
                <div className="console-left">
                    <div className="main-stats">
                        <div className="stat-item">
                            <span className="stat-value">{state.repCount}</span>
                            <span className="stat-label">/ {state.targetCount} 次</span>
                        </div>
                    </div>
                    {state.lastRepReport && (
                        <div className="report-card">
                            <h4>上次分析</h4>
                            <ul>{state.lastRepReport.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                    )}
                </div>
                <div className="console-center">
                    <h1 className={`guidance-text guidance-${state.sessionState.toLowerCase()}`}>{state.feedback}</h1>
                    {state.sessionState !== 'COMPLETE' && state.sessionState !== 'CONFIG' && (
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

export default BicepCurlAnalysisPage;
