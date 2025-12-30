import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS, POSE_LANDMARKS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import SystemStatus from '../../../components/SystemStatus';
import './SpinalCurvature.css';

const SpinalCurvature = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const navigate = useNavigate();
  const { patientId: urlPatientId } = useParams();
  const [selectedPatientId, setSelectedPatientId] = useState(urlPatientId || null);
  const [patients, setPatients] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    poseRef.current = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return () => {
      poseRef.current.close();
    };
  }, []);

  // Load patients from database
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    let animationFrameId;
    const detect = async () => {
      if (isCameraActive && webcamRef.current?.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        await poseRef.current.send({ image: video });
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    const onResults = (results) => {
      latestLandmarksRef.current = results.poseLandmarks;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!canvas || !ctx) return;

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the current video frame (mirror it like the webcam)
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        ctx.save();
        ctx.scale(-1, 1); // Mirror the video to match webcam display
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (results.poseLandmarks) {
        // --- Custom Line Drawing ---
        const leftShoulder = results.poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = results.poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftHip = results.poseLandmarks[POSE_LANDMARKS.LEFT_HIP];
        const rightHip = results.poseLandmarks[POSE_LANDMARKS.RIGHT_HIP];

        // Draw skeleton lines using mirrored coordinates
        const mirroredLandmarks = results.poseLandmarks.map(landmark => ({
          ...landmark,
          x: 1 - landmark.x // Mirror x-coordinate
        }));
        drawConnectors(ctx, mirroredLandmarks, POSE_CONNECTIONS, { color: '#4f46e5', lineWidth: 2 });
        drawLandmarks(ctx, mirroredLandmarks, { color: '#818cf8', radius: 4 });

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;

          // Calculate midpoints in canvas coordinates
          const shoulderMidpoint = {
            x: (leftShoulder.x + rightShoulder.x) / 2 * canvasWidth,
            y: (leftShoulder.y + rightShoulder.y) / 2 * canvasHeight
          };
          const hipMidpoint = {
            x: (leftHip.x + rightHip.x) / 2 * canvasWidth,
            y: (leftHip.y + rightHip.y) / 2 * canvasHeight
          };

          // Mirror the x-coordinates to match the mirrored video
          const mirroredShoulderX = canvasWidth - shoulderMidpoint.x;
          const mirroredHipX = canvasWidth - hipMidpoint.x;

          // 1. Draw the user's spinal line (in yellow) - mirrored
          ctx.beginPath();
          ctx.moveTo(mirroredShoulderX, shoulderMidpoint.y);
          ctx.lineTo(mirroredHipX, hipMidpoint.y);
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'yellow';
          ctx.stroke();

          // 2. Draw the vertical reference line (in white, dashed) - mirrored
          ctx.beginPath();
          ctx.moveTo(mirroredShoulderX, shoulderMidpoint.y);
          ctx.lineTo(mirroredShoulderX, hipMidpoint.y); // Perfectly vertical line
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'white';
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]); // Reset for other drawings
        }
      }
    };

    if (isCameraActive) {
      poseRef.current.onResults(onResults);
      detect();
    } else {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCameraActive]);

  const startCamera = () => {
    if (selectedPatientId) {
      // 如果已经选择了用户，直接开始检测
      setIsCameraActive(true);
    } else {
      // 如果没有选择用户，显示选择弹窗
      setShowPatientModal(true);
    }
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setShowPatientModal(false);
    setIsCameraActive(true);
  };

  const stopCamera = () => setIsCameraActive(false);

  const analyzePose = () => {
    const landmarks = latestLandmarksRef.current;
    if (!landmarks) {
      alert("未检测到姿态，请确保您在画面中。");
      return;
    }
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    const shoulderMidpoint = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };

    // 计算曲率角度
    const deltaX = hipMidpoint.x - shoulderMidpoint.x;
    const deltaY = hipMidpoint.y - shoulderMidpoint.y;
    const angleRad = Math.atan2(deltaX, deltaY);
    const angleDeg = Math.abs(angleRad * (180 / Math.PI));

    // 计算水平偏移量（相对于垂直线的水平偏移）
    const horizontalOffset = Math.abs(deltaX) * 100; // 转换为百分比

    // 计算脊柱相对长度（肩膀到髋部的垂直距离，用于评估姿态比例）
    const verticalDistance = Math.abs(deltaY);
    const spineLengthRatio = verticalDistance * 100; // 相对于图像高度的比例

    // 脊柱弯曲度颜色编码状态评估
    let status = 'good';
    let assessment = "脊柱曲率正常";
    let statusColor = '#10b981'; // 绿色

    if (angleDeg >= 20) {
      status = 'bad';
      assessment = "明显侧弯，建议就医检查";
      statusColor = '#ef4444'; // 红色
    } else if (angleDeg >= 10) {
      status = 'warning';
      assessment = "轻度侧弯，建议关注";
      statusColor = '#f59e0b'; // 黄色
    } else if (angleDeg >= 5) {
      status = 'warning';
      assessment = "轻微侧弯，建议关注";
      statusColor = '#f59e0b'; // 黄色
    }

    setReport({
      curvatureAngle: angleDeg.toFixed(2),
      horizontalOffset: horizontalOffset.toFixed(2),
      spineLength: spineLengthRatio.toFixed(2),
      assessment: assessment,
      status: status,
      statusColor: statusColor,
    });
  };

  const saveToDatabase = async () => {
    if (!report) {
      alert("没有可保存的分析数据，请先分析姿态。");
      return;
    }

    if (!selectedPatientId) {
      alert("请先选择一位用户。");
      return;
    }

    try {
      // 获取canvas截图
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');

      // 准备评估数据
      const assessmentData = {
        type: "脊柱弯曲度检测",
        curvatureAngle: report.curvatureAngle,
        horizontalOffset: report.horizontalOffset,
        spineLength: report.spineLength,
        assessment: report.assessment,
        status: report.status,
        timestamp: new Date().toISOString()
      };

      console.log('准备保存的数据:', {
        patientId: parseInt(selectedPatientId),
        assessmentData: assessmentData,
        screenshotLength: imageData.length
      });

      // 发送到数据库，使用选择的用户ID
      const response = await fetch('http://localhost:3001/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: parseInt(selectedPatientId),
          assessmentData: assessmentData,
          screenshot: imageData
        })
      });

      console.log('服务器响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('保存成功:', result);
        alert(`分析结果已保存到数据库！记录ID: ${result.id}`);
      } else {
        const errorText = await response.text();
        console.error('服务器错误响应:', errorText);
        throw new Error(`保存失败: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('保存到数据库失败:', error);
      alert(`保存失败: ${error.message}。请检查系统状态或稍后重试。`);
    }
  };

  const generateReport = () => {
    navigate('/spinal-curvature-report', { state: { reportData: report } });
  };

  return (
    <div className="spinal-curvature-container">
      <SystemStatus />
      {selectedPatientId && (
        <div className="patient-info-bar">
          <span className="patient-label">当前用户:</span>
          <span className="patient-name">
            {patients.find(p => p.id === parseInt(selectedPatientId))?.name || `ID: ${selectedPatientId}`}
          </span>
          <button className="change-patient-btn" onClick={() => setShowPatientModal(true)}>
            更换用户
          </button>
        </div>
      )}
      <div className="content-wrapper">
        <div className="capture-area">
          <h1 className="page-title">脊柱弯曲度检测</h1>
        <div className="video-container">
          {isCameraActive ? (
            <Webcam ref={webcamRef} className="webcam-feed" mirrored={true} videoConstraints={{ width: 1280, height: 720 }} />
          ) : (
            <div className="video-placeholder"><p>请启动摄像头以开始检测</p></div>
          )}
          <canvas ref={canvasRef} className="overlay-canvas" />
        </div>
        <div className="controls">
          {!isCameraActive ? (
            <button onClick={startCamera} className="control-btn start">开始检测</button>
          ) : (
            <>
              <button onClick={stopCamera} className="control-btn stop">停止摄像头</button>
              <button onClick={analyzePose} className="control-btn analyze">分析姿态</button>
            </>
          )}
        </div>
      </div>
      <div className="report-area">
        <h2 className="report-title">分析报告</h2>
        {report ? (
          <div className="report-content">
            <div className={`result-card status-${report.status}`}>
              <div className="angle-display" style={{ color: report.statusColor }}>
                <span className="angle-value">{report.curvatureAngle}°</span>
                <span className="angle-label">脊柱倾斜角度</span>
              </div>
              <div className="measurements-grid">
                <div className="measurement-item">
                  <span className="measurement-value">{report.horizontalOffset}%</span>
                  <span className="measurement-label">水平偏移量</span>
                </div>
                <div className="measurement-item">
                  <span className="measurement-value">{report.spineLength}%</span>
                  <span className="measurement-label">躯干垂直比例</span>
                </div>
              </div>
              <div className="assessment-result" style={{ color: report.statusColor }}>
                <span className="assessment-icon" style={{ color: report.statusColor }}>
                  {report.status === 'good' ? '✓' : report.status === 'warning' ? '⚠' : '⚠'}
                </span>
                <span className="assessment-text">{report.assessment}</span>
              </div>
            </div>
            <div className="report-actions" style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button onClick={saveToDatabase} className="control-btn save">保存至数据库</button>
              <button onClick={generateReport} className="control-btn">生成详细报告</button>
            </div>
          </div>
        ) : (
          <div className="report-placeholder"><p>点击"分析姿态"后，分析结果将显示在这里。</p></div>
        )}
        </div>
      </div>

      {/* 用户选择弹窗 */}
      {showPatientModal && (
        <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>选择用户</h2>
            <p>请选择要进行脊柱弯曲度检测的用户：</p>
            <div className="patient-list">
              {patients.length > 0 ? (
                patients.map(patient => (
                  <div
                    key={patient.id}
                    className="patient-item"
                    onClick={() => handlePatientSelect(patient.id)}
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

export default SpinalCurvature;
